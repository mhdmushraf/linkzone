import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { verifyStripeSignature } from '../../shared/stripe.ts';
import { secrets } from "base44:runtime";

export default async function(req) {
  try {
    const rawBody = await req.text();
    const sigHeader = req.headers.get('stripe-signature');
    const secret = secrets.get('STRIPE_WEBHOOK_SECRET');
    const ok = await verifyStripeSignature(rawBody, sigHeader, secret);
    if (!ok) return Response.json({ error: 'Invalid signature' }, { status: 400 });
    const event = JSON.parse(rawBody);
    const base44 = createClientFromRequest(req);
    const admin = base44.asServiceRole;

    const findByCustomer = async (cid) => {
      if (!cid) return null;
      const subs = await admin.entities.Subscription.filter({ stripe_customer_id: cid });
      return subs[0] || null;
    };
    const findBySub = async (sid) => {
      if (!sid) return null;
      const subs = await admin.entities.Subscription.filter({ stripe_subscription_id: sid });
      return subs[0] || null;
    };

    switch (event.type) {
      case 'invoice.paid': {
        const inv = event.data && event.data.object;
        // ignore $0 trial invoices — only react to a real charge
        if (!inv || (inv.total || 0) <= 0) break;
        const sub = await findByCustomer(inv.customer);
        if (sub) {
          await admin.entities.Subscription.update(sub.id, {
            status: 'active',
            setup_fee_paid: true,
          });
        }
        break;
      }
      case 'invoice.payment_failed': {
        const inv = event.data && event.data.object;
        const sub = await findByCustomer(inv && inv.customer);
        if (sub) {
          await admin.entities.Subscription.update(sub.id, { status: 'past_due' });
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const s = event.data && event.data.object;
        const sub = (await findBySub(s && s.id)) || (await findByCustomer(s && s.customer));
        if (sub) {
          const until = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          await admin.entities.Subscription.update(sub.id, {
            status: 'cancelled',
            cancelled_date: new Date().toISOString(),
            read_only_until: until,
            pending_cancel: false,
            stripe_subscription_id: null,
          });
        }
        break;
      }
      case 'customer.subscription.trial_will_end': {
        // The "card will be charged on DATE" banner is derived client-side from trial_end.
        break;
      }
    }
    return Response.json({ received: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}