import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowRight, Check, Store, Sparkles, Building2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const INDUSTRIES = [
  "FMCG distribution",
  "Spare parts",
  "Pharmacy trading",
  "IT & office supplies",
  "Stationery",
  "Packaging",
  "Other",
];

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 29,
    seats: 3,
    tagline: "For solo reps and small teams getting started",
    features: ["Up to 3 team members", "200 customers", "WhatsApp inbox", "Basic dashboard"],
  },
  {
    id: "growth",
    name: "Growth",
    price: 79,
    seats: 10,
    tagline: "For growing distribution teams",
    features: ["Up to 10 team members", "Unlimited customers", "Lead Finder", "Orders & reorder reminders", "Per-route analytics"],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 199,
    seats: 50,
    tagline: "For large wholesale operations",
    features: ["Up to 50 team members", "Unlimited everything", "Advanced analytics", "Priority support", "Custom branding"],
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(localStorage.getItem("lz_name") || "");
  const [company, setCompany] = useState(localStorage.getItem("lz_company") || "");
  const [industry, setIndustry] = useState("");
  const [plan, setPlan] = useState("growth");
  const [submitting, setSubmitting] = useState(false);

  const finish = async () => {
    setSubmitting(true);
    try {
      const me = await base44.auth.me();
      // Create the organization
      const org = await base44.entities.Organization.create({
        name: company,
        industry,
        brand_color: "#6B4EF0",
        whatsapp_connected: false,
        members: [me.id],
      });
      // Create subscription with 14-day trial
      const now = new Date();
      const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      const selected = PLANS.find((p) => p.id === plan);
      await base44.entities.Subscription.create({
        organization_id: org.id,
        plan,
        status: "trial",
        trial_start: now.toISOString(),
        trial_end: trialEnd.toISOString(),
        amount: selected.price,
        seats: selected.seats,
      });
      // Update the current user
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
    <div className="min-h-screen bg-grid bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-heading font-700 text-xl tracking-tight">Linkzone</span>
        </div>

        <Card className="p-8 shadow-sm border-border/60">
          {/* Step 0: company details */}
          {step === 0 && (
            <div>
              <h1 className="text-2xl font-700 mb-1">Set up your company</h1>
              <p className="text-muted-foreground mb-6">Tell us about you and your business.</p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Your full name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Distribution Ltd" className="h-11 pl-10" />
                  </div>
                </div>
              </div>
              <Button className="w-full h-11 mt-6" disabled={!name || !company || submitting} onClick={() => setStep(1)}>
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 1: industry */}
          {step === 1 && (
            <div>
              <h1 className="text-2xl font-700 mb-1">What do you distribute?</h1>
              <p className="text-muted-foreground mb-6">Pick your industry. You can change this later.</p>
              <div className="grid grid-cols-2 gap-3">
                {INDUSTRIES.map((ind) => (
                  <button
                    key={ind}
                    onClick={() => setIndustry(ind)}
                    className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                      industry === ind
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:border-primary/40 hover:bg-muted/50"
                    }`}
                  >
                    <Store className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-sm font-500">{ind}</span>
                    {industry === ind && <Check className="w-4 h-4 text-primary ml-auto" />}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" className="h-11 flex-1" onClick={() => setStep(0)}>Back</Button>
                <Button className="h-11 flex-1" disabled={!industry || submitting} onClick={() => setStep(2)}>
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: plan */}
          {step === 2 && (
            <div>
              <h1 className="text-2xl font-700 mb-1">Choose your plan</h1>
              <p className="text-muted-foreground mb-6">14-day free trial. No charge until day 14.</p>
              <div className="space-y-3">
                {PLANS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlan(p.id)}
                    className={`w-full p-4 rounded-xl border text-left transition-all ${
                      plan === p.id
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-600">{p.name}</span>
                        {p.popular && (
                          <span className="text-[10px] font-600 uppercase tracking-wide bg-accent text-white px-1.5 py-0.5 rounded">Popular</span>
                        )}
                      </div>
                      <span className="font-heading font-700">${p.price}<span className="text-xs text-muted-foreground font-400">/mo</span></span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{p.tagline}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {p.features.map((f) => (
                        <span key={f} className="text-xs text-muted-foreground flex items-center gap-1">
                          <Check className="w-3 h-3 text-primary" /> {f}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" className="h-11 flex-1" onClick={() => setStep(1)}>Back</Button>
                <Button className="h-11 flex-1" disabled={submitting} onClick={finish}>
                  {submitting ? "Starting trial…" : "Start free trial"}
                </Button>
              </div>
            </div>
          )}
        </Card>
        <p className="text-center text-xs text-muted-foreground mt-4">By continuing you agree to the Linkzone terms. Cancel anytime.</p>
      </div>
    </div>
  );
}