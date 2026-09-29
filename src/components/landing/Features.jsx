import React from "react";
import { Search, MessageCircle, Package, Route, BellRing, ShieldCheck, MapPin } from "lucide-react";

const FEATURES = [
  { icon: Search, title: "Lead Finder by area and industry", body: "Find new retailers in any area, filtered by the trade you serve." },
  { icon: MessageCircle, title: "Two-way WhatsApp inbox", body: "Every conversation in one place — reply, share offers, and stay in context." },
  { icon: Package, title: "Product catalogue and offers", body: "Build a catalogue and send product cards straight into the chat." },
  { icon: Route, title: "Routes and salesman assignment", body: "Assign every route to the right rep so the right shops get the right offers." },
  { icon: MapPin, title: "Interactive map of shops and customers", body: "See every shop and customer on a map, filter by area and industry, and assign routes visually." },
  { icon: BellRing, title: "Orders and reorder reminders", body: "Turn replies into tracked orders and remind shops when it's time to reorder." },
  { icon: ShieldCheck, title: "Separate secure workspace per company", body: "Every company gets its own isolated workspace — your data is yours alone." },
];

export default function Features() {
  return (
    <section id="features" className="py-16 lg:py-24 bg-tint/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-700 text-primary uppercase tracking-wider">Features</p>
          <h2 className="mt-2 font-display font-extrabold text-3xl sm:text-4xl tracking-tight text-foreground" style={{ letterSpacing: "-0.02em" }}>Everything you need to sell to shops</h2>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-6 hover:shadow-md transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-base text-foreground">{f.title}</h3>
              <p className="mt-1.5 text-sm text-faint leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}