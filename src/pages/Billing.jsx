import React, { useEffect, useState } from "react";
import { useOrg } from "@/lib/OrgContext";
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { CreditCard, Check, Calendar, AlertTriangle, Lock, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { PLANS, getPlan, setupFeeFor, annualPrice, aed, READ_ONLY_DAYS } from "@/lib/plans";
import { isTrial, isReadOnly, readOnlyUntilDate, trialDaysLeft, minTermEnd, canCancelWithoutPenalty, leadAllowance } from "@/lib/planRules";
import { toast } from "@/components/ui/use-toast";
import UpdateCardDialog from "@/components/stripe/UpdateCardDialog";
import { getBillingOverview } from "@/functions/getBillingOverview";
import { cancelSubscription } from "@/functions/cancelSubscription";
import { switchBillingCycle } from "@/functions/switchBillingCycle";

export default function Billing() {
  const { subscription } = useOrg();
  const sub = subscription?.data;
  const plan = getPlan(sub?.plan);
  const cycle = sub?.billing_cycle || "monthly";
  const setupFee = setupFeeFor(sub?.plan, cycle);
  const trial = isTrial(subscription);
  const readOnly = isReadOnly(subscription);
  const readOnlyUntil = readOnlyUntilDate(subscription);
  const daysLeft = trialDaysLeft(subscription);
  const minEnd = minTermEnd(subscription);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [switching, setSwitching] = useState(false);

  const cycleAmount = cycle === "annual" ? annualPrice(plan.monthly) : plan.monthly;

  const loadOverview = async () => {
    setLoadingOverview(true);
    try {
      const res = await getBillingOverview({});
      setOverview(res.data);
    } catch (e) {
      /* ignore — overview is informational */
    } finally {
      setLoadingOverview(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const cancelPlan = async () => {
    setCancelling(true);
    try {
      const res = await cancelSubscription({});
      const data = res.data;
      if (data.cancelledAt) {
        toast({ title: "Plan cancelled", description: `Read-only access until ${format(new Date(data.cancelledAt), "dd MMM yyyy")}.` });
      } else {
        toast({ title: "Cancellation scheduled", description: `Your plan stays active until ${format(new Date(data.cancelAt), "dd MMM yyyy")}.` });
      }
      setCancelOpen(false);
      window.location.reload();
    } catch (e) {
      toast({ title: "Failed to cancel", description: e.message, variant: "destructive" });
    } finally {
      setCancelling(false);
    }
  };

  const switchCycle = async (newCycle) => {
    if (newCycle === cycle || switching) return;
    setSwitching(true);
    try {
      await switchBillingCycle({ billingCycle: newCycle });
      toast({ title: `Switched to ${newCycle} billing` });
      window.location.reload();
    } catch (e) {
      toast({ title: "Failed to update", description: e.message, variant: "destructive" });
    } finally {
      setSwitching(false);
    }
  };

  const cardLabel = overview?.card?.brand
    ? `${overview.card.brand.charAt(0).toUpperCase() + overview.card.brand.slice(1)} •••• ${overview.card.last4}`
    : "No card on file";

  return (
    <AppLayout>
      <PageHeader title="Billing" subtitle="Plan, trial and invoices" />

      {readOnly && readOnlyUntil && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 mb-6">
          <Lock className="w-4 h-4 mt-0.5 shrink-0 text-destructive" />
          <div className="flex-1">
            <p className="font-600 text-sm">Account is in read-only mode</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Sending, lead pulls and new orders are disabled. Your account will close on{" "}
              <span className="font-600 text-foreground">{format(readOnlyUntil, "dd MMM yyyy")}</span>. You can still export your own data from Customers and Orders.
            </p>
          </div>
        </div>
      )}

      {overview?.pendingCancel && overview.cancelAt && (
        <div className="flex items-start gap-3 rounded-2xl border border-accent/30 bg-accent/10 p-4 mb-6">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-accent" />
          <div className="flex-1">
            <p className="font-600 text-sm">Cancellation scheduled</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Your plan stays active and billed until <span className="font-600 text-foreground">{format(new Date(overview.cancelAt), "dd MMM yyyy")}</span>, then enters a {READ_ONLY_DAYS}-day read-only window.
            </p>
          </div>
        </div>
      )}

      {sub?.status === "past_due" && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 mb-6">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-destructive" />
          <div className="flex-1">
            <p className="font-600 text-sm">Your last payment failed</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Update your card so we can retry the charge. Some features are paused until payment succeeds.
            </p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => setUpdateOpen(true)}>Update card</Button>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border/60 shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current plan</p>
              <p className="text-2xl font-700 font-heading mt-1">{plan.name}</p>
              <p className="text-3xl font-700 font-heading mt-2">
                {cycleAmount ? aed(cycleAmount) : "Custom"}
                {cycleAmount && <span className="text-base font-400 text-muted-foreground">/{cycle === "annual" ? "yr" : "mo"}</span>}
              </p>
              <p className="text-xs text-muted-foreground mt-1 capitalize">{cycle} billing</p>
            </div>
            <StatusBadge status={sub?.status || "trial"} />
          </div>

          {/* Setup fee + min term */}
          <div className="mt-5 grid sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">One-time setup fee</p>
              <p className="font-700 mt-0.5">{setupFee === null ? "Custom" : setupFee === 0 ? "Waived" : aed(setupFee)}</p>
              <p className="text-[11px] text-faint mt-0.5">{setupFee === 0 ? "Waived on annual billing" : "Non-refundable · charged on day 14"}</p>
            </div>
            <div className="rounded-xl border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">Minimum term</p>
              <p className="font-700 mt-0.5">{cycle === "annual" ? "12 months (prepaid)" : "3 months"}</p>
              {minEnd && <p className="text-[11px] text-faint mt-0.5">Ends {format(minEnd, "dd MMM yyyy")}</p>}
            </div>
          </div>

          {/* Next charge + saved card */}
          <div className="mt-3 grid sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">Next charge</p>
              {overview?.nextChargeAmount != null && overview?.nextChargeDate ? (
                <>
                  <p className="font-700 mt-0.5">{aed(overview.nextChargeAmount)}</p>
                  <p className="text-[11px] text-faint mt-0.5">{format(new Date(overview.nextChargeDate), "dd MMM yyyy")}</p>
                </>
              ) : sub?.trial_end ? (
                <>
                  <p className="font-700 mt-0.5">{setupFee === 0 ? aed(cycleAmount || 0) : aed((setupFee || 0) + (cycleAmount || 0))}</p>
                  <p className="text-[11px] text-faint mt-0.5">{format(new Date(sub.trial_end), "dd MMM yyyy")}</p>
                </>
              ) : (
                <p className="font-700 mt-0.5">—</p>
              )}
            </div>
            <div className="rounded-xl border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">Saved card</p>
              <p className="font-700 mt-0.5 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-faint" /> {cardLabel}
              </p>
              <button className="text-[11px] text-primary mt-0.5 hover:underline" onClick={() => setUpdateOpen(true)}>Update card</button>
            </div>
          </div>

          {trial && (
            <div className="mt-4 p-4 rounded-xl bg-accent/5 border border-accent/20">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-accent" />
                <p className="font-600 text-sm">Free trial — {daysLeft} days left</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Day 14: {setupFee === null ? "custom setup" : setupFee === 0 ? "setup waived" : `${aed(setupFee)} one-time setup`}
                {setupFee !== 0 ? (cycleAmount ? ` + ${aed(cycleAmount)} first ${cycle === "annual" ? "year" : "month"}` : " + first period") : (cycleAmount ? ` ${aed(cycleAmount)} first year` : " first period")}
                {setupFee === 0 ? " is charged" : " are charged"}.
              </p>
              <div className="mt-3 h-2 rounded-full bg-accent/10 overflow-hidden">
                <div className="h-full bg-accent rounded-full" style={{ width: `${((14 - (daysLeft || 0)) / 14) * 100}%` }} />
              </div>
            </div>
          )}

          {/* Billing cycle switch */}
          <div className="mt-5">
            <p className="text-xs text-muted-foreground mb-2">Billing cycle</p>
            <div className="flex p-1 rounded-[10px] bg-muted w-full max-w-sm">
              <button
                onClick={() => switchCycle("monthly")}
                disabled={switching}
                className={`flex-1 h-9 rounded-[8px] text-sm font-600 transition-colors flex items-center justify-center ${cycle === "monthly" ? "bg-white text-foreground shadow-sm" : "text-faint"}`}
              >
                {switching && cycle !== "monthly" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Monthly"}
              </button>
              <button
                onClick={() => switchCycle("annual")}
                disabled={switching}
                className={`flex-1 h-9 rounded-[8px] text-sm font-600 transition-colors flex items-center justify-center gap-1.5 ${cycle === "annual" ? "bg-white text-foreground shadow-sm" : "text-faint"}`}
              >
                {switching && cycle !== "annual" ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Annual <span className="text-[10px] font-700 text-success">2 months free</span></>}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-5">
            <Button variant="outline" onClick={() => setUpdateOpen(true)}>Update card</Button>
            {!readOnly && !overview?.pendingCancel && (
              <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setCancelOpen(true)}>
                Cancel plan
              </Button>
            )}
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6">
          <p className="text-sm text-muted-foreground mb-3">Included</p>
          <ul className="space-y-2.5">
            <li className="text-sm flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> {sub?.seats || 3} team seats</li>
            <li className="text-sm flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> WhatsApp inbox</li>
            <li className="text-sm flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" /> Lead Finder · {(() => {
                const lim = leadAllowance(subscription);
                return lim === null ? "unlimited" : `${lim}/mo`;
              })()}
            </li>
            <li className="text-sm flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Orders & reminders</li>
          </ul>
        </div>
      </div>

      {/* Invoices from Stripe */}
      <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
          <h3 className="font-600 text-sm">Invoices</h3>
          <Button variant="ghost" size="sm" onClick={loadOverview} disabled={loadingOverview}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loadingOverview ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
        {loadingOverview && !overview ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-faint" /></div>
        ) : overview?.invoices?.length ? (
          <div className="divide-y divide-border">
            {overview.invoices.map((inv) => (
              <div key={inv.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-600 truncate">{inv.number || inv.id}</p>
                  <p className="text-xs text-faint">{inv.created ? format(new Date(inv.created), "dd MMM yyyy") : "—"}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-600 px-2 py-0.5 rounded-full ${inv.status === "paid" ? "bg-success-muted text-success" : inv.status === "open" || inv.status === "draft" ? "bg-warning-muted text-warning" : "bg-muted text-faint"}`}>
                    {inv.status}
                  </span>
                  <span className="text-sm font-700 w-20 text-right">{aed(inv.amount)}</span>
                  {inv.url && (
                    <a href={inv.url} target="_blank" rel="noreferrer" className="text-faint hover:text-primary">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CreditCard className="w-8 h-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              {trial ? `No invoices yet — your first charge happens on day 14 (setup + first ${cycle === "annual" ? "year" : "month"}).` : "No invoices yet."}
            </p>
          </div>
        )}
      </div>

      <UpdateCardDialog open={updateOpen} onOpenChange={setUpdateOpen} onUpdated={() => loadOverview()} />

      {/* Cancel confirmation */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel your plan?</DialogTitle>
            <DialogDescription>
              {!canCancelWithoutPenalty(subscription)
                ? "You're within the minimum term. We'll schedule the cancellation for the end of your minimum term — billing continues until then."
                : "Your plan will be cancelled at the end of the current billing period. A 30-day read-only window follows so you can export your data."}
            </DialogDescription>
          </DialogHeader>
          {!canCancelWithoutPenalty(subscription) && minEnd && (
            <div className="flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/10 p-3">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-accent" />
              <p className="text-sm">
                Minimum term ends <span className="font-600">{format(minEnd, "dd MMM yyyy")}</span>. Billing continues until then; access enters read-only mode after.
              </p>
            </div>
          )}
          {cycle === "annual" && (
            <div className="flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/10 p-3">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-accent" />
              <p className="text-sm">Annual plans are prepaid and non-refundable. Cancelling stops renewal; access continues in read-only mode until the read-only window ends.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>Keep plan</Button>
            <Button variant="destructive" onClick={cancelPlan} disabled={cancelling}>
              {cancelling ? "Cancelling…" : "Cancel plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}