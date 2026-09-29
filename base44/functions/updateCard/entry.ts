import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { stripeApi, retrieveCard } from '../../shared/stripe.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { setupIntentId } = body;
    if (!setupIntentId) return Response.json({ error: 'setupIntentId required' }, { status: 400 });
    const admin = base44.asServiceRole;
    const orgId = user.data && user.data.organization_id;
    if (!orgId) return Response.json({ error: 'No organization' }, { status: 400 });
    const subs = await admin.entities.Subscription.filter({ organization_id: orgId });
    const sub = subs[0];
    if (!sub) return Response.json({ error: 'No subscription' }, { status: 404 });
    const customerId = sub.data.stripe_customer_id;
    if (!customerId) return Response.json({ error: 'No Stripe customer on file' }, { status: 400 });
    const si = await stripeApi(`setup_intents/${setupIntentId}`, {}, 'GET');
    const pmId = si.payment_method;
    if (!pmId) return Response.json({ error: 'No payment method on SetupIntent' }, { status: 400 });
    await stripeApi(`customers/${customerId}`, {
      invoice_settings: { default_payment_method: pmId },
    }, 'POST');
    const card = await retrieveCard(pmId);
    await admin.entities.Subscription.update(sub.id, { card_brand: card.brand, card_last4: card.last4 });
    return Response.json({ ok: true, card });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}