import React, { useState } from "react";
import { useOrg } from "@/lib/OrgContext";
import { base44 } from "@/api/base44Client";
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { CreditCard, Check, Calendar, AlertTriangle, Lock, Download } from "lucide-react";
import { differenceInDays, format, addDays } from "date-fns";
import { PLANS, getPlan, setupFeeFor, annualPrice, aed, SETUP_FEE, READ_ONLY_DAYS } from "@/lib/plans";
import { isTrial, isReadOnly, readOnlyUntilDate, trialDaysLeft, minTermEnd, canCancelWithoutPenalty, leadUsedThisPeriod, leadAllowance } from "@/lib/planRules";
import { toast } from "@/components/ui/use-toast";
import { downloadCSV } from "@/lib/csv";

export default function Billing() {
  const { subscription, organization } = useOrg();
  const sub = subscription?.data;
  const plan = getPlan(sub?.plan);
  const setupFee = setupFeeFor(sub?.plan);
  const trial = isTrial(subscription);
  const readOnly = isReadOnly(subscription);
  const readOnlyUntil = readOnlyUntilDate(subscription);
  const daysLeft = trialDaysLeft(subscription);
  const minEnd = minTermEnd(subscription);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const cycle = sub?.billing_cycle || "monthly";
  const cycleAmount = cycle === "annual" ? annualPrice(plan.monthly) : plan.monthly;

  const cancelPlan = async () => {
    setCancelling(true);
    try {
      const until = addDays(new Date(), READ_ONLY_DAYS);
      await base44.entities.Subscription.update(subscription.id, {
        status: "cancelled",
        cancelled_date: new Date().toISOString(),
        read_only_until: until.toISOString(),
      });
      toast({ title: "Plan cancelled", description: `Read-only access until ${format(until, "dd MMM yyyy")}.` });
      setCancelOpen(false);
      window.location.reload();
    } catch (e) {
      toast({ title: "Failed to cancel", description: e.message, variant: "destructive" });
    } finally {
      setCancelling(false);
    }
  };

  const switchCycle = async (newCycle) => {
    if (newCycle === cycle) return;
    try {
      await base44.entities.Subscription.update(subscription.id, {
        billing_cycle: newCycle,
        amount: newCycle === "annual" ? annualPrice(plan.monthly) || 0 : plan.monthly || 0,
      });
      toast({ title: `Switched to ${newCycle} billing` });
      window.location.reload();
    } catch (e) {
      toast({ title: "Failed to update", description: e.message, variant: "destructive" });
    }
  };

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
              <p className="font-700 mt-0.5">{setupFee === null ? "Custom" : aed(setupFee)}</p>
              <p className="text-[11px] text-faint mt-0.5">Non-refundable · charged on day 14</p>
            </div>
            <div className="rounded-xl border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">Minimum term</p>
              <p className="font-700 mt-0.5">
                {cycle === "annual" ? "12 months (prepaid)" : "3 months"}
              </p>
              {minEnd && (
                <p className="text-[11px] text-faint mt-0.5">Ends {format(minEnd, "dd MMM yyyy")}</p>
              )}
            </div>
          </div>

          {trial && (
            <div className="mt-4 p-4 rounded-xl bg-accent/5 border border-accent/20">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-accent" />
                <p className="font-600 text-sm">Free trial — {daysLeft} days left</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Day 14: {setupFee === null ? "custom setup" : aed(setupFee)} one-time setup
                {cycleAmount ? ` + ${aed(cycleAmount)} first ${cycle === "annual" ? "year" : "month"}` : " + first period"} are charged.
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
                className={`flex-1 h-9 rounded-[8px] text-sm font-600 transition-colors ${cycle === "monthly" ? "bg-white text-foreground shadow-sm" : "text-faint"}`}
              >
                Monthly
              </button>
              <button
                onClick={() => switchCycle("annual")}
                className={`flex-1 h-9 rounded-[8px] text-sm font-600 transition-colors flex items-center justify-center gap-1.5 ${cycle === "annual" ? "bg-white text-foreground shadow-sm" : "text-faint"}`}
              >
                Annual <span className="text-[10px] font-700 text-success">2 months free</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-5">
            <Button variant="outline">Change plan</Button>
            <Button variant="outline">Update card</Button>
            {!readOnly && (
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

      <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
          <h3 className="font-600 text-sm">Invoices</h3>
          <Button variant="outline" size="sm" onClick={() => downloadCSV("linkzone-invoices.csv", [])}>
            <Download className="w-4 h-4 mr-1.5" /> Export
          </Button>
        </div>
        {trial ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CreditCard className="w-8 h-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No invoices yet — your first charge happens on day 14 (setup + first {cycle === "annual" ? "year" : "month"}).</p>
          </div>
        ) : (
          <p className="p-5 text-sm text-muted-foreground">Invoice history will appear here once your trial ends.</p>
        )}
      </div>

      {/* Cancel confirmation */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel your plan?</DialogTitle>
            <DialogDescription>This will put your account into read-only mode for {READ_ONLY_DAYS} days. You can still export your data.</DialogDescription>
          </DialogHeader>
          {!canCancelWithoutPenalty(subscription) && minEnd && (
            <div className="flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/10 p-3">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-accent" />
              <p className="text-sm">
                You're within the minimum term. Your plan stays active and billed until{" "}
                <span className="font-600">{format(minEnd, "dd MMM yyyy")}</span>. Cancelling now will still end access after the {READ_ONLY_DAYS}-day read-only window, but billing continues until the minimum term ends.
              </p>
            </div>
          )}
          {cycle === "annual" && (
            <div className="flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/10 p-3">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-accent" />
              <p className="text-sm">Annual plans are prepaid and non-refundable. Cancelling will stop renewal; access continues in read-only mode until the read-only window ends.</p>
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