import React, { useEffect, useState, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
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
import { Users, Plus, Pencil, Trash2, Loader2, Search, MapPin, Route as RouteIcon, Download, Lock, Sparkles, List, Map as MapIcon, Save, X, LocateFixed } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { downloadCSV } from "@/lib/csv";
import { geocodeCustomers } from "@/functions/geocodeCustomers";
import { isTrial, isReadOnly, canExport, whatsappUsedThisPeriod } from "@/lib/planRules";
import { TRIAL_WHATSAPP_LIMIT } from "@/lib/plans";
import { waLink } from "@/lib/wa";
import MultiSelect from "@/components/customers/MultiSelect";
import CustomerMap from "@/components/customers/CustomerMap";
import BulkActionsBar from "@/components/customers/BulkActionsBar";

const STATUSES = ["active", "to_reorder", "new", "win_back"];
const STATUS_OPTS = STATUSES.map((s) => ({ value: s, label: s.replace("_", " ") }));
const SOURCE_OPTS = [
  { value: "lead_finder", label: "Lead Finder" },
  { value: "imported", label: "Imported" },
  { value: "manual", label: "Manual" },
];
const LAST_ORDER_OPTS = [
  { value: "never", label: "Never ordered" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "over90", label: "Over 90 days (win-back)" },
];
const SORT_OPTS = [
  { value: "name", label: "Name" },
  { value: "last_order", label: "Last order" },
  { value: "area", label: "Area" },
];

const now = () => new Date();
const daysSince = (d) => (d ? Math.floor((now() - new Date(d)) / 86400000) : null);

export default function Customers() {
  const { organization, team, appRole, subscription } = useOrg();
  const orgId = organization?.id;
  const canManage = appRole === "owner" || appRole === "manager";
  const [params, setParams] = useSearchParams();

  const [customers, setCustomers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [convs, setConvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [routeOpen, setRouteOpen] = useState(false);
  const [routeForm, setRouteForm] = useState({ name: "", area: "", assigned_to: "" });
  const [form, setForm] = useState({ business_name: "", contact_name: "", phone: "", whatsapp_number: "", address: "", area: "", lat: "", lng: "", route_id: "", status: "new", industry: "", assigned_to: "" });

  const [selected, setSelected] = useState(new Set());
  const [highlightId, setHighlightId] = useState(null);
  const [drawActive, setDrawActive] = useState(false);
  const [viewName, setViewName] = useState("");
  const cardRefs = useRef({});

  // ---- Filter helpers (URL is source of truth) ----
  const get = (k, d = "") => params.get(k) ?? d;
  const getList = (k) => { const v = params.get(k); return v ? v.split(",").filter(Boolean) : []; };
  const setParam = (k, v) => {
    const n = new URLSearchParams(params);
    if (v == null || v === "" || (Array.isArray(v) && v.length === 0)) n.delete(k);
    else n.set(k, Array.isArray(v) ? v.join(",") : String(v));
    setParams(n, { replace: true });
  };

  const q = get("q");
  const statusF = getList("status");
  const routeF = getList("route");
  const salesF = getList("salesman");
  const areaF = get("area");
  const industryF = get("industry");
  const sourceF = getList("source");
  const waF = get("wa") === "1";
  const lastOrderF = get("lastOrder");
  const sortF = get("sort") || "name";
  const viewMode = get("view") || "list";

  const trial = isTrial(subscription);
  const readOnly = isReadOnly(subscription);
  const exportBlocked = !canExport(subscription);

  const load = async () => {
    if (!orgId) return;
    setLoading(true);
    const [c, r, o, cv] = await Promise.all([
      base44.entities.Customer.filter({ organization_id: orgId }, "-created_date", 500),
      base44.entities.Route.filter({ organization_id: orgId }, "-created_date", 500),
      base44.entities.Order.filter({ organization_id: orgId }, "-created_date", 500),
      base44.entities.Conversation.filter({ organization_id: orgId }, "-created_date", 500),
    ]);
    setCustomers(c); setRoutes(r); setOrders(o); setConvs(cv);
    setLoading(false);
  };
  useEffect(() => { load(); }, [orgId]);

  const repName = (id) => { if (!id) return "Unassigned"; const t = team.find((t) => t.id === id); return t?.data?.name || t?.email || "Unassigned"; };
  const routeName = (id) => { if (!id) return "Unassigned"; const r = routes.find((r) => r.id === id); return r?.data?.name || "Unassigned"; };

  // ---- Filtering + sorting (shared by list and map) ----
  const filtered = useMemo(() => {
    let arr = customers.slice();
    if (q) {
      const s = q.toLowerCase();
      arr = arr.filter((c) => (c.data.business_name || "").toLowerCase().includes(s) || (c.data.contact_name || "").toLowerCase().includes(s) || (c.data.phone || "").toLowerCase().includes(s) || (c.data.address || "").toLowerCase().includes(s));
    }
    if (statusF.length) arr = arr.filter((c) => statusF.includes(c.data.status || "new"));
    if (routeF.length) arr = arr.filter((c) => (c.data.route_id ? routeF.includes(c.data.route_id) : routeF.includes("unassigned")));
    if (salesF.length) arr = arr.filter((c) => (c.data.assigned_to ? salesF.includes(c.data.assigned_to) : salesF.includes("unassigned")));
    if (areaF) arr = arr.filter((c) => (c.data.area || "").toLowerCase().includes(areaF.toLowerCase()));
    if (industryF) arr = arr.filter((c) => (c.data.industry || "").toLowerCase().includes(industryF.toLowerCase()));
    if (sourceF.length) arr = arr.filter((c) => sourceF.includes(c.data.source || "manual"));
    if (waF) arr = arr.filter((c) => c.data.whatsapp_number || c.data.phone);
    if (lastOrderF) {
      arr = arr.filter((c) => {
        const d = daysSince(c.data.last_order_date);
        if (lastOrderF === "never") return d === null;
        if (d === null) return false;
        if (lastOrderF === "7") return d <= 7;
        if (lastOrderF === "30") return d <= 30;
        if (lastOrderF === "90") return d <= 90;
        if (lastOrderF === "over90") return d > 90;
        return true;
      });
    }
    arr.sort((a, b) => {
      if (sortF === "last_order") {
        const da = a.data.last_order_date ? new Date(a.data.last_order_date).getTime() : 0;
        const db = b.data.last_order_date ? new Date(b.data.last_order_date).getTime() : 0;
        return db - da;
      }
      if (sortF === "area") return (a.data.area || "").localeCompare(b.data.area || "");
      return (a.data.business_name || "").localeCompare(b.data.business_name || "");
    });
    return arr;
  }, [customers, q, statusF, routeF, salesF, areaF, industryF, sourceF, waF, lastOrderF, sortF]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((c) => { const k = c.data.route_id || "unassigned"; (map[k] = map[k] || []).push(c); });
    return map;
  }, [filtered]);

  const unmappedCount = useMemo(() => customers.filter((c) => c.data.lat == null || c.data.lng == null).length, [customers]);

  const activeFilterCount = [q, statusF.length, routeF.length, salesF.length, areaF, industryF, sourceF.length, waF, lastOrderF].filter((x) => (typeof x === "number" ? x > 0 : !!x)).length;
  const clearAll = () => setParams(viewMode ? new URLSearchParams({ view: viewMode }) : new URLSearchParams(), { replace: true });

  // ---- Saved views (per user, localStorage) ----
  const viewsKey = `lz_customer_views_${organization?.id || "demo"}`;
  const [views, setViews] = useState([]);
  useEffect(() => { try { setViews(JSON.parse(localStorage.getItem(viewsKey) || "[]")); } catch { setViews([]); } }, [viewsKey]);
  const saveView = () => {
    const name = viewName.trim(); if (!name) return;
    const next = [...views, { id: Date.now().toString(), name, query: params.toString() }];
    setViews(next); localStorage.setItem(viewsKey, JSON.stringify(next)); setViewName(""); toast({ title: "View saved", description: name });
  };
  const applyView = (v) => setParams(new URLSearchParams(v.query), { replace: true });
  const deleteView = (id) => { const next = views.filter((v) => v.id !== id); setViews(next); localStorage.setItem(viewsKey, JSON.stringify(next)); };

  // ---- Selection ----
  const toggleSel = (id) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleGroup = (list, on) => setSelected((s) => { const n = new Set(s); list.forEach((c) => on ? n.add(c.id) : n.delete(c.id)); return n; });
  const clearSel = () => setSelected(new Set());

  // ---- Bulk actions ----
  const selectedCustomers = () => filtered.filter((c) => selected.has(c.id));
  const bulkUpdate = async (patch) => {
    const list = selectedCustomers(); if (!list.length) return;
    await base44.entities.Customer.bulkUpdate(list.map((c) => ({ id: c.id, ...patch })));
    toast({ title: `Updated ${list.length} customers` }); setSelected(new Set()); load();
  };
  const sendOffer = async () => {
    const list = selectedCustomers().filter((c) => waLink(c.data.whatsapp_number || c.data.phone));
    if (!list.length) { toast({ title: "No WhatsApp numbers among selected", variant: "destructive" }); return; }
    let toSend = list;
    if (trial) {
      const remaining = TRIAL_WHATSAPP_LIMIT - whatsappUsedThisPeriod(subscription);
      if (remaining <= 0) { toast({ title: "WhatsApp send limit reached (100)", description: "Upgrade after your trial to send more.", variant: "destructive" }); return; }
      if (list.length > remaining) { toSend = list.slice(0, remaining); toast({ title: `Trial limit — opening ${remaining} of ${list.length}` }); }
    }
    toSend.forEach((c, i) => setTimeout(() => window.open(waLink(c.data.whatsapp_number || c.data.phone), "_blank"), i * 200));
    if (trial) { try { await base44.entities.Subscription.update(subscription.id, { whatsapp_sends_used: (subscription.data.whatsapp_sends_used || 0) + toSend.length }); } catch (e) { /* ignore */ } }
    toast({ title: `Opened ${toSend.length} WhatsApp chat${toSend.length === 1 ? "" : "s"}` });
  };

  // ---- Locate on map ----
  const locate = async () => {
    setLocating(true);
    try {
      let safety = 0;
      while (safety < 30) {
        const res = await geocodeCustomers({});
        const d = res.data || {};
        await load();
        if (!d.remaining || d.remaining <= 0) break;
        if (d.located === 0 && d.attempted > 0) break;
        safety++;
      }
      toast({ title: "Located customers on the map" });
    } catch (e) { toast({ title: "Locate failed", description: e.message, variant: "destructive" }); }
    finally { setLocating(false); }
  };

  // ---- Draw-area selection ----
  const onDrawSelect = (bounds) => {
    const inArea = filtered.filter((c) => c.data.lat != null && c.data.lng != null && bounds.contains([c.data.lat, c.data.lng]));
    setSelected(new Set(inArea.map((c) => c.id)));
    toast({ title: `Selected ${inArea.length} customers in area` });
  };

  // ---- Export (own data only) ----
  const exportableCustomers = useMemo(() => {
    const hasActivity = new Set([...orders.map((o) => o.data.customer_id), ...convs.map((c) => c.data.customer_id)]);
    return customers.filter((c) => { const src = c.data.source || "manual"; if (src === "lead_finder") return hasActivity.has(c.id); return true; });
  }, [customers, orders, convs]);
  const exportCSV = () => {
    if (exportBlocked) return;
    const rows = exportableCustomers.map((c) => ({
      business_name: c.data.business_name, contact_name: c.data.contact_name || "", phone: c.data.phone || "",
      whatsapp_number: c.data.whatsapp_number || "", address: c.data.address || "", area: c.data.area || "",
      industry: c.data.industry || "", status: c.data.status || "", source: c.data.source || "manual",
    }));
    downloadCSV("linkzone-customers.csv", rows);
    toast({ title: "Export ready", description: `${rows.length} customers exported.` });
  };

  // ---- CRUD ----
  const openNew = () => { setEditing(null); setForm({ business_name: "", contact_name: "", phone: "", whatsapp_number: "", address: "", area: "", lat: "", lng: "", route_id: "", status: "new", industry: "", assigned_to: "" }); setOpen(true); };
  const openEdit = (c) => { setEditing(c); setForm({ ...c.data, lat: c.data.lat ?? "", lng: c.data.lng ?? "" }); setOpen(true); };
  const save = async () => {
    setSaving(true);
    try {
      const lat = form.lat === "" ? null : Number(form.lat);
      const lng = form.lng === "" ? null : Number(form.lng);
      const payload = { ...form, lat, lng, organization_id: orgId, route_id: form.route_id || null, assigned_to: form.assigned_to || null, source: editing ? (editing.data.source || "manual") : "manual" };
      if (editing) await base44.entities.Customer.update(editing.id, payload); else await base44.entities.Customer.create(payload);
      toast({ title: editing ? "Customer updated" : "Customer added" }); setOpen(false); load();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };
  const remove = async (c) => { if (!confirm(`Delete ${c.data.business_name}?`)) return; await base44.entities.Customer.delete(c.id); load(); };
  const assignCustomer = async (c, repId) => { await base44.entities.Customer.update(c.id, { assigned_to: repId || null }); load(); };
  const assignRoute = async (routeId, repId) => {
    await base44.entities.Route.update(routeId, { assigned_to: repId || null });
    const rc = customers.filter((c) => c.data.route_id === routeId);
    if (rc.length) await base44.entities.Customer.bulkUpdate(rc.map((c) => ({ id: c.id, assigned_to: repId || null })));
    toast({ title: "Route assigned", description: `${rc.length} customers updated.` }); load();
  };
  const saveRoute = async () => {
    setSaving(true);
    try {
      await base44.entities.Route.create({ ...routeForm, assigned_to: routeForm.assigned_to || null, organization_id: orgId });
      toast({ title: "Route created" }); setRouteOpen(false); setRouteForm({ name: "", area: "", assigned_to: "" }); load();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const onMarkerClick = (id) => { setHighlightId(id); cardRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "nearest" }); };

  if (loading) return <AppLayout><div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div></AppLayout>;

  return (
    <AppLayout>
      {readOnly && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 mb-4">
          <Lock className="w-4 h-4 mt-0.5 shrink-0 text-destructive" />
          <p className="text-sm">Account is in read-only mode. Exporting your own data is still allowed; adding and editing are paused.</p>
        </div>
      )}
      {trial && (
        <div className="flex items-start gap-3 rounded-2xl border border-accent/30 bg-accent/10 p-4 mb-4">
          <Sparkles className="w-4 h-4 mt-0.5 shrink-0 text-accent" />
          <p className="text-sm">Trial mode — CSV export is disabled until your first payment on day 14. WhatsApp sends capped at {TRIAL_WHATSAPP_LIMIT}.</p>
        </div>
      )}

      <PageHeader
        title="Customers"
        subtitle="Shops grouped by route and area"
        action={
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={exportCSV} disabled={exportBlocked} className="h-11" title={exportBlocked ? "Export is disabled during the trial" : "Export your own customers (CSV)"}><Download className="w-4 h-4 mr-2" />Export</Button>
            <Button variant="outline" onClick={() => setRouteOpen(true)} className="h-11"><RouteIcon className="w-4 h-4 mr-2" />New route</Button>
            <Button onClick={openNew} className="h-11"><Plus className="w-4 h-4 mr-2" />Add customer</Button>
          </div>
        }
      />

      {unmappedCount > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-4 mb-4">
          <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-accent" /><span><span className="font-700">{unmappedCount}</span> customers are not on the map yet. Locate them by their address.</span></div>
          <Button variant="outline" onClick={locate} disabled={locating || readOnly} className="h-9 shrink-0">
            {locating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LocateFixed className="w-4 h-4 mr-2" />}{locating ? "Locating…" : "Locate on map"}
          </Button>
        </div>
      )}

      {/* Saved views */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {views.map((v) => (
          <div key={v.id} className="inline-flex items-center gap-1 bg-card border border-border rounded-full pl-3 pr-1 py-1">
            <button onClick={() => applyView(v)} className="text-xs font-600 text-faint hover:text-foreground">{v.name}</button>
            <button onClick={() => deleteView(v.id)} className="w-5 h-5 rounded-full hover:bg-muted flex items-center justify-center"><X className="w-3 h-3 text-faint" /></button>
          </div>
        ))}
        <div className="inline-flex items-center gap-1">
          <Input value={viewName} onChange={(e) => setViewName(e.target.value)} placeholder="Save this view…" className="h-8 w-36 text-xs" onKeyDown={(e) => e.key === "Enter" && saveView()} />
          <Button size="sm" variant="outline" className="h-8 px-2.5" onClick={saveView} disabled={!viewName.trim()}><Save className="w-3.5 h-3.5" /></Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-border/60 p-3 shadow-sm mb-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search name, contact, phone, address…" value={q} onChange={(e) => setParam("q", e.target.value)} className="pl-10 h-9" />
        </div>
        <MultiSelect label="Status" options={STATUS_OPTS} value={statusF} onChange={(v) => setParam("status", v)} />
        <MultiSelect label="Route" options={[...routes.map((r) => ({ value: r.id, label: r.data.name })), { value: "unassigned", label: "Unassigned" }]} value={routeF} onChange={(v) => setParam("route", v)} />
        <MultiSelect label="Salesman" options={[...team.map((t) => ({ value: t.id, label: t.data?.name || t.email })), { value: "unassigned", label: "Unassigned" }]} value={salesF} onChange={(v) => setParam("salesman", v)} />
        <MultiSelect label="Source" options={SOURCE_OPTS} value={sourceF} onChange={(v) => setParam("source", v)} />
        <Input value={areaF} onChange={(e) => setParam("area", e.target.value)} placeholder="Area" className="h-9 w-28" />
        <Input value={industryF} onChange={(e) => setParam("industry", e.target.value)} placeholder="Industry" className="h-9 w-28" />
        <select value={lastOrderF} onChange={(e) => setParam("lastOrder", e.target.value)} className="h-9 rounded-md border border-border bg-card text-sm px-2">
          <option value="">Last order: any</option>
          {LAST_ORDER_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={sortF} onChange={(e) => setParam("sort", e.target.value)} className="h-9 rounded-md border border-border bg-card text-sm px-2">
          {SORT_OPTS.map((o) => <option key={o.value} value={o.value}>Sort: {o.label}</option>)}
        </select>
        <button onClick={() => setParam("wa", waF ? "" : "1")} className={`h-9 px-3 rounded-lg text-xs font-600 border flex items-center gap-1 ${waF ? "bg-primary text-white border-primary" : "bg-card text-faint border-border hover:bg-muted"}`}>{waF && <X className="w-3 h-3" />}WhatsApp</button>
        <div className="flex items-center gap-1 bg-background border border-border rounded-lg p-1 ml-auto">
          <button onClick={() => setParam("view", "list")} className={`px-2.5 h-7 rounded-md text-sm font-600 flex items-center gap-1 ${viewMode === "list" ? "bg-primary text-white" : "text-faint"}`}><List className="w-4 h-4" />List</button>
          <button onClick={() => setParam("view", "map")} className={`px-2.5 h-7 rounded-md text-sm font-600 flex items-center gap-1 ${viewMode === "map" ? "bg-primary text-white" : "text-faint"}`}><MapIcon className="w-4 h-4" />Map</button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <span className="text-sm text-faint">{filtered.length} of {customers.length} customers</span>
        {activeFilterCount > 0 && <button onClick={clearAll} className="text-xs font-600 text-primary hover:underline">Clear all</button>}
      </div>
      {(() => {
        const chips = [];
        if (q) chips.push({ label: `"${q}"`, clear: () => setParam("q", "") });
        statusF.forEach((s) => chips.push({ label: `Status: ${s.replace("_", " ")}`, clear: () => setParam("status", statusF.filter((x) => x !== s)) }));
        routeF.forEach((r) => chips.push({ label: `Route: ${r === "unassigned" ? "Unassigned" : routeName(r)}`, clear: () => setParam("route", routeF.filter((x) => x !== r)) }));
        salesF.forEach((s) => chips.push({ label: `Salesman: ${s === "unassigned" ? "Unassigned" : repName(s)}`, clear: () => setParam("salesman", salesF.filter((x) => x !== s)) }));
        sourceF.forEach((s) => chips.push({ label: `Source: ${SOURCE_OPTS.find((o) => o.value === s)?.label || s}`, clear: () => setParam("source", sourceF.filter((x) => x !== s)) }));
        if (areaF) chips.push({ label: `Area: ${areaF}`, clear: () => setParam("area", "") });
        if (industryF) chips.push({ label: `Industry: ${industryF}`, clear: () => setParam("industry", "") });
        if (waF) chips.push({ label: "Has WhatsApp", clear: () => setParam("wa", "") });
        if (lastOrderF) chips.push({ label: LAST_ORDER_OPTS.find((o) => o.value === lastOrderF)?.label, clear: () => setParam("lastOrder", "") });
        if (!chips.length) return null;
        return (
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            {chips.map((c, i) => (
              <button key={i} onClick={c.clear} className="inline-flex items-center gap-1 bg-tint text-primary text-xs font-600 px-2.5 py-1 rounded-full border border-primary/20 hover:bg-primary/10">
                {c.label}<X className="w-3 h-3" />
              </button>
            ))}
          </div>
        );
      })()}

      {selected.size > 0 && (
        <BulkActionsBar
          count={selected.size} routes={routes} team={team}
          onAssignRoute={(v) => bulkUpdate({ route_id: v })}
          onAssignSalesman={(v) => bulkUpdate({ assigned_to: v })}
          onStatus={(v) => bulkUpdate({ status: v })}
          onSendOffer={sendOffer} onClear={clearSel}
        />
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No customers found" description="Adjust your filters or add your first customer." action={<Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Add customer</Button>} />
      ) : viewMode === "map" ? (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="h-[55vh] lg:h-[70vh] rounded-2xl border border-border overflow-hidden order-2 lg:order-1">
            <CustomerMap
              customers={filtered} routes={routes} team={team}
              highlightId={highlightId} onMarkerClick={onMarkerClick}
              drawActive={drawActive} onToggleDraw={() => setDrawActive((v) => !v)}
              onDrawSelect={onDrawSelect} onDrawDone={() => setDrawActive(false)}
              loading={locating} repName={repName} routeName={routeName} onAssign={assignCustomer}
            />
          </div>
          <div className="order-1 lg:order-2">
            <div className="space-y-2 lg:max-h-[70vh] lg:overflow-y-auto pr-1">
              {filtered.map((c) => (
                <div key={c.id} ref={(el) => { if (el) cardRefs.current[c.id] = el; }} onMouseEnter={() => setHighlightId(c.id)} onMouseLeave={() => setHighlightId(null)}
                  className={`bg-card rounded-xl border p-3 flex gap-3 items-center ${highlightId === c.id ? "border-primary ring-2 ring-primary/30" : selected.has(c.id) ? "border-primary" : "border-border"}`}>
                  <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSel(c.id)} className="w-4 h-4 accent-[#6B4EF0] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><p className="font-600 text-sm truncate">{c.data.business_name}</p><StatusBadge status={c.data.status} /></div>
                    <p className="text-xs text-faint truncate">{c.data.area || c.data.address || "—"} · {routeName(c.data.route_id)} · {repName(c.data.assigned_to)}</p>
                  </div>
                  {canManage && <button onClick={() => openEdit(c)} className="p-1.5 rounded-md hover:bg-muted shrink-0"><Pencil className="w-3.5 h-3.5" /></button>}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-faint mt-2">Map data © OpenStreetMap contributors.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([routeId, list]) => {
            const route = routes.find((r) => r.id === routeId);
            const allSel = list.every((c) => selected.has(c.id));
            return (
              <div key={routeId} className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 bg-muted/40 border-b border-border">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={allSel && list.length > 0} onChange={(e) => toggleGroup(list, e.target.checked)} className="w-4 h-4 accent-[#6B4EF0]" />
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="font-600">{route ? route.data.name : "Unassigned"}</span>
                    {route?.data.area && <span className="text-xs text-muted-foreground">· {route.data.area}</span>}
                    <span className="text-xs text-muted-foreground">· {list.length} shops</span>
                  </div>
                  {canManage && route && (
                    <Select value={route.data.assigned_to || ""} onValueChange={(v) => assignRoute(route.id, v)}>
                      <SelectTrigger className="w-44 h-8 text-xs"><SelectValue placeholder="Assign rep to route" /></SelectTrigger>
                      <SelectContent><SelectItem value={null}>Unassigned</SelectItem>{team.map((t) => <SelectItem key={t.id} value={t.id}>{t.data?.name || t.email}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground border-b border-border">
                        <th className="px-5 py-2 w-8"></th>
                        <th className="px-5 py-2 font-500">Business</th>
                        <th className="px-5 py-2 font-500">Contact</th>
                        <th className="px-5 py-2 font-500">Status</th>
                        <th className="px-5 py-2 font-500">Salesman</th>
                        <th className="px-5 py-2 font-500"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((c) => (
                        <tr key={c.id} className={`border-b border-border/40 last:border-0 hover:bg-muted/20 ${highlightId === c.id ? "bg-tint" : ""}`}>
                          <td className="px-5 py-3"><input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSel(c.id)} className="w-4 h-4 accent-[#6B4EF0]" /></td>
                          <td className="px-5 py-3"><p className="font-600">{c.data.business_name}</p><p className="text-xs text-muted-foreground">{c.data.area}</p></td>
                          <td className="px-5 py-3 text-muted-foreground"><p>{c.data.contact_name || "—"}</p><p className="text-xs">{c.data.phone || c.data.whatsapp_number || ""}</p></td>
                          <td className="px-5 py-3"><StatusBadge status={c.data.status} /></td>
                          <td className="px-5 py-3">{canManage ? (<Select value={c.data.assigned_to || ""} onValueChange={(v) => assignCustomer(c, v)}><SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Assign" /></SelectTrigger><SelectContent><SelectItem value={null}>Unassigned</SelectItem>{team.map((t) => <SelectItem key={t.id} value={t.id}>{t.data?.name || t.email}</SelectItem>)}</SelectContent></Select>) : <span className="text-xs">{repName(c.data.assigned_to)}</span>}</td>
                          <td className="px-5 py-3 text-right">{canManage && (<div className="flex justify-end gap-1"><button onClick={() => openEdit(c)} className="p-1.5 rounded-md hover:bg-muted"><Pencil className="w-3.5 h-3.5" /></button><button onClick={() => remove(c)} className="p-1.5 rounded-md hover:bg-muted text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button></div>)}</td>
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
            <div className="space-y-2"><Label>Business name</Label><Input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} placeholder="Joe's Mini Mart" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Contact name</Label><Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} placeholder="Joe" /></div>
              <div className="space-y-2"><Label>WhatsApp number</Label><Input value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} placeholder="+971 50 123 4567" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Area</Label><Input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="Downtown" /></div>
              <div className="space-y-2"><Label>Industry</Label><Input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="Grocery" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Latitude</Label><Input type="number" step="any" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} placeholder="auto" /></div>
              <div className="space-y-2"><Label>Longitude</Label><Input type="number" step="any" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} placeholder="auto" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Route</Label><Select value={form.route_id || "none"} onValueChange={(v) => setForm({ ...form, route_id: v === "none" ? "" : v })}><SelectTrigger><SelectValue placeholder="Select route" /></SelectTrigger><SelectContent><SelectItem value="none">Unassigned</SelectItem>{routes.map((r) => <SelectItem key={r.id} value={r.id}>{r.data.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Status</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}</SelectContent></Select></div>
            </div>
            {canManage && (<div className="space-y-2"><Label>Assign salesman</Label><Select value={form.assigned_to || "none"} onValueChange={(v) => setForm({ ...form, assigned_to: v === "none" ? "" : v })}><SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger><SelectContent><SelectItem value="none">Unassigned</SelectItem>{team.map((t) => <SelectItem key={t.id} value={t.id}>{t.data?.name || t.email}</SelectItem>)}</SelectContent></Select></div>)}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving || !form.business_name}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{editing ? "Save" : "Add customer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Route dialog */}
      <Dialog open={routeOpen} onOpenChange={setRouteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New route</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2"><Label>Route name</Label><Input value={routeForm.name} onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })} placeholder="Downtown North" /></div>
            <div className="space-y-2"><Label>Area</Label><Input value={routeForm.area} onChange={(e) => setRouteForm({ ...routeForm, area: e.target.value })} placeholder="North district" /></div>
            <div className="space-y-2"><Label>Assign to salesman</Label><Select value={routeForm.assigned_to || "none"} onValueChange={(v) => setRouteForm({ ...routeForm, assigned_to: v === "none" ? "" : v })}><SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger><SelectContent><SelectItem value="none">Unassigned</SelectItem>{team.map((t) => <SelectItem key={t.id} value={t.id}>{t.data?.name || t.email}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setRouteOpen(false)}>Cancel</Button><Button onClick={saveRoute} disabled={saving || !routeForm.name}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Create route</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}