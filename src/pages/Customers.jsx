import React, { useEffect, useState, useMemo } from "react";
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
import { Users, Plus, Pencil, Trash2, Loader2, Search, MapPin, Route as RouteIcon } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const STATUSES = ["active", "to_reorder", "new", "win_back"];

export default function Customers() {
  const { organization, team, appRole } = useOrg();
  const orgId = organization?.id;
  const canManage = appRole === "owner" || appRole === "manager";
  const [customers, setCustomers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [routeFilter, setRouteFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [routeOpen, setRouteOpen] = useState(false);
  const [routeForm, setRouteForm] = useState({ name: "", area: "", assigned_to: "" });
  const [form, setForm] = useState({ business_name: "", contact_name: "", phone: "", whatsapp_number: "", address: "", area: "", route_id: "", status: "new", industry: "", assigned_to: "" });

  const load = async () => {
    if (!orgId) return;
    setLoading(true);
    const [c, r] = await Promise.all([
      base44.entities.Customer.filter({ organization_id: orgId }, "-created_date", 500),
      base44.entities.Route.filter({ organization_id: orgId }, "-created_date", 500),
    ]);
    setCustomers(c);
    setRoutes(r);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [orgId]);

  const repName = (id) => {
    const t = team.find((t) => t.id === id);
    return t?.data?.name || t?.email || "Unassigned";
  };

  const openNew = () => {
    setEditing(null);
    setForm({ business_name: "", contact_name: "", phone: "", whatsapp_number: "", address: "", area: "", route_id: "", status: "new", industry: "", assigned_to: "" });
    setOpen(true);
  };
  const openEdit = (c) => {
    setEditing(c);
    setForm({ ...c.data });
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form, organization_id: orgId, route_id: form.route_id || null, assigned_to: form.assigned_to || null };
      if (editing) await base44.entities.Customer.update(editing.id, payload);
      else await base44.entities.Customer.create(payload);
      toast({ title: editing ? "Customer updated" : "Customer added" });
      setOpen(false);
      load();
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c) => {
    if (!confirm(`Delete ${c.data.business_name}?`)) return;
    await base44.entities.Customer.delete(c.id);
    load();
  };

  const assignCustomer = async (c, repId) => {
    await base44.entities.Customer.update(c.id, { assigned_to: repId || null });
    load();
  };

  const assignRoute = async (routeId, repId) => {
    await base44.entities.Route.update(routeId, { assigned_to: repId || null });
    // also assign all customers in that route
    const routeCustomers = customers.filter((c) => c.data.route_id === routeId);
    if (routeCustomers.length) {
      await base44.entities.Customer.bulkUpdate(routeCustomers.map((c) => ({ id: c.id, assigned_to: repId || null })));
    }
    toast({ title: "Route assigned", description: `${routeCustomers.length} customers updated.` });
    load();
  };

  const saveRoute = async () => {
    setSaving(true);
    try {
      await base44.entities.Route.create({ ...routeForm, assigned_to: routeForm.assigned_to || null, organization_id: orgId });
      toast({ title: "Route created" });
      setRouteOpen(false);
      setRouteForm({ name: "", area: "", assigned_to: "" });
      load();
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      if (statusFilter !== "all" && c.data.status !== statusFilter) return false;
      if (routeFilter !== "all" && c.data.route_id !== routeFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        return c.data.business_name?.toLowerCase().includes(q) || c.data.area?.toLowerCase().includes(q) || c.data.contact_name?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [customers, query, statusFilter, routeFilter]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((c) => {
      const key = c.data.route_id || "unassigned";
      if (!map[key]) map[key] = [];
      map[key].push(c);
    });
    return map;
  }, [filtered]);

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
        title="Customers"
        subtitle="Shops grouped by route and area"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setRouteOpen(true)} className="h-11">
              <RouteIcon className="w-4 h-4 mr-2" /> New route
            </Button>
            <Button onClick={openNew} className="h-11">
              <Plus className="w-4 h-4 mr-2" /> Add customer
            </Button>
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name or area…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10 h-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40 h-10"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={routeFilter} onValueChange={setRouteFilter}>
          <SelectTrigger className="w-full sm:w-44 h-10"><SelectValue placeholder="Route" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All routes</SelectItem>
            {routes.map((r) => <SelectItem key={r.id} value={r.id}>{r.data.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No customers found" description="Add your first customer or create a route." action={<Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Add customer</Button>} />
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([routeId, list]) => {
            const route = routes.find((r) => r.id === routeId);
            return (
              <div key={routeId} className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 bg-muted/40 border-b border-border">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="font-600">{route ? route.data.name : "Unassigned"}</span>
                    {route?.data.area && <span className="text-xs text-muted-foreground">· {route.data.area}</span>}
                    <span className="text-xs text-muted-foreground">· {list.length} shops</span>
                  </div>
                  {canManage && route && (
                    <Select value={route.data.assigned_to || ""} onValueChange={(v) => assignRoute(route.id, v)}>
                      <SelectTrigger className="w-44 h-8 text-xs"><SelectValue placeholder="Assign rep to route" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null}>Unassigned</SelectItem>
                        {team.map((t) => <SelectItem key={t.id} value={t.id}>{t.data?.name || t.email}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground border-b border-border">
                        <th className="px-5 py-2 font-500">Business</th>
                        <th className="px-5 py-2 font-500">Contact</th>
                        <th className="px-5 py-2 font-500">Status</th>
                        <th className="px-5 py-2 font-500">Salesman</th>
                        <th className="px-5 py-2 font-500"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((c) => (
                        <tr key={c.id} className="border-b border-border/40 last:border-0 hover:bg-muted/20">
                          <td className="px-5 py-3">
                            <p className="font-600">{c.data.business_name}</p>
                            <p className="text-xs text-muted-foreground">{c.data.area}</p>
                          </td>
                          <td className="px-5 py-3 text-muted-foreground">
                            <p>{c.data.contact_name || "—"}</p>
                            <p className="text-xs">{c.data.phone || c.data.whatsapp_number || ""}</p>
                          </td>
                          <td className="px-5 py-3"><StatusBadge status={c.data.status} /></td>
                          <td className="px-5 py-3">
                            {canManage ? (
                              <Select value={c.data.assigned_to || ""} onValueChange={(v) => assignCustomer(c, v)}>
                                <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Assign" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={null}>Unassigned</SelectItem>
                                  {team.map((t) => <SelectItem key={t.id} value={t.id}>{t.data?.name || t.email}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="text-xs">{repName(c.data.assigned_to)}</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right">
                            {canManage && (
                              <div className="flex justify-end gap-1">
                                <button onClick={() => openEdit(c)} className="p-1.5 rounded-md hover:bg-muted"><Pencil className="w-3.5 h-3.5" /></button>
                                <button onClick={() => remove(c)} className="p-1.5 rounded-md hover:bg-muted text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Customer dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit customer" : "Add customer"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>Business name</Label>
              <Input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} placeholder="Joe's Mini Mart" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Contact name</Label>
                <Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} placeholder="Joe" />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp number</Label>
                <Input value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} placeholder="+1 555 0100" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Area</Label>
                <Input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="Downtown" />
              </div>
              <div className="space-y-2">
                <Label>Industry</Label>
                <Input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="Grocery" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Route</Label>
                <Select value={form.route_id || "none"} onValueChange={(v) => setForm({ ...form, route_id: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Select route" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {routes.map((r) => <SelectItem key={r.id} value={r.id}>{r.data.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {canManage && (
              <div className="space-y-2">
                <Label>Assign salesman</Label>
                <Select value={form.assigned_to || "none"} onValueChange={(v) => setForm({ ...form, assigned_to: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {team.map((t) => <SelectItem key={t.id} value={t.id}>{t.data?.name || t.email}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving || !form.business_name}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editing ? "Save" : "Add customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Route dialog */}
      <Dialog open={routeOpen} onOpenChange={setRouteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New route</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>Route name</Label>
              <Input value={routeForm.name} onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })} placeholder="Downtown North" />
            </div>
            <div className="space-y-2">
              <Label>Area</Label>
              <Input value={routeForm.area} onChange={(e) => setRouteForm({ ...routeForm, area: e.target.value })} placeholder="North district" />
            </div>
            <div className="space-y-2">
              <Label>Assign to salesman</Label>
              <Select value={routeForm.assigned_to || "none"} onValueChange={(v) => setRouteForm({ ...routeForm, assigned_to: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {team.map((t) => <SelectItem key={t.id} value={t.id}>{t.data?.name || t.email}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRouteOpen(false)}>Cancel</Button>
            <Button onClick={saveRoute} disabled={saving || !routeForm.name}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create route
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}