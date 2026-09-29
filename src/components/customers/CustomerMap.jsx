import React from "react";
import { Link } from "react-router-dom";
import MapView from "@/components/map/MapView";
import { Button } from "@/components/ui/button";
import { STATUS_COLORS } from "@/lib/mapIcons";
import { waLink } from "@/lib/wa";
import { MessageCircle, Plus, MapPin, PenLine, Loader2 } from "lucide-react";

function centroid(customers) {
  const pts = customers.filter((c) => c.data.lat != null && c.data.lng != null);
  if (!pts.length) return [25.2048, 55.2708];
  const lat = pts.reduce((s, c) => s + c.data.lat, 0) / pts.length;
  const lng = pts.reduce((s, c) => s + c.data.lng, 0) / pts.length;
  return [lat, lng];
}

function CustomerPopup({ c, routeLabel, repLabel, team, onAssign }) {
  const wa = waLink(c.data.whatsapp_number || c.data.phone);
  return (
    <div className="text-sm" style={{ minWidth: 200 }}>
      <p className="font-700 text-foreground">{c.data.business_name}</p>
      <p className="text-xs text-faint mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{c.data.area || c.data.address || "—"}</p>
      <div className="mt-1.5 space-y-0.5 text-xs text-faint">
        {c.data.phone && <p>{c.data.phone}</p>}
        <p>Route: <span className="text-foreground font-500">{routeLabel}</span></p>
        <p>Salesman: <span className="text-foreground font-500">{repLabel}</span></p>
        <p>Last order: <span className="text-foreground font-500">{c.data.last_order_date ? new Date(c.data.last_order_date).toLocaleDateString() : "Never"}</span></p>
      </div>
      <div className="mt-2 space-y-1.5">
        <div className="flex gap-1.5">
          <Button asChild size="sm" variant="outline" className="flex-1 h-7 text-xs text-whatsapp border-whatsapp/40"><Link to="/inbox"><MessageCircle className="w-3.5 h-3.5 mr-1" />Inbox</Link></Button>
          <Button asChild size="sm" variant="outline" className="flex-1 h-7 text-xs"><Link to="/orders"><Plus className="w-3.5 h-3.5 mr-1" />Order</Link></Button>
        </div>
        <select
          value={c.data.assigned_to || ""}
          onChange={(e) => onAssign(c, e.target.value)}
          className="w-full h-7 rounded-md border border-border bg-card text-xs px-1"
        >
          <option value="">Unassigned</option>
          {team.map((t) => <option key={t.id} value={t.id}>{t.data?.name || t.email}</option>)}
        </select>
      </div>
    </div>
  );
}

export default function CustomerMap({ customers, routes, team, highlightId, onMarkerClick, drawActive, onToggleDraw, onDrawSelect, onDrawDone, loading, repName, routeName }) {
  const markers = customers.filter((c) => c.data.lat != null && c.data.lng != null).map((c) => ({
    id: c.id,
    position: [c.data.lat, c.data.lng],
    color: STATUS_COLORS[c.data.status] || "#6B4EF0",
    popup: <CustomerPopup c={c} routeLabel={routeName(c.data.route_id)} repLabel={repName(c.data.assigned_to)} team={team} onAssign={onAssign} />,
  }));
  return (
    <div className="relative h-full min-h-[400px]">
      {loading && <div className="absolute inset-0 z-[1100] bg-background/40 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}
      <MapView
        center={centroid(customers)}
        zoom={12}
        markers={markers}
        highlightId={highlightId}
        onMarkerClick={onMarkerClick}
        drawActive={drawActive}
        onDrawSelect={onDrawSelect}
        onDrawDone={onDrawDone}
        className="absolute inset-0 h-full w-full"
      />
      <button
        onClick={onToggleDraw}
        className={`absolute top-2.5 left-2.5 z-[1000] rounded-lg px-3 h-8 text-xs font-600 flex items-center gap-1.5 shadow-sm border ${drawActive ? "bg-primary text-white border-primary" : "bg-card border-border hover:bg-muted"}`}
        title="Draw a rectangle on the map to select customers"
      >
        <PenLine className="w-3.5 h-3.5" />{drawActive ? "Drawing… drag on map" : "Draw area"}
      </button>
      <div className="absolute bottom-2.5 left-2.5 z-[1000] bg-card rounded-lg border border-border shadow-sm p-2 flex flex-col gap-1">
        {Object.entries(STATUS_COLORS).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5 text-[10px] font-600 capitalize"><span className="w-2.5 h-2.5 rounded-full" style={{ background: v }} />{k.replace("_", " ")}</div>
        ))}
      </div>
    </div>
  );
}