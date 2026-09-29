import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { stripeApi, ensurePlanPrice, PLAN_AMOUNTS } from '../../shared/stripe.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { billingCycle } = body;
    if (!billingCycle || (billingCycle !== 'monthly' && billingCycle !== 'annual')) {
      return Response.json({ error: 'billingCycle required' }, { status: 400 });
    }
    const admin = base44.asServiceRole;
    const orgId = user.data && user.data.organization_id;
    if (!orgId) return Response.json({ error: 'No organization' }, { status: 400 });
    const subs = await admin.entities.Subscription.filter({ organization_id: orgId });
    const sub = subs[0];
    if (!sub) return Response.json({ error: 'No subscription' }, { status: 404 });
    const d = sub.data;
    const amounts = PLAN_AMOUNTS[d.plan];
    const newAmount = amounts ? (billingCycle === 'annual' ? amounts.annual : amounts.monthly) : null;
    // No Stripe subscription (enterprise / manual) — update record only
    if (!d.stripe_subscription_id || !amounts) {
      await admin.entities.Subscription.update(sub.id, {
        billing_cycle: billingCycle,
        amount: newAmount || 0,
        setup_fee: billingCycle === 'annual' ? 0 : (d.setup_fee || 0),
      });
      return Response.json({ ok: true });
    }
    const { priceId } = await ensurePlanPrice(d.plan, billingCycle);
    const s = await stripeApi(`subscriptions/${d.stripe_subscription_id}`, {}, 'GET');
    const itemId = s.items && s.items.data && s.items.data[0] && s.items.data[0].id;
    if (!itemId) return Response.json({ error: 'No subscription item found' }, { status: 400 });
    await stripeApi(`subscriptions/${d.stripe_subscription_id}`, {
      items: [{ id: itemId, price: priceId }],
      proration_behavior: 'none',
    }, 'POST');
    await admin.entities.Subscription.update(sub.id, {
      billing_cycle: billingCycle,
      amount: newAmount || 0,
      setup_fee: billingCycle === 'annual' ? 0 : (d.setup_fee || 0),
    });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}