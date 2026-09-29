import React from "react";
import { Building2, Search, MessageCircle, ShoppingCart } from "lucide-react";

const STEPS = [
  { icon: Building2, title: "Choose your industry and area", body: "Pick your trade — FMCG, spare parts, pharmacy and more — and the areas you cover." },
  { icon: Search, title: "Find and save shops", body: "Pull licensed retailer leads by area and industry, and save the ones you want to target." },
  { icon: MessageCircle, title: "Send products and offers on WhatsApp", body: "Share product cards and offers straight into a two-way WhatsApp inbox." },
  { icon: ShoppingCart, title: "Assign routes and close orders", body: "Assign every route to the right salesman and turn replies into tracked orders." },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 lg:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-700 text-primary uppercase tracking-wider">How it works</p>
          <h2 className="mt-2 font-display font-extrabold text-3xl sm:text-4xl tracking-tight text-foreground" style={{ letterSpacing: "-0.02em" }}>From area to order in four steps</h2>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((s, i) => (
            <div key={i} className="relative rounded-2xl border border-border bg-card p-6">
              <span className="absolute -top-3 left-6 w-7 h-7 rounded-full bg-primary text-white text-xs font-700 flex items-center justify-center font-display">{i + 1}</span>
              <div className="w-11 h-11 rounded-xl bg-tint text-primary flex items-center justify-center mb-4">
                <s.icon className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-base text-foreground">{s.title}</h3>
              <p className="mt-1.5 text-sm text-faint leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}