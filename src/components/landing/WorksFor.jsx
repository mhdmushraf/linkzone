import React from "react";
import { Store, Wrench, Pill, Monitor, FileText, Box } from "lucide-react";

const INDUSTRIES = [
  { icon: Store, label: "FMCG distribution" },
  { icon: Wrench, label: "Spare parts" },
  { icon: Pill, label: "Pharmacy trading" },
  { icon: Monitor, label: "IT & office supplies" },
  { icon: FileText, label: "Stationery" },
  { icon: Box, label: "Packaging" },
];

export default function WorksFor() {
  return (
    <section className="py-16 lg:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight text-foreground" style={{ letterSpacing: "-0.02em" }}>Works for every trade</h2>
          <p className="mt-2 text-faint">Built for the distributors and wholesalers who sell to shops.</p>
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {INDUSTRIES.map((i) => (
            <div key={i.label} className="inline-flex items-center gap-2.5 rounded-full border border-border bg-card px-5 py-3">
              <i.icon className="w-5 h-5 text-primary" />
              <span className="text-sm font-600 text-foreground">{i.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}