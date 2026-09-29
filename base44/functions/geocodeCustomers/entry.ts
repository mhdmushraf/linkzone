import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function readOnly(sub) {
  if (!sub) return false;
  const s = sub.data.status;
  if (s !== 'cancelled' && s !== 'read_only') return false;
  if (sub.data.read_only_until) return new Date(sub.data.read_only_until) > new Date();
  return true;
}

async function geocode(q) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
  const r = await fetch(url, { headers: { 'User-Agent': 'Linkzone/1.0', 'Accept-Language': 'en' } });
  if (!r.ok) return null;
  const arr = await r.json();
  if (!arr || !arr.length) return null;
  return { lat: parseFloat(arr[0].lat), lng: parseFloat(arr[0].lon) };
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
    if (readOnly(sub)) return Response.json({ error: 'Account is read-only', read_only: true }, { status: 403 });

    const customers = await base44.entities.Customer.filter({ organization_id: orgId }, '-created_date', 500);
    const need = customers.filter((c) => (c.data.lat == null || c.data.lng == null) && (c.data.address || c.data.area));
    const batch = need.slice(0, 25);

    let located = 0;
    for (const c of batch) {
      const q = [c.data.address, c.data.area].filter(Boolean).join(', ');
      try {
        const coords = await geocode(q);
        if (coords) {
          await base44.entities.Customer.update(c.id, { lat: coords.lat, lng: coords.lng });
          located++;
        }
      } catch (e) {
        console.error('geocode failed', c.id, e.message);
      }
      await sleep(1000); // Nominatim 1 request/second
    }

    return Response.json({ located, attempted: batch.length, remaining: Math.max(0, need.length - batch.length) });
  } catch (error) {
    console.error('geocodeCustomers error', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}