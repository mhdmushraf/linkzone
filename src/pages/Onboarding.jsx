import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Check, Store, Wrench, Pill, Laptop, Pencil, Box, Building2, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { AuthSidePanel } from "@/components/AuthLayout";
import { cn } from "@/lib/utils";
import { PLANS, setupFeeFor, annualPrice, aed } from "@/lib/plans";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe, STRIPE_APPEARANCE } from "@/lib/stripeClient";
import { createSetupIntent } from "@/functions/createSetupIntent";
import { startTrial } from "@/functions/startTrial";
import PaymentSetup from "@/components/stripe/PaymentSetup";

const INDUSTRIES = [
  { name: "FMCG distribution", icon: Store },
  { name: "Spare parts", icon: Wrench },
  { name: "Pharmacy trading", icon: Pill },
  { name: "IT & office supplies", icon: Laptop },
  { name: "Stationery", icon: Pencil },
  { name: "Packaging", icon: Box },
  { name: "Other", icon: Building2 },
];

const STEPS = ["Account", "Industry", "Plan"];
const inputCls = "h-12 rounded-[10px] bg-white border-border";
const TERMS_LINE = "Lead data is licensed for use inside your Linkzone subscription and may not be resold or redistributed.";

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(localStorage.getItem("lz_name") || "");
  const [company, setCompany] = useState(localStorage.getItem("lz_company") || "");
  const [industry, setIndustry] = useState("");
  const [plan, setPlan] = useState("growth");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [submitting, setSubmitting] = useState(false);
  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const createdRef = useRef(null);

  const selectedPlan = PLANS.find((p) => p.id === plan);
  const setupFee = setupFeeFor(plan, billingCycle);
  const firstMonth = selectedPlan.monthly;
  const annual = annualPrice(firstMonth);

  useEffect(() => {
    getStripe().then(setStripePromise).catch((e) => {
      toast({ title: "Payment setup failed", description: e.message, variant: "destructive" });
    });
  }, []);

  useEffect(() => {
    if (step === 2 && !clientSecret) {
      createSetupIntent({})
        .then((res) => setClientSecret(res.data.clientSecret))
        .catch((e) => toast({ title: "Payment setup failed", description: e.message, variant: "destructive" }));
    }
  }, [step, clientSecret]);

  const noteText = `Your card is saved and charged AED 0. On day 14 ${
    setupFee === 0
      ? `the first ${billingCycle === "annual" ? "year" : "month"} is charged (setup fee waived)`
      : setupFee === null
        ? `the first ${billingCycle === "annual" ? "year" : "month"} plus custom setup are charged`
        : `the first ${billingCycle === "annual" ? "year" : "month"} plus the ${aed(setupFee)} one-time setup fee are charged`
  }. Cancel anytime before.`;

  const onConfirmed = async (setupIntent) => {
    setSubmitting(true);
    try {
      let orgId, subId;
      if (createdRef.current) {
        orgId = createdRef.current.orgId;
        subId = createdRef.current.subId;
      } else {
        const me = await base44.auth.me();
        const org = await base44.entities.Organization.create({
          name: company,
          industry,
          brand_color: "#6B4EF0",
          whatsapp_connected: false,
          members: [me.id],
        });
        orgId = org.id;
        const now = new Date();
        const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        const minTermMonths = billingCycle === "annual" ? 12 : 3;
        const minTermEnd = new Date(trialEnd.getTime() + minTermMonths * 30 * 24 * 60 * 60 * 1000);
        const sub = await base44.entities.Subscription.create({
          organization_id: org.id,
          plan,
          status: "trial",
          trial_start: now.toISOString(),
          trial_end: trialEnd.toISOString(),
          amount: billingCycle === "annual" ? annual || 0 : firstMonth || 0,
          seats: selectedPlan.seats,
          billing_cycle: billingCycle,
          setup_fee: setupFee === null ? 0 : setupFee,
          setup_fee_paid: false,
          min_term_end: minTermEnd.toISOString(),
          lead_limit_monthly: selectedPlan.leadLimit === null ? 0 : selectedPlan.leadLimit,
          lead_pulls_used: 0,
          lead_pulls_month: now.toISOString().slice(0, 7),
          lead_pulls_trial_used: 0,
          whatsapp_sends_used: 0,
          whatsapp_sends_month: now.toISOString().slice(0, 7),
          stripe_customer_id: setupIntent.customer,
        });
        subId = sub.id;
        await base44.auth.updateMe({ organization_id: org.id, app_role: "owner", name });
        createdRef.current = { orgId, subId };
      }
      await startTrial({
        organizationId: orgId,
        subId,
        customerId: setupIntent.customer,
        paymentMethodId: setupIntent.payment_method,
        plan,
        billingCycle,
      });
      localStorage.removeItem("lz_name");
      localStorage.removeItem("lz_company");
      toast({ title: "Welcome to Linkzone", description: "Your 14-day trial has started." });
      window.location.href = "/dashboard";
    } catch (e) {
      toast({ title: "Payment setup failed", description: e.message, variant: "destructive" });
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <AuthSidePanel />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="flex-1 flex flex-col px-6 py-10 lg:px-16 max-w-2xl w-full mx-auto">
          {/* Stepper */}
          <div className="flex items-center gap-2 mb-10">
            {STEPS.map((label, i) => (
              <React.Fragment key={label}>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-700 transition-colors",
                      i < step ? "bg-success text-white" : i === step ? "bg-primary text-white" : "bg-muted text-faint"
                    )}
                  >
                    {i < step ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : i + 1}
                  </div>
                  <span className={cn("text-sm font-600 hidden sm:inline", i === step ? "text-foreground" : "text-faint")}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn("flex-1 h-px mx-1", i < step ? "bg-success" : "bg-border")} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step 0: Account */}
          {step === 0 && (
            <div>
              <h1 className="font-display font-extrabold text-[1.75rem] tracking-tight" style={{ letterSpacing: "-0.02em" }}>
                Set up your company
              </h1>
              <p className="text-muted-foreground mt-2 mb-7">Tell us about you and your business.</p>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="font-600">Your full name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-600">Company name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
                    <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Distribution Ltd" className={`pl-10 ${inputCls}`} />
                  </div>
                </div>
              </div>
              <Button className="w-full h-12 mt-7 font-600 rounded-[10px]" disabled={!name || !company || submitting} onClick={() => setStep(1)}>
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 1: Industry */}
          {step === 1 && (
            <div>
              <h1 className="font-display font-extrabold text-[1.75rem] tracking-tight" style={{ letterSpacing: "-0.02em" }}>
                What do you distribute?
              </h1>
              <p className="text-muted-foreground mt-2 mb-7">Pick your industry. You can change this later.</p>
              <div className="grid grid-cols-2 gap-3">
                {INDUSTRIES.map((ind) => (
                  <button
                    key={ind.name}
                    onClick={() => setIndustry(ind.name)}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all",
                      industry === ind.name ? "border-primary bg-tint" : "border-border bg-white hover:border-primary/40"
                    )}
                  >
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", industry === ind.name ? "bg-primary text-white" : "bg-tint text-primary")}>
                      <ind.icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-600 flex-1">{ind.name}</span>
                    {industry === ind.name && <Check className="w-4 h-4 text-primary" strokeWidth={3} />}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-7">
                <Button variant="outline" className="h-12 flex-1 rounded-[10px] bg-white font-600" onClick={() => setStep(0)}>Back</Button>
                <Button className="h-12 flex-1 rounded-[10px] font-600" disabled={!industry || submitting} onClick={() => setStep(2)}>
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Plan */}
          {step === 2 && (
            <div>
              <h1 className="font-display font-extrabold text-[1.75rem] tracking-tight" style={{ letterSpacing: "-0.02em" }}>
                Choose your plan
              </h1>
              <p className="text-muted-foreground mt-2 mb-5">14-day free trial. No charge until day 14.</p>

              {/* Billing cycle toggle */}
              <div className="flex p-1 rounded-[10px] bg-muted mb-4 w-full max-w-xs">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={cn("flex-1 h-9 rounded-[8px] text-sm font-600 transition-colors", billingCycle === "monthly" ? "bg-white text-foreground shadow-sm" : "text-faint")}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle("annual")}
                  className={cn("flex-1 h-9 rounded-[8px] text-sm font-600 transition-colors flex items-center justify-center gap-1.5", billingCycle === "annual" ? "bg-white text-foreground shadow-sm" : "text-faint")}
                >
                  Annual <span className="text-[10px] font-700 text-success">2 months free</span>
                </button>
              </div>

              <div className="space-y-3">
                {PLANS.map((p) => {
                  const selected = plan === p.id;
                  const price = billingCycle === "annual" ? annualPrice(p.monthly) : p.monthly;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPlan(p.id)}
                      className={cn(
                        "w-full p-4 rounded-2xl border-2 text-left transition-all",
                        selected ? "border-primary bg-tint" : "border-border bg-white hover:border-primary/40"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-700 font-display">{p.name}</span>
                          {p.popular && (
                            <span className="text-[10px] font-700 uppercase tracking-wide bg-accent text-white px-1.5 py-0.5 rounded-md">Popular</span>
                          )}
                        </div>
                        <span className="font-display font-extrabold text-lg">
                          {price ? aed(price) : "Custom"}
                          {price && <span className="text-xs text-faint font-500">/{billingCycle === "annual" ? "yr" : "mo"}</span>}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{p.tagline}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        {p.features.map((f) => (
                          <span key={f} className="text-xs text-muted-foreground flex items-center gap-1">
                            <Check className="w-3 h-3 text-success" strokeWidth={3} /> {f}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Setup fee line */}
              <div className="flex items-center justify-between gap-2 mt-4 px-1 text-sm">
                <span className="text-muted-foreground">
                  One-time setup fee <span className="text-faint">(non-refundable{billingCycle === "annual" ? ", waived annually" : ""})</span>
                </span>
                <span className="font-600">
                  {setupFee === null ? "Custom" : setupFee === 0 ? "Waived" : aed(setupFee)}
                </span>
              </div>

              {/* Green strip */}
              <div className="rounded-[10px] bg-success-muted p-3.5 mt-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-600 text-success">Today's charge</span>
                  <span className="text-sm font-700 text-success">AED 0.00</span>
                  <span className="text-xs font-600 text-success bg-white/60 px-2 py-0.5 rounded-md">14 days free</span>
                </div>
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-success/20">
                  <span className="text-xs font-600 text-success">Day 14</span>
                  <span className="text-xs font-700 text-success">
                    {setupFee === null
                      ? "Custom setup"
                      : setupFee === 0
                        ? `${annual ? aed(annual) : ""} first year`
                        : `${aed(setupFee)} one-time setup${firstMonth ? ` + ${aed(firstMonth)} first month` : " + first month"}`}
                  </span>
                </div>
              </div>

              {/* Card details (Stripe Elements) */}
              {stripePromise && clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret, appearance: STRIPE_APPEARANCE }}>
                  <PaymentSetup onBack={() => setStep(1)} onConfirmed={onConfirmed} submitting={submitting} noteText={noteText} />
                </Elements>
              ) : (
                <div className="mt-5 flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-faint" />
                </div>
              )}
            </div>
          )}

          <p className="text-center text-xs text-faint mt-6 leading-relaxed">
            By continuing you agree to the Linkzone terms. {TERMS_LINE}
          </p>
        </div>
      </div>
    </div>
  );
}