import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const TRIAL_LEAD_LIMIT = 50;
const PLAN_LEAD_LIMITS = {
  starter: 100,
  growth: 500,
  enterprise: null, // unlimited / custom
};

const currentMonth = () => new Date().toISOString().slice(0, 7);

function readOnly(sub) {
  if (!sub) return false;
  const s = sub.data.status;
  if (s !== 'cancelled' && s !== 'read_only') return false;
  if (sub.data.read_only_until) {
    return new Date(sub.data.read_only_until) > new Date();
  }
  return true;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const orgId = user.data?.organization_id;
    if (!orgId) return Response.json({ error: 'No organization' }, { status: 400 });

    // Load the org's subscription (service role to read regardless of RLS quirks)
    const subs = await base44.asServiceRole.entities.Subscription.filter({ organization_id: orgId });
    const sub = subs[0];

    // Enforce read-only lockout
    if (readOnly(sub)) {
      const until = sub.data.read_only_until
        ? new Date(sub.data.read_only_until).toISOString().slice(0, 10)
        : null;
      return Response.json(
        { error: 'Account is in read-only mode', read_only: true, read_only_until: until, leads: [] },
        { status: 403 }
      );
    }

    const body = await req.json();
    const area = (body?.area || '').trim();
    const industry = (body?.industry || '').trim();
    if (!area || !industry) {
      return Response.json({ error: 'area and industry are required' }, { status: 400 });
    }

    // Determine allowance + usage
    const isTrial = sub?.data?.status === 'trial';
    let allowance;
    let used;
    if (isTrial) {
      allowance = TRIAL_LEAD_LIMIT;
      used = sub.data.lead_pulls_trial_used || 0;
    } else {
      allowance = PLAN_LEAD_LIMITS[sub?.data?.plan] ?? null;
      const month = currentMonth();
      used = sub?.data?.lead_pulls_month === month ? sub.data.lead_pulls_used || 0 : 0;
    }

    if (allowance !== null && used >= allowance) {
      return Response.json(
        {
          error: 'Lead pull limit reached',
          limit_reached: true,
          allowance,
          used,
          trial: isTrial,
          leads: [],
        },
        { status: 429 }
      );
    }

    const prompt = `Find real ${industry} businesses (shops, stores, retailers, dealers) located in or around ${area}.
Return up to 12 results as JSON. For each business include: business_name, contact_name (owner/manager if known, otherwise null), phone (with country code if available, otherwise null), whatsapp_number (if known, otherwise null), address (street or area), area (neighborhood/locality), and industry.
Only include businesses that plausibly exist. Do not invent phone numbers — leave null when unknown. Prefer local independent shops over large chains.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: 'gemini_3_8_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          leads: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                business_name: { type: 'string' },
                contact_name: { type: ['string', 'null'] },
                phone: { type: ['string', 'null'] },
                whatsapp_number: { type: ['string', 'null'] },
                address: { type: 'string' },
                area: { type: 'string' },
                industry: { type: 'string' },
              },
              required: ['business_name', 'address', 'area', 'industry'],
            },
          },
        },
        required: ['leads'],
      },
    });

    const leads = result.leads || [];

    // Increment usage counters (service role, robust to RLS)
    try {
      if (isTrial) {
        await base44.asServiceRole.entities.Subscription.update(sub.id, {
          lead_pulls_trial_used: (sub.data.lead_pulls_trial_used || 0) + 1,
        });
      } else {
        const month = currentMonth();
        const update =
          sub.data.lead_pulls_month === month
            ? { lead_pulls_used: (sub.data.lead_pulls_used || 0) + 1 }
            : { lead_pulls_used: 1, lead_pulls_month: month };
        await base44.asServiceRole.entities.Subscription.update(sub.id, update);
      }
    } catch (e) {
      console.error('usage increment failed', e.message);
    }

    return Response.json({
      leads,
      usage: {
        allowance,
        used: used + 1,
        trial: isTrial,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}