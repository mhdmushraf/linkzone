import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useOrg } from "@/lib/OrgContext";
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Loader2, Plus, Check, MapPin, Phone, Lock, Sparkles } from "lucide-react";
import { findLeads } from "@/functions/findLeads";
import { toast } from "@/components/ui/use-toast";
import {
  leadAllowance,
  leadUsedThisPeriod,
  isTrial,
  isReadOnly,
  canPullLeads,
} from "@/lib/planRules";

const INDUSTRIES = ["Grocery / Mini mart", "Pharmacy", "Electronics", "Hardware", "Bakery", "Beverages", "Cosmetics", "Office supplies", "Other"];
const TERMS_LINE = "Lead data is licensed for use inside your Linkzone subscription and may not be resold or redistributed.";

export default function LeadFinder() {
  const { organization, subscription } = useOrg();
  const orgId = organization?.id;
  const [area, setArea] = useState("");
  const [industry, setIndustry] = useState("");
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState([]);
  const [added, setAdded] = useState(new Set());
  const [searched, setSearched] = useState(false);
  const [usage, setUsage] = useState(null); // { allowance, used, trial } from backend

  const trial = isTrial(subscription);
  const readOnly = isReadOnly(subscription);
  const allowance = leadAllowance(subscription);
  const used = usage?.used ?? leadUsedThisPeriod(subscription);
  const blocked = !canPullLeads(subscription);
  const limitReached = allowance !== null && used >= allowance;

  const search = async () => {
    if (!area || !industry) return;
    if (blocked) {
      toast({ title: "Lead pull limit reached", description: "Upgrade your plan to pull more leads.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setLeads([]);
    setAdded(new Set());
    setSearched(false);
    try {
      const res = await findLeads({ area, industry });
      const data = res.data || {};
      if (data.usage) setUsage(data.usage);
      if (data.limit_reached) {
        toast({ title: "Lead pull limit reached", description: "Upgrade your plan to pull more leads.", variant: "destructive" });
      }
      setLeads(data.leads || []);
    } catch (e) {
      const msg = e.response?.data?.error || e.message;
      if (e.response?.data?.limit_reached) {
        setUsage({ allowance: e.response.data.allowance, used: e.response.data.allowance, trial: e.response.data.trial });
      }
      toast({ title: "Search failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  const addLead = async (lead, i) => {
    try {
      await base44.entities.Customer.create({
        business_name: lead.business_name,
        contact_name: lead.contact_name || "",
        phone: lead.phone || "",
        whatsapp_number: lead.whatsapp_number || lead.phone || "",
        address: lead.address,
        area: lead.area,
        industry: lead.industry,
        status: "new",
        source: "lead_finder",
        organization_id: orgId,
      });
      setAdded((s) => new Set(s).add(i));
      toast({ title: "Added as customer", description: lead.business_name });
    } catch (e) {
      toast({ title: "Failed to add", description: e.message, variant: "destructive" });
    }
  };

  const usageLabel = useMemo(() => {
    if (allowance === null) return `${used} lead pulls used this month · unlimited`;
    return `${used} of ${allowance} lead pulls used ${trial ? "this trial" : "this month"}`;
  }, [used, allowance, trial]);

  return (
    <AppLayout>
      <PageHeader title="Lead Finder" subtitle="Discover new businesses by area and industry" />

      {/* Trial / read-only banner */}
      {readOnly ? (
        <Banner tone="destructive" icon={Lock}>
          Your account is in read-only mode. Lead Finder is paused. Export is still available on the Customers and Orders pages.
        </Banner>
      ) : trial ? (
        <Banner tone="amber" icon={Sparkles}>
          Trial mode — Lead Finder is capped at {allowance} pulls total, WhatsApp sends at 100, and bulk export is disabled. Limits lift after your first payment on day 14.
        </Banner>
      ) : null}

      {/* Usage meter */}
      <div className="bg-card rounded-2xl border border-border/60 p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-600">{usageLabel}</span>
          {limitReached && !readOnly && (
            <Button size="sm" onClick={() => (window.location.href = "/billing")}>Upgrade plan</Button>
          )}
        </div>
        {allowance !== null && (
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className={`h-full rounded-full ${limitReached ? "bg-destructive" : "bg-primary"}`} style={{ width: `${Math.min(100, (used / allowance) * 100)}%` }} />
          </div>
        )}
        {limitReached && !readOnly && (
          <p className="text-xs text-muted-foreground mt-2">
            You've reached your {trial ? "trial" : "monthly"} limit. {trial ? "Upgrade to keep pulling leads." : "Top up by upgrading your plan."}
          </p>
        )}
      </div>

      <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm mb-6">
        <div className="grid sm:grid-cols-3 gap-3 items-end">
          <div className="space-y-2">
            <Label>Area / city</Label>
            <Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Nairobi CBD" className="h-11" />
          </div>
          <div className="space-y-2">
            <Label>Industry</Label>
            <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. Grocery / Mini mart" className="h-11" list="lead-industries" />
            <datalist id="lead-industries">
              {INDUSTRIES.map((i) => <option key={i} value={i} />)}
            </datalist>
          </div>
          <Button onClick={search} disabled={loading || !area || !industry || blocked} className="h-11">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
            {loading ? "Searching…" : "Find businesses"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-3">Uses live web search. Results are suggestions — verify before reaching out.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-sm">Searching the web for {industry} businesses in {area}…</p>
        </div>
      ) : leads.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {leads.map((lead, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border/60 p-4 shadow-sm flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-600 truncate">{lead.business_name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" /> {lead.area}
                  </p>
                </div>
                <span className="text-[10px] font-600 uppercase tracking-wide bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded shrink-0">
                  {lead.industry}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-3 space-y-1">
                {lead.contact_name && <p>{lead.contact_name}</p>}
                {lead.phone && <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {lead.phone}</p>}
                <p className="text-foreground/70">{lead.address}</p>
              </div>
              <Button
                size="sm"
                variant={added.has(i) ? "outline" : "default"}
                className="mt-4 w-full"
                disabled={added.has(i)}
                onClick={() => addLead(lead, i)}
              >
                {added.has(i) ? <><Check className="w-4 h-4 mr-1.5" /> Added</> : <><Plus className="w-4 h-4 mr-1.5" /> Add as customer</>}
              </Button>
            </div>
          ))}
        </div>
      ) : searched ? (
        <EmptyState icon={Search} title="No businesses found" description="Try a different area or industry." />
      ) : (
        <EmptyState icon={Search} title="Find your next customers" description="Enter an area and industry to discover new businesses to sell to." />
      )}

      <p className="text-xs text-faint mt-8 text-center max-w-2xl mx-auto leading-relaxed">
        {TERMS_LINE}
      </p>
    </AppLayout>
  );
}

function Banner({ tone, icon: Icon, children }) {
  const tones = {
    amber: "bg-accent/10 border-accent/30 text-foreground",
    destructive: "bg-destructive/10 border-destructive/30 text-foreground",
  };
  return (
    <div className={`flex items-start gap-3 rounded-2xl border p-4 mb-4 ${tones[tone]}`}>
      <Icon className="w-4 h-4 mt-0.5 shrink-0 text-faint" />
      <p className="text-sm">{children}</p>
    </div>
  );
}