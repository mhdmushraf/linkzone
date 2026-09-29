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
    const now = new Date();
    // Manual / enterprise subscription (no Stripe sub) — cancel locally
    if (!d.stripe_subscription_id) {
      const until = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await admin.entities.Subscription.update(sub.id, {
        status: 'cancelled',
        cancelled_date: now.toISOString(),
        read_only_until: until,
        pending_cancel: false,
      });
      return Response.json({ ok: true, cancelledAt: now.toISOString() });
    }
    const minEnd = d.min_term_end ? new Date(d.min_term_end) : null;
    if (minEnd && now < minEnd) {
      // within minimum term — schedule cancellation at min term end
      await stripeApi(`subscriptions/${d.stripe_subscription_id}`, {
        cancel_at: Math.floor(minEnd.getTime() / 1000),
      }, 'POST');
      await admin.entities.Subscription.update(sub.id, {
        pending_cancel: true,
        cancel_at: minEnd.toISOString(),
      });
      return Response.json({ ok: true, cancelAt: minEnd.toISOString() });
    }
    // past the minimum term — cancel at period end
    const s = await stripeApi(`subscriptions/${d.stripe_subscription_id}`, {}, 'GET');
    const periodEnd = s.current_period_end ? new Date(s.current_period_end * 1000).toISOString() : null;
    await stripeApi(`subscriptions/${d.stripe_subscription_id}`, {
      cancel_at_period_end: true,
    }, 'POST');
    await admin.entities.Subscription.update(sub.id, {
      pending_cancel: true,
      cancel_at: periodEnd,
    });
    return Response.json({ ok: true, cancelAt: periodEnd });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}