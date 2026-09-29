import React from "react";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function StatCard({ label, value, icon: Icon, delta, deltaUp = true, accent }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-faint font-500">{label}</p>
        {Icon && (
          <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", accent ? "bg-accent/10 text-accent" : "bg-tint text-primary")}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <p className="text-[2rem] font-extrabold font-display tracking-tight leading-none" style={{ letterSpacing: "-0.02em" }}>
        {value}
      </p>
      {delta && (
        <span
          className={cn(
            "inline-flex items-center gap-1 mt-3 text-xs font-700 px-2 py-0.5 rounded-full",
            deltaUp ? "bg-success-muted text-success" : "bg-warning-muted text-warning"
          )}
        >
          {deltaUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {delta}
        </span>
      )}
    </div>
  );
}