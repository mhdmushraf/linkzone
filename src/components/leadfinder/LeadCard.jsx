import React from "react";
import { MapPin, Phone, Plus, Check, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { waLink } from "@/lib/wa";

export default function LeadCard({ lead, added, isCustomer, selected, highlighted, onToggleSelect, onAdd, onHover, onLeave, registerRef }) {
  const wa = waLink(lead.whatsapp_number || lead.phone);
  return (
    <div
      ref={(el) => registerRef && registerRef(lead._idx, el)}
      onMouseEnter={() => onHover && onHover(lead._idx)}
      onMouseLeave={() => onLeave && onLeave()}
      className={`bg-card rounded-xl border p-3 flex gap-3 transition-all ${highlighted ? "border-primary ring-2 ring-primary/30 shadow-md" : selected ? "border-primary ring-1 ring-primary/20" : "border-border"}`}
    >
      <input type="checkbox" checked={!!selected} onChange={() => onToggleSelect(lead._idx)} className="mt-1 w-4 h-4 accent-[#6B4EF0] shrink-0" aria-label={`Select ${lead.business_name}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="font-600 text-sm truncate">{lead.business_name}</p>
          {lead.lat != null ? <MapPin className="w-3.5 h-3.5 text-primary shrink-0" /> : <span className="text-[10px] text-faint shrink-0">list only</span>}
        </div>
        <p className="text-xs text-faint truncate mt-0.5">{lead.area || lead.address}</p>
        {(lead.phone || lead.whatsapp_number) && (
          <p className="text-xs text-faint flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{lead.phone || lead.whatsapp_number}</p>
        )}
        {isCustomer && <span className="inline-block mt-1 text-[10px] font-600 text-success bg-success-muted px-1.5 py-0.5 rounded">Already a customer</span>}
      </div>
      <div className="flex flex-col gap-1.5 shrink-0">
        {wa && (
          <a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-border hover:bg-muted" title="Message on WhatsApp">
            <MessageCircle className="w-4 h-4 text-whatsapp" />
          </a>
        )}
        <Button size="sm" variant={added || isCustomer ? "outline" : "default"} className="h-8 w-8 p-0" disabled={added || isCustomer} onClick={() => onAdd(lead)}>
          {added || isCustomer ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        </Button>
      </div>
    </div>
  );
}