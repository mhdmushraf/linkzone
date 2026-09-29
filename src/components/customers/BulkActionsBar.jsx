import React from "react";
import { Button } from "@/components/ui/button";
import { X, Send, Route as RouteIcon, UserCog, Tag } from "lucide-react";

export default function BulkActionsBar({ count, routes, team, onAssignRoute, onAssignSalesman, onStatus, onSendOffer, onClear }) {
  return (
    <div className="sticky top-2 z-30 flex flex-wrap items-center gap-2 bg-primary text-white rounded-xl px-4 py-2.5 shadow-lg">
      <span className="text-sm font-700 mr-1">{count} selected</span>
      <div className="flex items-center gap-1.5">
        <RouteIcon className="w-3.5 h-3.5 opacity-80" />
        <select onChange={(e) => { if (e.target.value) { onAssignRoute(e.target.value === "none" ? null : e.target.value); e.target.value = ""; } }} className="h-8 rounded-md bg-white/15 text-white border border-white/30 text-xs px-1.5 max-w-[120px]" defaultValue="">
          <option value="" className="text-foreground">Route…</option>
          <option value="none" className="text-foreground">Unassigned</option>
          {routes.map((r) => <option key={r.id} value={r.id} className="text-foreground">{r.data.name}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-1.5">
        <UserCog className="w-3.5 h-3.5 opacity-80" />
        <select onChange={(e) => { if (e.target.value) { onAssignSalesman(e.target.value === "none" ? null : e.target.value); e.target.value = ""; } }} className="h-8 rounded-md bg-white/15 text-white border border-white/30 text-xs px-1.5 max-w-[120px]" defaultValue="">
          <option value="" className="text-foreground">Salesman…</option>
          <option value="none" className="text-foreground">Unassigned</option>
          {team.map((t) => <option key={t.id} value={t.id} className="text-foreground">{t.data?.name || t.email}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-1.5">
        <Tag className="w-3.5 h-3.5 opacity-80" />
        <select onChange={(e) => { if (e.target.value) { onStatus(e.target.value); e.target.value = ""; } }} className="h-8 rounded-md bg-white/15 text-white border border-white/30 text-xs px-1.5" defaultValue="">
          <option value="" className="text-foreground">Status…</option>
          <option value="new" className="text-foreground">New</option>
          <option value="active" className="text-foreground">Active</option>
          <option value="to_reorder" className="text-foreground">To reorder</option>
          <option value="win_back" className="text-foreground">Win-back</option>
        </select>
      </div>
      <Button size="sm" className="bg-white text-primary hover:bg-white/90 h-8" onClick={onSendOffer}><Send className="w-3.5 h-3.5 mr-1" />WhatsApp offer</Button>
      <button onClick={onClear} className="ml-auto text-white/90 hover:text-white p-1" title="Clear selection"><X className="w-4 h-4" /></button>
    </div>
  );
}