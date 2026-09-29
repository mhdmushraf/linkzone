import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { stripeApi, appId } from '../../shared/stripe.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const admin = base44.asServiceRole;
    let customerId = null;
    const orgId = user.data && user.data.organization_id;
    let sub = null;
    if (orgId) {
      const subs = await admin.entities.Subscription.filter({ organization_id: orgId });
      if (subs.length) sub = subs[0];
    }
    if (sub && sub.data && sub.data.stripe_customer_id) {
      customerId = sub.data.stripe_customer_id;
    } else {
      const cust = await stripeApi('customers', {
        email: user.email,
        name: (user.data && user.data.name) || user.full_name || undefined,
        metadata: { linkzone_user: user.id, base44_app_id: appId() },
      }, 'POST');
      customerId = cust.id;
      if (sub) {
        await admin.entities.Subscription.update(sub.id, { stripe_customer_id: customerId });
      }
    }
    const si = await stripeApi('setup_intents', {
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: { linkzone_user: user.id, base44_app_id: appId() },
    }, 'POST');
    return Response.json({ clientSecret: si.client_secret, customerId });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}