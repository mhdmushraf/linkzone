import React from "react";
import { useOrg } from "@/lib/OrgContext";
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { CreditCard, Check, Calendar } from "lucide-react";
import { differenceInDays, format } from "date-fns";

const PLANS = {
  starter: { name: "Starter", price: 29 },
  growth: { name: "Growth", price: 79 },
  enterprise: { name: "Enterprise", price: 199 },
};

export default function Billing() {
  const { subscription, organization } = useOrg();

  const trialDaysLeft = subscription?.data?.trial_end
    ? Math.max(0, differenceInDays(new Date(subscription.data.trial_end), new Date()))
    : null;

  const plan = PLANS[subscription?.data?.plan] || PLANS.starter;

  return (
    <AppLayout>
      <PageHeader title="Billing" subtitle="Plan, trial and invoices" />

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border/60 shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current plan</p>
              <p className="text-2xl font-700 font-heading mt-1">{plan.name}</p>
              <p className="text-3xl font-700 font-heading mt-2">${plan.price}<span className="text-base font-400 text-muted-foreground">/mo</span></p>
            </div>
            <StatusBadge status={subscription?.data?.status || "trial"} />
          </div>

          {subscription?.data?.status === "trial" && (
            <div className="mt-5 p-4 rounded-xl bg-accent/5 border border-accent/20">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-accent" />
                <p className="font-600 text-sm">Free trial</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {trialDaysLeft} days left — your card will be charged ${plan.price} on{" "}
                {subscription.data.trial_end ? format(new Date(subscription.data.trial_end), "dd MMM yyyy") : "day 14"}.
              </p>
              <div className="mt-3 h-2 rounded-full bg-accent/10 overflow-hidden">
                <div className="h-full bg-accent rounded-full" style={{ width: `${((14 - (trialDaysLeft || 0)) / 14) * 100}%` }} />
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-5">
            <Button variant="outline">Change plan</Button>
            <Button variant="outline">Update card</Button>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6">
          <p className="text-sm text-muted-foreground mb-3">Included</p>
          <ul className="space-y-2.5">
            <li className="text-sm flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> {subscription?.data?.seats || 3} team seats</li>
            <li className="text-sm flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> WhatsApp inbox</li>
            <li className="text-sm flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Lead Finder</li>
            <li className="text-sm flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Orders & reminders</li>
          </ul>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/30">
          <h3 className="font-600 text-sm">Invoices</h3>
        </div>
        {subscription?.data?.status === "trial" ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CreditCard className="w-8 h-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No invoices yet — your first charge happens at the end of the trial.</p>
          </div>
        ) : (
          <p className="p-5 text-sm text-muted-foreground">Invoice history will appear here once your trial ends.</p>
        )}
      </div>
    </AppLayout>
  );
}