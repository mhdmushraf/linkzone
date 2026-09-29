import React from "react";
import { cn } from "@/lib/utils";

const STYLES = {
  active: "bg-emerald-100 text-emerald-700",
  to_reorder: "bg-amber-100 text-amber-700",
  new: "bg-violet-100 text-violet-700",
  win_back: "bg-blue-100 text-blue-700",
  paid: "bg-emerald-100 text-emerald-700",
  due: "bg-rose-100 text-rose-700",
  partial: "bg-amber-100 text-amber-700",
  pending: "bg-slate-100 text-slate-600",
  dispatched: "bg-blue-100 text-blue-700",
  delivered: "bg-emerald-100 text-emerald-700",
  trial: "bg-accent/10 text-accent",
  accepted: "bg-emerald-100 text-emerald-700",
  owner: "bg-primary/10 text-primary",
  manager: "bg-violet-100 text-violet-700",
  sales: "bg-blue-100 text-blue-700",
  viewer: "bg-slate-100 text-slate-600",
};

const LABELS = {
  to_reorder: "To reorder",
  win_back: "Win back",
  new: "New",
  active: "Active",
  paid: "Paid",
  due: "Due",
  partial: "Partial",
  pending: "Pending",
  dispatched: "Dispatched",
  delivered: "Delivered",
  trial: "Trial",
  accepted: "Accepted",
  owner: "Owner",
  manager: "Manager",
  sales: "Sales rep",
  viewer: "Viewer",
};

export default function StatusBadge({ status }) {
  const style = STYLES[status] || "bg-slate-100 text-slate-600";
  const label = LABELS[status] || status;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-600 capitalize", style)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}