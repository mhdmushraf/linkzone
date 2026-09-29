import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Check, Store, Wrench, Pill, Laptop, Pencil, Box, Building2, CreditCard, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { AuthSidePanel } from "@/components/AuthLayout";
import { cn } from "@/lib/utils";

const INDUSTRIES = [
  { name: "FMCG distribution", icon: Store },
  { name: "Spare parts", icon: Wrench },
  { name: "Pharmacy trading", icon: Pill },
  { name: "IT & office supplies", icon: Laptop },
  { name: "Stationery", icon: Pencil },
  { name: "Packaging", icon: Box },
  { name: "Other", icon: Building2 },
];

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 299,
    seats: 3,
    tagline: "For solo reps and small teams",
    features: ["3 team members", "200 customers", "WhatsApp inbox", "Basic dashboard"],
  },
  {
    id: "growth",
    name: "Growth",
    price: 699,
    seats: 10,
    tagline: "For growing distribution teams",
    features: ["10 team members", "Unlimited customers", "Lead Finder", "Reorder reminders", "Per-route analytics"],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: null,
    seats: 50,
    tagline: "For large wholesale operations",
    features: ["50 team members", "Unlimited everything", "Advanced analytics", "Priority support", "Custom branding"],
  },
];

const STEPS = ["Account", "Industry", "Plan"];
const inputCls = "h-12 rounded-[10px] bg-white border-border";

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(localStorage.getItem("lz_name") || "");
  const [company, setCompany] = useState(localStorage.getItem("lz_company") || "");
  const [industry, setIndustry] = useState("");
  const [plan, setPlan] = useState("growth");
  const [card, setCard] = useState({ number: "", expiry: "", cvc: "" });
  const [submitting, setSubmitting] = useState(false);

  const finish = async () => {
    setSubmitting(true);
    try {
      const me = await base44.auth.me();
      const org = await base44.entities.Organization.create({
        name: company,
        industry,
        brand_color: "#6B4EF0",
        whatsapp_connected: false,
        members: [me.id],
      });
      const now = new Date();
      const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      const selected = PLANS.find((p) => p.id === plan);
      await base44.entities.Subscription.create({
        organization_id: org.id,
        plan,
        status: "trial",
        trial_start: now.toISOString(),
        trial_end: trialEnd.toISOString(),
        amount: selected.price || 0,
        seats: selected.seats,
      });
      await base44.auth.updateMe({
        organization_id: org.id,
        app_role: "owner",
        name,
      });
      localStorage.removeItem("lz_name");
      localStorage.removeItem("lz_company");
      toast({ title: "Welcome to Linkzone", description: "Your 14-day trial has started." });
      window.location.href = "/";
    } catch (e) {
      toast({ title: "Something went wrong", description: e.message, variant: "destructive" });
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
                  <span
                    className={cn(
                      "text-sm font-600 hidden sm:inline",
                      i === step ? "text-foreground" : "text-faint"
                    )}
                  >
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
                      industry === ind.name
                        ? "border-primary bg-tint"
                        : "border-border bg-white hover:border-primary/40"
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
              <p className="text-muted-foreground mt-2 mb-6">14-day free trial. No charge until day 14.</p>
              <div className="space-y-3">
                {PLANS.map((p) => {
                  const selected = plan === p.id;
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
                          {p.price ? `AED ${p.price}` : "Custom"}
                          {p.price && <span className="text-xs text-faint font-500">/mo</span>}
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

              {/* Green strip */}
              <div className="flex items-center justify-between gap-2 mt-5 p-3.5 rounded-[10px] bg-success-muted">
                <span className="text-sm font-600 text-success">Today's charge</span>
                <span className="text-sm font-700 text-success">AED 0.00</span>
                <span className="text-xs font-600 text-success bg-white/60 px-2 py-0.5 rounded-md">14 days free</span>
              </div>

              {/* Card fields */}
              <div className="mt-5">
                <Label className="font-600 mb-1.5 block">Card details</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-4 w-4 h-4 text-faint" />
                  <Input
                    placeholder="Card number"
                    value={card.number}
                    onChange={(e) => setCard({ ...card, number: e.target.value })}
                    className={`pl-10 mb-2 ${inputCls}`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="MM / YY" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} className={inputCls} />
                  <Input placeholder="CVC" value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value })} className={inputCls} />
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  On day 14 the one-time setup + first month are charged. Cancel anytime before.
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" className="h-12 flex-1 rounded-[10px] bg-white font-600" onClick={() => setStep(1)}>Back</Button>
                <Button className="h-12 flex-1 rounded-[10px] font-600" disabled={submitting} onClick={finish}>
                  {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Starting…</> : "Start free trial"}
                </Button>
              </div>
            </div>
          )}

          <p className="text-center text-xs text-faint mt-8">
            By continuing you agree to the Linkzone terms. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}