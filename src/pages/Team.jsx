import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useOrg } from "@/lib/OrgContext";
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { UserCog, Plus, Loader2, Mail, Clock, Route as RouteIcon } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const ROLES = ["manager", "sales", "viewer"];

export default function Team() {
  const { organization, team, appRole, user, refresh } = useOrg();
  const orgId = organization?.id;
  const canManage = appRole === "owner" || appRole === "manager";
  const [routes, setRoutes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", app_role: "sales", route_ids: [] });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!orgId) return;
    setLoading(true);
    const [r, c, inv] = await Promise.all([
      base44.entities.Route.filter({ organization_id: orgId }, "-created_date", 500),
      base44.entities.Customer.filter({ organization_id: orgId }, "-created_date", 500),
      base44.entities.TeamInvite.filter({ organization_id: orgId }, "-created_date", 100),
    ]);
    setRoutes(r);
    setCustomers(c);
    setInvites(inv.filter((i) => i.data.status === "pending"));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [orgId]);

  const invite = async () => {
    setSaving(true);
    try {
      await base44.users.inviteUser(form.email, "user");
      await base44.entities.TeamInvite.create({
        email: form.email,
        organization_id: orgId,
        app_role: form.app_role,
        route_ids: form.route_ids,
        status: "pending",
        invited_by: user.id,
      });
      toast({ title: "Invitation sent", description: form.email });
      setOpen(false);
      setForm({ email: "", app_role: "sales", route_ids: [] });
      load();
    } catch (e) {
      toast({ title: "Failed to invite", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const cancelInvite = async (inv) => {
    await base44.entities.TeamInvite.delete(inv.id);
    load();
  };

  const toggleRoute = (routeId) => {
    setForm((f) => ({
      ...f,
      route_ids: f.route_ids.includes(routeId) ? f.route_ids.filter((r) => r !== routeId) : [...f.route_ids, routeId],
    }));
  };

  const assignRoute = async (routeId, memberId) => {
    try {
      await base44.entities.Route.update(routeId, { assigned_to: memberId });
      toast({ title: "Route assigned" });
      load();
      refresh();
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  const shopCount = (routeId) => customers.filter((c) => c.data.route_id === routeId).length;

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        action={canManage && <Button onClick={() => setOpen(true)} className="h-11 rounded-[10px] font-600"><Plus className="w-4 h-4 mr-2" /> Invite member</Button>}
      />

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="font-700 font-display text-sm" style={{ letterSpacing: "-0.02em" }}>Members ({team.length})</h3>
        </div>
        {team.length === 0 ? (
          <EmptyState icon={UserCog} title="No members yet" description="Invite your first teammate." />
        ) : (
          <div className="divide-y divide-border/50">
            {team.map((t) => {
              const myRoutes = routes.filter((r) => r.data.assigned_to === t.id);
              return (
                <div key={t.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-tint text-primary flex items-center justify-center text-sm font-700 shrink-0">
                      {(t.data?.name || t.email || "?")[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-600 text-sm truncate">{t.data?.name || t.email}{t.id === user.id && <span className="text-faint font-500"> (You)</span>}</p>
                      <p className="text-xs text-faint truncate">{t.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap sm:justify-end">
                    <StatusBadge status={t.data?.app_role || "viewer"} />
                    {myRoutes.length > 0 ? (
                      myRoutes.map((r) => (
                        <span key={r.id} className="inline-flex items-center gap-1.5 bg-primary text-white text-xs font-600 px-2.5 py-1 rounded-full">
                          <RouteIcon className="w-3 h-3" />
                          {r.data.name}
                          <span className="bg-white/20 px-1.5 rounded-full">{shopCount(r.id)}</span>
                        </span>
                      ))
                    ) : (
                      canManage && routes.length > 0 && (
                        <Select onValueChange={(v) => assignRoute(v, t.id)}>
                          <SelectTrigger className="h-8 w-auto gap-1 rounded-full border-dashed text-xs font-600 text-faint px-3 min-w-[140px]">
                            <SelectValue placeholder="+ Assign a route" />
                          </SelectTrigger>
                          <SelectContent>
                            {routes.map((r) => (
                              <SelectItem key={r.id} value={r.id}>{r.data.name} · {shopCount(r.id)} shops</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {invites.length > 0 && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden mt-4">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="font-700 font-display text-sm flex items-center gap-2" style={{ letterSpacing: "-0.02em" }}>
              <Clock className="w-4 h-4" /> Pending ({invites.length})
            </h3>
          </div>
          <div className="divide-y divide-border/50">
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-faint" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-600 truncate">{inv.data.email}</p>
                  <p className="text-xs text-faint capitalize">{inv.data.app_role}</p>
                </div>
                {canManage && (
                  <button onClick={() => cancelInvite(inv)} className="text-xs text-destructive hover:underline font-600">Cancel</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Invite team member</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="teammate@company.com" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.app_role} onValueChange={(v) => setForm({ ...form, app_role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r === "sales" ? "Sales rep" : r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {routes.length > 0 && (
              <div className="space-y-2">
                <Label>Assigned routes</Label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {routes.map((r) => (
                    <label key={r.id} className="flex items-center gap-2 p-2 rounded-lg border border-border cursor-pointer hover:bg-tint">
                      <input
                        type="checkbox"
                        checked={form.route_ids.includes(r.id)}
                        onChange={() => toggleRoute(r.id)}
                        className="rounded accent-[hsl(var(--primary))]"
                      />
                      <span className="text-sm">{r.data.name}</span>
                      <span className="text-xs text-faint ml-auto">{r.data.area}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={invite} disabled={saving || !form.email}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Send invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}