import React from "react";
import MapView from "@/components/map/MapView";
import { Button } from "@/components/ui/button";
import { Search, LocateFixed } from "lucide-react";
import { VIOLET, GREEN } from "@/lib/mapIcons";
import { waLink } from "@/lib/wa";

const RADII = [1, 2, 5, 10];

function LeadPopup({ lead, added, isCustomer, onAdd }) {
  const wa = waLink(lead.whatsapp_number || lead.phone);
  return (
    <div className="text-sm" style={{ minWidth: 180 }}>
      <p className="font-700 text-foreground">{lead.business_name}</p>
      <p className="text-xs text-faint mt-0.5">{lead.address || lead.area}</p>
      {lead.phone && <p className="text-xs text-faint mt-1">{lead.phone}</p>}
      <div className="flex gap-1.5 mt-2">
        <Button size="sm" className="h-7 text-xs px-2.5" disabled={added || isCustomer} onClick={() => onAdd(lead)}>
          {added || isCustomer ? "Added" : "Add as customer"}
        </Button>
        {wa && (
          <Button asChild size="sm" variant="outline" className="h-7 text-xs px-2.5 text-whatsapp border-whatsapp/40">
            <a href={wa} target="_blank" rel="noreferrer">WhatsApp</a>
          </Button>
        )}
      </div>
    </div>
  );
}

export default function LeadMap({ leads, added, mapCenter, radiusKm, onRadiusChange, onMoveEnd, onSearchArea, showSearchArea, highlightIndex, onMarkerClick, onAdd, flyTo, onUseLocation, bbox }) {
  const markers = leads.filter((l) => l.lat != null && l.lng != null).map((l) => ({
    id: l._idx,
    position: [l.lat, l.lng],
    color: l.isCustomer ? GREEN : VIOLET,
    popup: <LeadPopup lead={l} added={added.has(l._idx)} isCustomer={l.isCustomer} onAdd={() => onAdd(l)} />,
  }));
  return (
    <div className="relative h-full min-h-[300px]">
      <MapView
        center={mapCenter || [25.2048, 55.2708]}
        zoom={12}
        markers={markers}
        circle={mapCenter ? { center: mapCenter, radius: radiusKm } : null}
        bbox={bbox}
        onMoveEnd={onMoveEnd}
        highlightId={highlightIndex}
        onMarkerClick={onMarkerClick}
        flyTo={flyTo}
        className="absolute inset-0 h-full w-full"
      />
      <div className="absolute top-2.5 right-2.5 z-[1000] bg-card rounded-lg border border-border shadow-sm p-1 flex gap-0.5">
        {RADII.map((r) => (
          <button key={r} onClick={() => onRadiusChange(r)} className={`px-2 h-7 rounded-md text-xs font-600 ${radiusKm === r ? "bg-primary text-white" : "text-faint hover:bg-muted"}`}>{r}km</button>
        ))}
      </div>
      <button onClick={onUseLocation} className="absolute top-2.5 left-2.5 z-[1000] bg-card rounded-lg border border-border shadow-sm px-2.5 h-8 text-xs font-600 flex items-center gap-1.5 hover:bg-muted" title="Use my location">
        <LocateFixed className="w-3.5 h-3.5 text-primary" />My location
      </button>
      {showSearchArea && (
        <button onClick={onSearchArea} className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-primary text-white rounded-full px-4 h-9 text-sm font-600 shadow-lg flex items-center gap-1.5">
          <Search className="w-4 h-4" />Search this area
        </button>
      )}
    </div>
  );
}