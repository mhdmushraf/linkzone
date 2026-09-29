import React, { useState, useMemo, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useOrg } from "@/lib/OrgContext";
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Loader2, Lock, Sparkles, List, Map as MapIcon, CheckSquare, X } from "lucide-react";
import { findLeads } from "@/functions/findLeads";
import { toast } from "@/components/ui/use-toast";
import {
  leadAllowance,
  leadUsedThisPeriod,
  isTrial,
  isReadOnly,
  canPullLeads,
} from "@/lib/planRules";
import LeadCard from "@/components/leadfinder/LeadCard";
import LeadMap from "@/components/leadfinder/LeadMap";
import BulkAddDialog from "@/components/leadfinder/BulkAddDialog";

const INDUSTRIES = ["Grocery / Mini mart", "Pharmacy", "Electronics", "Hardware", "Bakery", "Beverages", "Cosmetics", "Office supplies", "Other"];
const TERMS_LINE = "Lead data is licensed for use inside your Linkzone subscription and may not be resold or redistributed.";

const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
function isCustomerFor(lead, customers) {
  const wa = norm(lead.whatsapp_number);
  const name = norm(lead.business_name);
  return customers.some((c) => {
    if (wa && norm(c.data.whatsapp_number) === wa && wa.length > 4) return true;
    if (name && name.length > 3 && norm(c.data.business_name) === name) return true;
    return false;
  });
}
function dist(a, b) {
  if (!a || !b) return Infinity;
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const la1 = (a[0] * Math.PI) / 180;
  const la2 = (b[0] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export default function LeadFinder() {
  const { organization, team, subscription } = useOrg();
  const orgId = organization?.id;
  const routes = useOrgRoutes(orgId);

  const [area, setArea] = useState("");
  const [industry, setIndustry] = useState("");
  const [radiusKm, setRadiusKm] = useState(5);
  const [view, setView] = useState("map");
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState([]);
  const [added, setAdded] = useState(new Set());
  const [selected, setSelected] = useState(new Set());
  const [searched, setSearched] = useState(false);
  const [usage, setUsage] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [mapCenter, setMapCenter] = useState(null);
  const [flyTo, setFlyTo] = useState(null);
  const [bbox, setBbox] = useState(null);
  const [showSearchArea, setShowSearchArea] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [fText, setFText] = useState("");
  const [fPhone, setFPhone] = useState(false);
  const [fWa, setFWa] = useState(false);
  const [fNotCustomer, setFNotCustomer] = useState(false);
  const [sort, setSort] = useState("name");
  const cardRefs = useRef({});

  const trial = isTrial(subscription);
  const readOnly = isReadOnly(subscription);
  const allowance = leadAllowance(subscription);
  const used = usage?.used ?? leadUsedThisPeriod(subscription);
  const blocked = !canPullLeads(subscription);
  const limitReached = allowance !== null && used >= allowance;

  useEffect(() => { if (orgId) loadCustomers(); }, [orgId]);
  const loadCustomers = async () => {
    const c = await base44.entities.Customer.filter({ organization_id: orgId }, "-created_date", 500);
    setCustomers(c);
  };

  const leadsWithFlags = useMemo(
    () => leads.map((l, i) => ({ ...l, _idx: i, isCustomer: isCustomerFor(l, customers) })),
    [leads, customers]
  );

  const filtered = useMemo(() => {
    let arr = leadsWithFlags.slice();
    if (fText) {
      const q = fText.toLowerCase();
      arr = arr.filter((l) => (l.business_name || "").toLowerCase().includes(q) || (l.area || "").toLowerCase().includes(q) || (l.address || "").toLowerCase().includes(q));
    }
    if (fPhone) arr = arr.filter((l) => l.phone || l.whatsapp_number);
    if (fWa) arr = arr.filter((l) => l.whatsapp_number || l.phone);
    if (fNotCustomer) arr = arr.filter((l) => !l.isCustomer);
    if (sort === "distance") {
      arr.sort((a, b) => {
        const da = a.lat != null ? dist(mapCenter, [a.lat, a.lng]) : Infinity;
        const db = b.lat != null ? dist(mapCenter, [b.lat, b.lng]) : Infinity;
        return da - db;
      });
    } else {
      arr.sort((a, b) => (a.business_name || "").localeCompare(b.business_name || ""));
    }
    return arr;
  }, [leadsWithFlags, fText, fPhone, fWa, fNotCustomer, sort, mapCenter]);

  const toggleSelect = (idx) => setSelected((s) => {
    const n = new Set(s);
    if (n.has(idx)) n.delete(idx); else n.add(idx);
    return n;
  });
  const selectAll = () => setSelected(new Set(filtered.map((l) => l._idx)));
  const clearSel = () => setSelected(new Set());

  const runSearch = async (opts = {}) => {
    if (blocked) { toast({ title: "Lead pull limit reached", description: "Upgrade your plan to pull more leads.", variant: "destructive" }); return; }
    if (!industry) { toast({ title: "Pick an industry", variant: "destructive" }); return; }
    if (!opts.center && !area) { toast({ title: "Enter an area", variant: "destructive" }); return; }
    setLoading(true);
    setLeads([]);
    setAdded(new Set());
    setSelected(new Set());
    setSearched(false);
    try {
      const payload = { industry };
      if (opts.center) { payload.center = opts.center; payload.radius_km = radiusKm; }
      else { payload.area = area; }
      const res = await findLeads(payload);
      const data = res.data || {};
      if (data.usage) setUsage(data.usage);
      if (data.limit_reached) { toast({ title: "Lead pull limit reached", variant: "destructive" }); }
      if (data.geocode_failed) { toast({ title: "Couldn't locate that area", description: "Try a more specific place name.", variant: "destructive" }); setLeads([]); return; }
      setLeads(data.leads || []);
      if (data.center) { setMapCenter([data.center.lat, data.center.lng]); setFlyTo([data.center.lat, data.center.lng]); }
      if (data.bbox) setBbox(data.bbox); else setBbox(null);
      setShowSearchArea(false);
    } catch (e) {
      const msg = e.response?.data?.error || e.message;
      if (e.response?.data?.limit_reached) setUsage({ allowance: e.response.data.allowance, used: e.response.data.allowance, trial: e.response.data.trial });
      toast({ title: "Search failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  const onMoveEnd = (center) => { setMapCenter([center.lat, center.lng]); if (leads.length) setShowSearchArea(true); };
  const searchArea = () => runSearch({ center: mapCenter });
  const useLocation = () => {
    if (!navigator.geolocation) { toast({ title: "Location not available", variant: "destructive" }); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { const c = [pos.coords.latitude, pos.coords.longitude]; setMapCenter(c); setFlyTo(c); setBbox(null); runSearch({ center: c }); },
      () => toast({ title: "Couldn't get your location", variant: "destructive" })
    );
  };

  const addLead = async (lead) => {
    try {
      await base44.entities.Customer.create({
        business_name: lead.business_name, contact_name: lead.contact_name || "",
        phone: lead.phone || "", whatsapp_number: lead.whatsapp_number || lead.phone || "",
        address: lead.address || "", area: lead.area || "", industry: lead.industry || industry,
        lat: lead.lat ?? null, lng: lead.lng ?? null, status: "new", source: "lead_finder", organization_id: orgId,
      });
      setAdded((s) => new Set(s).add(lead._idx));
      loadCustomers();
      toast({ title: "Added as customer", description: lead.business_name });
    } catch (e) { toast({ title: "Failed to add", description: e.message, variant: "destructive" }); }
  };

  const bulkAdd = async ({ route_id, assigned_to }) => {
    const picks = filtered.filter((l) => selected.has(l._idx));
    if (!picks.length) { setBulkOpen(false); return; }
    try {
      await base44.entities.Customer.bulkCreate(picks.map((l) => ({
        business_name: l.business_name, contact_name: l.contact_name || "",
        phone: l.phone || "", whatsapp_number: l.whatsapp_number || l.phone || "",
        address: l.address || "", area: l.area || "", industry: l.industry || industry,
        lat: l.lat ?? null, lng: l.lng ?? null, route_id: route_id || null, assigned_to: assigned_to || null,
        status: "new", source: "lead_finder", organization_id: orgId,
      })));
      setAdded((s) => new Set([...s, ...selected]));
      setSelected(new Set());
      setBulkOpen(false);
      loadCustomers();
      toast({ title: `Added ${picks.length} customers` });
    } catch (e) { toast({ title: "Bulk add failed", description: e.message, variant: "destructive" }); }
  };

  const onMarkerClick = (idx) => {
    setHighlightIndex(idx);
    const el = cardRefs.current[idx];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const usageLabel = useMemo(() => allowance === null ? `${used} lead pulls used this month · unlimited` : `${used} of ${allowance} lead pulls used ${trial ? "this trial" : "this month"}`, [used, allowance, trial]);

  return (
    <AppLayout>
      <PageHeader title="Lead Finder" subtitle="Discover new businesses by area and industry" />

      {readOnly ? (
        <Banner tone="destructive" icon={Lock}>Your account is in read-only mode. Lead Finder is paused. Export is still available on the Customers and Orders pages.</Banner>
      ) : trial ? (
        <Banner tone="amber" icon={Sparkles}>Trial mode — Lead Finder is capped at {allowance} pulls total, WhatsApp sends at 100, and bulk export is disabled. Limits lift after your first payment on day 14.</Banner>
      ) : null}

      <div className="bg-card rounded-2xl border border-border/60 p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-600">{usageLabel}</span>
          {limitReached && !readOnly && <Button size="sm" onClick={() => (window.location.href = "/billing")}>Upgrade plan</Button>}
        </div>
        {allowance !== null && (
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className={`h-full rounded-full ${limitReached ? "bg-destructive" : "bg-primary"}`} style={{ width: `${Math.min(100, (used / allowance) * 100)}%` }} />
          </div>
        )}
      </div>

      <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm mb-4">
        <div className="grid sm:grid-cols-3 gap-3 items-end">
          <div className="space-y-2">
            <Label>Area / city</Label>
            <Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Karama, Dubai" className="h-11" />
          </div>
          <div className="space-y-2">
            <Label>Industry</Label>
            <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. Pharmacy" className="h-11" list="lead-industries" />
            <datalist id="lead-industries">{INDUSTRIES.map((i) => <option key={i} value={i} />)}</datalist>
          </div>
          <Button onClick={() => runSearch()} disabled={loading || blocked || !industry || (!area && !mapCenter)} className="h-11">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
            {loading ? "Searching…" : "Find businesses"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-3">Uses OpenStreetMap places plus live web search to fill contacts. Results are suggestions — verify before reaching out.</p>
      </div>

      {leads.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
            <button onClick={() => setView("list")} className={`px-3 h-8 rounded-md text-sm font-600 flex items-center gap-1.5 ${view === "list" ? "bg-primary text-white" : "text-faint"}`}><List className="w-4 h-4" />List</button>
            <button onClick={() => setView("map")} className={`px-3 h-8 rounded-md text-sm font-600 flex items-center gap-1.5 ${view === "map" ? "bg-primary text-white" : "text-faint"}`}><MapIcon className="w-4 h-4" />Map</button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Input value={fText} onChange={(e) => setFText(e.target.value)} placeholder="Filter results…" className="h-9 w-44" />
            <FilterChip active={fPhone} onClick={() => setFPhone((v) => !v)}>Has phone</FilterChip>
            <FilterChip active={fWa} onClick={() => setFWa((v) => !v)}>Has WhatsApp</FilterChip>
            <FilterChip active={fNotCustomer} onClick={() => setFNotCustomer((v) => !v)}>Not yet a customer</FilterChip>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="h-9 rounded-md border border-border bg-card text-sm px-2">
              <option value="name">Sort: Name</option>
              <option value="distance">Sort: Distance</option>
            </select>
          </div>
        </div>
      )}

      {selected.size > 0 && (
        <div className="sticky top-2 z-30 flex items-center justify-between gap-3 bg-primary text-white rounded-xl px-4 py-2.5 mb-3 shadow-lg">
          <span className="text-sm font-600">{selected.size} selected</span>
          <div className="flex items-center gap-2">
            <button onClick={selectAll} className="text-xs font-600 underline">Select all</button>
            <button onClick={clearSel} className="text-xs font-600 underline">Clear</button>
            <Button size="sm" className="bg-white text-primary hover:bg-white/90" onClick={() => setBulkOpen(true)}><CheckSquare className="w-3.5 h-3.5 mr-1.5" />Add selected</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-sm">Searching for {industry} businesses{area ? ` in ${area}` : ""}…</p>
        </div>
      ) : leads.length > 0 ? (
        view === "map" ? (
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="h-[55vh] lg:h-[68vh] rounded-2xl border border-border overflow-hidden order-2 lg:order-1">
              <LeadMap
                leads={filtered} added={added} mapCenter={mapCenter} radiusKm={radiusKm}
                onRadiusChange={setRadiusKm} onMoveEnd={onMoveEnd} onSearchArea={searchArea}
                showSearchArea={showSearchArea} highlightIndex={highlightIndex}
                onMarkerClick={onMarkerClick} onAdd={addLead} flyTo={flyTo} onUseLocation={useLocation} bbox={bbox}
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-600 text-faint">{filtered.length} results</span>
              </div>
              <div className="space-y-2 lg:max-h-[68vh] lg:overflow-y-auto pr-1">
                {filtered.map((l) => (
                  <LeadCard key={l._idx} lead={l} added={added.has(l._idx)} isCustomer={l.isCustomer}
                    selected={selected.has(l._idx)} highlighted={highlightIndex === l._idx}
                    onToggleSelect={toggleSelect} onAdd={addLead}
                    onHover={setHighlightIndex} onLeave={() => setHighlightIndex(null)}
                    registerRef={(idx, el) => { if (el) cardRefs.current[idx] = el; }} />
                ))}
              </div>
              <p className="text-[11px] text-faint mt-3">Map data © OpenStreetMap contributors. Results are suggestions, verify before reaching out.</p>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((l) => (
              <LeadCard key={l._idx} lead={l} added={added.has(l._idx)} isCustomer={l.isCustomer}
                selected={selected.has(l._idx)} highlighted={highlightIndex === l._idx}
                onToggleSelect={toggleSelect} onAdd={addLead}
                onHover={setHighlightIndex} onLeave={() => setHighlightIndex(null)} />
            ))}
          </div>
        )
      ) : searched ? (
        <EmptyState icon={Search} title="No businesses found" description="Try a different area or industry, or pan the map and search that area." />
      ) : (
        <EmptyState icon={Search} title="Find your next customers" description="Enter an area and industry to discover new businesses to sell to." />
      )}

      <p className="text-xs text-faint mt-8 text-center max-w-2xl mx-auto leading-relaxed">{TERMS_LINE}</p>

      <BulkAddDialog open={bulkOpen} onClose={() => setBulkOpen(false)} count={selected.size} routes={routes} team={team} onConfirm={bulkAdd} />
    </AppLayout>
  );
}

function useOrgRoutes(orgId) {
  const [routes, setRoutes] = useState([]);
  useEffect(() => { if (orgId) base44.entities.Route.filter({ organization_id: orgId }, "-created_date", 500).then(setRoutes); }, [orgId]);
  return routes;
}

function FilterChip({ active, onClick, children }) {
  return (
    <button onClick={onClick} className={`h-9 px-3 rounded-lg text-xs font-600 border flex items-center gap-1 ${active ? "bg-primary text-white border-primary" : "bg-card text-faint border-border hover:bg-muted"}`}>
      {active && <X className="w-3 h-3" />}{children}
    </button>
  );
}

function Banner({ tone, icon: Icon, children }) {
  const tones = { amber: "bg-accent/10 border-accent/30 text-foreground", destructive: "bg-destructive/10 border-destructive/30 text-foreground" };
  return (
    <div className={`flex items-start gap-3 rounded-2xl border p-4 mb-4 ${tones[tone]}`}>
      <Icon className="w-4 h-4 mt-0.5 shrink-0 text-faint" />
      <p className="text-sm">{children}</p>
    </div>
  );
}