import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const area = (body?.area || '').trim();
    const industry = (body?.industry || '').trim();
    if (!area || !industry) {
      return Response.json({ error: 'area and industry are required' }, { status: 400 });
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

    return Response.json({ leads: result.leads || [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}