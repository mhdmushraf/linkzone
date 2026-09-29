import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { pinIcon, VIOLET, GREEN } from "@/lib/mapIcons";
import { maskPhone } from "./mapDemoData";

function FlyTo({ position, flyKey, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, zoom, { duration: 0.6 });
  }, [flyKey]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function MapDemoMap({ shops, center, zoom, radius, added, onAdd, highlightId, flyTo, flyKey, onMarkerClick }) {
  return (
    <MapContainer center={center} zoom={zoom} className="h-full w-full" scrollWheelZoom={false}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      {shops.map((s) => {
        const isAdded = added.has(s.id);
        const isHover = highlightId === s.id;
        return (
          <Marker
            key={s.id}
            position={[s.lat, s.lng]}
            icon={pinIcon(isAdded ? GREEN : VIOLET, isHover)}
            eventHandlers={{ click: () => onMarkerClick && onMarkerClick(s.id) }}
          >
            <Popup>
              <div className="min-w-[180px]">
                <p className="text-sm font-bold text-foreground">{s.name}</p>
                <p className="text-xs text-faint mt-0.5">{s.address}, {s.area}</p>
                <p className="text-xs text-faint mt-1">{maskPhone(s.phone)}</p>
                <button
                  onClick={() => onAdd(s.id)}
                  className={`mt-2 w-full text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors ${isAdded ? "bg-success/15 text-success" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
                >
                  {isAdded ? "Added ✓" : "Add to route"}
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
      <Circle
        center={center}
        radius={radius * 1000}
        pathOptions={{ color: VIOLET, fillColor: VIOLET, fillOpacity: 0.06, weight: 1.5 }}
      />
      <FlyTo position={flyTo} flyKey={flyKey} zoom={zoom} />
    </MapContainer>
  );
}