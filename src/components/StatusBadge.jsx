import React from "react";
import { cn } from "@/lib/utils";

const STYLES = {
  active: "bg-success-muted text-success",
  to_reorder: "bg-warning-muted text-warning",
  new: "bg-tint text-primary",
  win_back: "bg-accent/10 text-accent",
  paid: "bg-success-muted text-success",
  due: "bg-destructive/10 text-destructive",
  partial: "bg-warning-muted text-warning",
  pending: "bg-muted text-faint",
  dispatched: "bg-accent/10 text-accent",
  delivered: "bg-success-muted text-success",
  trial: "bg-accent/10 text-accent",
  accepted: "bg-success-muted text-success",
  owner: "bg-primary text-white",
  manager: "bg-tint text-primary",
  sales: "bg-accent/10 text-accent",
  viewer: "bg-muted text-faint",
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
  const style = STYLES[status] || "bg-muted text-faint";
  const label = LABELS[status] || status;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-600", style)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}