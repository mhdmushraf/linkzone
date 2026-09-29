import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { stripeApi, ensurePlanPrice, ensureSetupFeePrice, retrieveCard, appId } from '../../shared/stripe.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { organizationId, subId, customerId, paymentMethodId, plan, billingCycle } = body;
    if (!organizationId || !subId || !customerId || !paymentMethodId || !plan) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const admin = base44.asServiceRole;
    // verify the user is a member of this organization
    const orgs = await admin.entities.Organization.filter({ id: organizationId });
    if (!orgs.length || !((orgs[0].data.members || []).includes(user.id))) {
      return Response.json({ error: 'Not a member of this organization' }, { status: 403 });
    }
    // save the card as the customer's default for off-session charges
    await stripeApi(`customers/${customerId}`, {
      invoice_settings: { default_payment_method: paymentMethodId },
    }, 'POST');
    const card = await retrieveCard(paymentMethodId);
    const cycle = billingCycle || 'monthly';
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const minTermMonths = cycle === 'annual' ? 12 : 3;
    const minTermEnd = new Date(trialEnd.getTime() + minTermMonths * 30 * 24 * 60 * 60 * 1000);

    if (plan === 'enterprise') {
      // custom pricing — no automated Stripe subscription
      await admin.entities.Subscription.update(subId, {
        stripe_customer_id: customerId,
        card_brand: card.brand,
        card_last4: card.last4,
        trial_end: trialEnd.toISOString(),
        min_term_end: minTermEnd.toISOString(),
        setup_fee: 0,
        setup_fee_paid: true,
      });
      return Response.json({ manual: true, trialEnd: trialEnd.toISOString() });
    }

    const { priceId } = await ensurePlanPrice(plan, cycle);
    const anchor = Math.floor(trialEnd.getTime() / 1000);
    // Future billing_cycle_anchor => first invoice on day 14 (nothing today).
    // add_invoice_items puts the setup fee on that first (day-14) invoice.
    const subParams = {
      customer: customerId,
      items: [{ price: priceId }],
      billing_cycle_anchor: anchor,
      proration_behavior: 'none',
      metadata: { linkzone_org: organizationId, base44_app_id: appId() },
    };
    if (cycle === 'monthly') {
      const setupPriceId = await ensureSetupFeePrice();
      subParams.add_invoice_items = [{ price: setupPriceId, quantity: 1 }];
    }
    const created = await stripeApi('subscriptions', subParams, 'POST');
    await admin.entities.Subscription.update(subId, {
      stripe_customer_id: customerId,
      stripe_subscription_id: created.id,
      card_brand: card.brand,
      card_last4: card.last4,
      trial_end: trialEnd.toISOString(),
      min_term_end: minTermEnd.toISOString(),
      setup_fee: cycle === 'monthly' ? 500 : 0,
    });
    return Response.json({ subscriptionId: created.id, trialEnd: trialEnd.toISOString() });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}