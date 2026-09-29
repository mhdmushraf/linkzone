import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import { PLANS, SETUP_FEE, MIN_TERM_MONTHS, aed, annualPrice } from "@/lib/plans";

const SEAT_BULLETS = ["3 team members", "10 team members", "50 team members"];

export default function Pricing() {
  return (
    <section id="pricing" className="py-16 lg:py-24 bg-tint/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-700 text-primary uppercase tracking-wider">Pricing</p>
          <h2 className="mt-2 font-display font-extrabold text-3xl sm:text-4xl tracking-tight text-foreground" style={{ letterSpacing: "-0.02em" }}>Simple plans that scale with you</h2>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-5 items-stretch">
          {PLANS.map((p) => {
            const isCustom = p.monthly === null;
            const monthly = isCustom ? null : p.monthly;
            const annual = isCustom ? null : annualPrice(p.monthly);
            const extras = p.features.filter((f) => !SEAT_BULLETS.includes(f)).slice(0, 3);
            return (
              <div key={p.id} className={`relative rounded-2xl border bg-card p-6 flex flex-col ${p.popular ? "border-primary shadow-lg ring-1 ring-primary/20" : "border-border"}`}>
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-700 px-3 py-1 rounded-full">Most popular</span>
                )}
                <h3 className="font-display font-extrabold text-xl text-foreground">{p.name}</h3>
                <p className="text-sm text-faint mt-1">{p.tagline}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display font-extrabold text-4xl tracking-tight text-foreground" style={{ letterSpacing: "-0.03em" }}>{aed(monthly)}</span>
                  {!isCustom && <span className="text-sm text-faint font-500">/mo</span>}
                </div>
                {!isCustom && <p className="mt-1 text-xs text-faint">or {aed(annual)}/yr — 2 months free</p>}
                <ul className="mt-5 space-y-2.5 flex-1">
                  <li className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span>{p.leadLimit === null ? "Unlimited lead pulls" : `${p.leadLimit} lead pulls/month`}</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span>{p.seats} seats</span>
                  </li>
                  {extras.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-6 h-11 rounded-xl font-600">
                  <Link to="/register">{isCustom ? "Contact us" : "Start free trial"} {!isCustom && <ArrowRight className="w-4 h-4" />}</Link>
                </Button>
              </div>
            );
          })}
        </div>
        <p className="mt-8 text-center text-sm text-faint max-w-2xl mx-auto">
          One-time setup fee {aed(SETUP_FEE)} (Starter and Growth), waived on annual plans. Annual = 2 months free. Monthly plans have a {MIN_TERM_MONTHS}-month minimum term.
        </p>
      </div>
    </section>
  );
}