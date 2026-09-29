import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { pinIcon, clusterIcon, VIOLET } from "@/lib/mapIcons";

function FlyTo({ position, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, zoom, { duration: 0.7 });
  }, [position, zoom]); // eslint-disable-line
  return null;
}

function maskPhone(p) {
  const d = p.replace(/\D/g, "");
  return `+${d.slice(0, 3)} ${d.slice(3, 5)} ••• ${d.slice(-4)}`;
}

export default function MapDemoMap({ shops, center, zoom, radius, added, onAdd }) {
  return (
    <MapContainer center={center} zoom={zoom} className="h-full w-full" scrollWheelZoom={false}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      <MarkerClusterGroup
        iconCreateFunction={clusterIcon}
        chunkedLoading
        showCoverageOnHover={false}
        maxClusterRadius={45}
      >
        {shops.map((s) => (
          <Marker key={s.id} position={[s.lat, s.lng]} icon={pinIcon(VIOLET, added.has(s.id))}>
            <Popup>
              <div className="min-w-[180px]">
                <p className="text-sm font-bold text-foreground">{s.name}</p>
                <p className="text-xs text-faint mt-0.5">{s.address}, {s.area}</p>
                <p className="text-xs text-faint mt-1">{maskPhone(s.phone)}</p>
                <button
                  onClick={() => onAdd(s.id)}
                  className={`mt-2 w-full text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors ${added.has(s.id) ? "bg-success/15 text-success" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
                >
                  {added.has(s.id) ? "Added ✓" : "Add to route"}
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
      <Circle
        center={center}
        radius={radius * 1000}
        pathOptions={{ color: VIOLET, fillColor: VIOLET, fillOpacity: 0.06, weight: 1.5 }}
      />
      <FlyTo position={center} zoom={zoom} />
    </MapContainer>
  );
}