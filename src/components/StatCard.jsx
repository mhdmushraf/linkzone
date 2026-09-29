import React from "react";
import { cn } from "@/lib/utils";

export default function StatCard({ label, value, icon: Icon, trend, accent }) {
  return (
    <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-500">{label}</p>
          <p className="text-3xl font-700 font-heading mt-1 tracking-tight">{value}</p>
          {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
        </div>
        {Icon && (
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", accent ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary")}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}