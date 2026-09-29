import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { stripeApi } from '../../shared/stripe.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const admin = base44.asServiceRole;
    const orgId = user.data && user.data.organization_id;
    if (!orgId) return Response.json({ error: 'No organization' }, { status: 400 });
    const subs = await admin.entities.Subscription.filter({ organization_id: orgId });
    const sub = subs[0];
    if (!sub) return Response.json({ error: 'No subscription' }, { status: 404 });
    const d = sub.data;
    const out = {
      card: { brand: d.card_brand, last4: d.card_last4 },
      nextChargeDate: d.trial_end || null,
      nextChargeAmount: null,
      invoices: [],
      pendingCancel: !!d.pending_cancel,
      cancelAt: d.cancel_at || null,
      status: d.status,
      plan: d.plan,
      billingCycle: d.billing_cycle,
      trialEnd: d.trial_end,
    };
    if (d.stripe_subscription_id && d.stripe_customer_id) {
      try {
        const s = await stripeApi(`subscriptions/${d.stripe_subscription_id}`, {}, 'GET');
        const periodEnd = s.current_period_end ? new Date(s.current_period_end * 1000).toISOString() : null;
        out.nextChargeDate = periodEnd;
        try {
          const preview = await stripeApi('invoices/create_preview', {
            customer: d.stripe_customer_id,
            subscription: d.stripe_subscription_id,
          }, 'POST');
          out.nextChargeAmount = preview.total ? preview.total / 100 : null;
          if (preview.next_payment_attempt) {
            out.nextChargeDate = new Date(preview.next_payment_attempt * 1000).toISOString();
          }
        } catch (e) {
          // preview may fail for canceled subs; fall back to period end
        }
      } catch (e) {}
      try {
        const invList = await stripeApi('invoices', {
          customer: d.stripe_customer_id,
          subscription: d.stripe_subscription_id,
          limit: 12,
        }, 'GET');
        out.invoices = (invList.data || []).map((inv) => ({
          id: inv.id,
          number: inv.number,
          amount: inv.total ? inv.total / 100 : 0,
          currency: inv.currency,
          status: inv.status,
          created: inv.created ? new Date(inv.created * 1000).toISOString() : null,
          url: inv.hosted_invoice_url,
        }));
      } catch (e) {}
    }
    return Response.json(out);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}