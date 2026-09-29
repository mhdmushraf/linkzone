import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const TRIAL_LEAD_LIMIT = 50;
const PLAN_LEAD_LIMITS = { starter: 100, growth: 500, enterprise: null };
const currentMonth = () => new Date().toISOString().slice(0, 7);

function readOnly(sub) {
  if (!sub) return false;
  const s = sub.data.status;
  if (s !== 'cancelled' && s !== 'read_only') return false;
  if (sub.data.read_only_until) return new Date(sub.data.read_only_until) > new Date();
  return true;
}

// Map Linkzone industries to OSM tags. "Other" => LLM only (no Overpass).
const OSM_TAGS = {
  'Grocery / Mini mart': ['shop=convenience', 'shop=supermarket', 'shop=grocery'],
  Pharmacy: ['amenity=pharmacy'],
  Electronics: ['shop=electronics'],
  Hardware: ['shop=hardware', 'shop=doityourself'],
  Bakery: ['shop=bakery'],
  Beverages: ['shop=beverages'],
  Cosmetics: ['shop=cosmetics', 'shop=beauty'],
  'Office supplies': ['shop=stationery'],
};

function bboxFromCenter(lat, lng, radiusKm) {
  const R = 6378.1;
  const latR = (radiusKm / R) * (180 / Math.PI);
  const lngR = (radiusKm / (R * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI);
  return { south: lat - latR, west: lng - lngR, north: lat + latR, east: lng + lngR };
}

async function geocodeArea(area) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(area)}`;
  const r = await fetch(url, { headers: { 'User-Agent': 'Linkzone/1.0', 'Accept-Language': 'en' } });
  if (!r.ok) return null;
  const arr = await r.json();
  if (!arr || !arr.length) return null;
  const hit = arr[0];
  const lat = parseFloat(hit.lat);
  const lng = parseFloat(hit.lon);
  let bbox;
  if (hit.boundingbox && hit.boundingbox.length === 4) {
    bbox = { south: parseFloat(hit.boundingbox[0]), north: parseFloat(hit.boundingbox[1]), west: parseFloat(hit.boundingbox[2]), east: parseFloat(hit.boundingbox[3]) };
  } else {
    bbox = bboxFromCenter(lat, lng, 5);
  }
  return { lat, lng, bbox };
}

function buildOverpass(tags, bbox) {
  const { south, west, north, east } = bbox;
  const parts = [];
  for (const t of tags) {
    const [k, v] = t.split('=');
    parts.push(`node["${k}"="${v}"](${south},${west},${north},${east});`);
    parts.push(`way["${k}"="${v}"](${south},${west},${north},${east});`);
  }
  return `[out:json][timeout:20];(${parts.join('')});out center tags 80;`;
}

async function queryOverpass(tags, bbox) {
  if (!tags || !tags.length) return [];
  const data = buildOverpass(tags, bbox);
  const r = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'data=' + encodeURIComponent(data),
  });
  if (!r.ok) return [];
  const j = await r.json();
  return j.elements || [];
}

function osmToLead(el, fallbackArea, industry) {
  const t = el.tags || {};
  const name = t.name || t.brand || t.operator || null;
  if (!name) return null;
  const lat = el.lat != null ? el.lat : el.center && el.center.lat;
  const lng = el.lon != null ? el.lon : el.center && el.center.lon;
  if (lat == null || lng == null) return null;
  const addrParts = [t['addr:housenumber'], t['addr:street'], t['addr:suburb'], t['addr:city'], t['addr:neighbourhood']].filter(Boolean);
  const address = addrParts.length ? addrParts.join(' ') : fallbackArea || '';
  const phone = t.phone || t['contact:phone'] || t['phone:mobile'] || null;
  const whatsapp = t['contact:whatsapp'] || null;
  return {
    business_name: name,
    contact_name: t['contact:name'] || null,
    phone,
    whatsapp_number: whatsapp,
    address,
    area: fallbackArea || '',
    industry,
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    osm: true,
  };
}

function norm(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}
function nameMatch(a, b) {
  const na = norm(a), nb = norm(b);
  if (!na || !nb) return false;
  if (na === nb || na.includes(nb) || nb.includes(na)) return true;
  const ta = new Set(na.split(' ').filter((x) => x.length > 2));
  const tb = new Set(nb.split(' ').filter((x) => x.length > 2));
  if (!ta.size || !tb.size) return false;
  let common = 0;
  ta.forEach((x) => { if (tb.has(x)) common++; });
  return common >= 2 && common / Math.min(ta.size, tb.size) >= 0.5;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const orgId = user.data?.organization_id;
    if (!orgId) return Response.json({ error: 'No organization' }, { status: 400 });

    const subs = await base44.asServiceRole.entities.Subscription.filter({ organization_id: orgId });
    const sub = subs[0];

    if (readOnly(sub)) {
      const until = sub && sub.data.read_only_until ? new Date(sub.data.read_only_until).toISOString().slice(0, 10) : null;
      return Response.json({ error: 'Account is in read-only mode', read_only: true, read_only_until: until, leads: [] }, { status: 403 });
    }

    const body = await req.json();
    const area = (body?.area || '').trim();
    const industry = (body?.industry || '').trim();
    const radiusKm = Math.min(Math.max(parseFloat(body?.radius_km) || 5, 1), 10);
    const reqCenter = body?.center && typeof body.center.lat === 'number' && typeof body.center.lng === 'number' ? body.center : null;

    if (!industry) return Response.json({ error: 'industry is required' }, { status: 400 });
    if (!area && !reqCenter) return Response.json({ error: 'area or center is required' }, { status: 400 });

    const isTrial = sub?.data?.status === 'trial';
    let allowance, used;
    if (isTrial) {
      allowance = TRIAL_LEAD_LIMIT;
      used = sub.data.lead_pulls_trial_used || 0;
    } else {
      allowance = PLAN_LEAD_LIMITS[sub?.data?.plan] ?? null;
      const month = currentMonth();
      used = sub?.data.lead_pulls_month === month ? sub.data.lead_pulls_used || 0 : 0;
    }
    if (allowance !== null && used >= allowance) {
      return Response.json({ error: 'Lead pull limit reached', limit_reached: true, allowance, used, trial: isTrial, leads: [] }, { status: 429 });
    }

    // Resolve center + bbox
    let center, bbox;
    if (reqCenter) {
      center = { lat: reqCenter.lat, lng: reqCenter.lng };
      bbox = bboxFromCenter(center.lat, center.lng, radiusKm);
    } else {
      const geo = await geocodeArea(area);
      if (!geo) {
        return Response.json({ leads: [], center: null, bbox: null, geocode_failed: true, usage: { allowance, used: used + 1, trial: isTrial } });
      }
      center = { lat: geo.lat, lng: geo.lng };
      bbox = geo.bbox;
    }

    // OSM POIs
    const tags = OSM_TAGS[industry];
    let osmLeads = [];
    if (tags) {
      const els = await queryOverpass(tags, bbox);
      const seen = new Set();
      for (const el of els) {
        const lead = osmToLead(el, area, industry);
        if (!lead) continue;
        const key = norm(lead.business_name) + '|' + lead.lat.toFixed(3) + ',' + lead.lng.toFixed(3);
        if (seen.has(key)) continue;
        seen.add(key);
        osmLeads.push(lead);
      }
      osmLeads = osmLeads.slice(0, 40);
    }

    // LLM step: fill missing phones + add businesses OSM lacks (no coords)
    const placeDesc = area || `the area near ${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`;
    const llmResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Find real ${industry} businesses (shops, stores, retailers) located in or around ${placeDesc}. Return up to 15 results as JSON. For each include: business_name, contact_name (owner/manager if known, else null), phone (with country code if known, else null), whatsapp_number (if known, else null), address, area. Only include businesses that plausibly exist. Do not invent phone numbers — leave null when unknown.`,
      add_context_from_internet: true,
      model: 'gemini_3_8_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          leads: { type: 'array', items: { type: 'object', properties: {
            business_name: { type: 'string' }, contact_name: { type: ['string', 'null'] },
            phone: { type: ['string', 'null'] }, whatsapp_number: { type: ['string', 'null'] },
            address: { type: 'string' }, area: { type: 'string' },
          }, required: ['business_name', 'address', 'area'] } },
        },
        required: ['leads'],
      },
    });
    const llmLeads = llmResult.leads || [];
    const extras = [];
    for (const llm of llmLeads) {
      const match = osmLeads.find((o) => !o._filled && nameMatch(o.business_name, llm.business_name));
      if (match) {
        if (!match.phone && llm.phone) match.phone = llm.phone;
        if (!match.whatsapp_number && llm.whatsapp_number) match.whatsapp_number = llm.whatsapp_number;
        if (!match.contact_name && llm.contact_name) match.contact_name = llm.contact_name;
        match._filled = true;
      } else {
        extras.push({ business_name: llm.business_name, contact_name: llm.contact_name || null, phone: llm.phone || null, whatsapp_number: llm.whatsapp_number || null, address: llm.address, area: llm.area || area, industry, lat: null, lng: null, osm: false });
      }
    }

    let leads = [...osmLeads, ...extras].map(({ _filled, ...rest }) => rest).slice(0, 40);

    // Increment usage
    try {
      if (isTrial) {
        await base44.asServiceRole.entities.Subscription.update(sub.id, { lead_pulls_trial_used: (sub.data.lead_pulls_trial_used || 0) + 1 });
      } else {
        const month = currentMonth();
        const upd = sub.data.lead_pulls_month === month ? { lead_pulls_used: (sub.data.lead_pulls_used || 0) + 1 } : { lead_pulls_used: 1, lead_pulls_month: month };
        await base44.asServiceRole.entities.Subscription.update(sub.id, upd);
      }
    } catch (e) {
      console.error('usage increment failed', e.message);
    }

    return Response.json({ leads, center, bbox, usage: { allowance, used: used + 1, trial: isTrial } });
  } catch (error) {
    console.error('findLeads error', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}