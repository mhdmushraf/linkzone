import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const inviteId = body?.inviteId;
    if (!inviteId) return Response.json({ error: 'inviteId required' }, { status: 400 });

    const admin = base44.asServiceRole;

    // Fetch the invite (service role bypasses RLS)
    const invites = await admin.entities.TeamInvite.filter({ id: inviteId, email: user.email, status: 'pending' });
    if (invites.length === 0) {
      return Response.json({ error: 'No pending invite found' }, { status: 404 });
    }
    const invite = invites[0];
    const orgId = invite.data.organization_id;

    // Add the user to the org's members array
    const orgs = await admin.entities.Organization.filter({ id: orgId });
    if (orgs.length > 0) {
      const org = orgs[0];
      const members = [...(org.data.members || []), user.id];
      await admin.entities.Organization.update(orgId, { members });
    }

    // Mark the invite accepted
    await admin.entities.TeamInvite.update(inviteId, { status: 'accepted' });

    return Response.json({ ok: true, organization_id: orgId, app_role: invite.data.app_role });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}