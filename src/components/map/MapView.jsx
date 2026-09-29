import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, Rectangle, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { pinIcon, VIOLET } from "@/lib/mapIcons";

function MoveHandler({ onMoveEnd }) {
  const map = useMapEvents({ moveend: () => onMoveEnd && onMoveEnd(map.getCenter(), map.getZoom()) });
  return null;
}

function FlyTo({ position, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, zoom ?? map.getZoom(), { duration: 0.6 });
  }, [position, zoom]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function FitBounds({ bbox }) {
  const map = useMap();
  useEffect(() => {
    if (bbox) {
      const b = L.latLngBounds([[bbox.south, bbox.west], [bbox.north, bbox.east]]);
      map.fitBounds(b, { padding: [40, 40], maxZoom: 16 });
    }
  }, [bbox]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

// Rectangle draw selection for the map (used by Customers bulk select)
export function AreaSelect({ active, onSelect, onDone }) {
  const map = useMap();
  const [start, setStart] = React.useState(null);
  const [rect, setRect] = React.useState(null);
  useEffect(() => {
    if (active) map.dragging.disable(); else map.dragging.enable();
  }, [active, map]);
  useMapEvents({
    mousedown(e) { if (!active) return; setStart(e.latlng); setRect([e.latlng, e.latlng]); },
    mousemove(e) { if (!active || !start) return; setRect([start, e.latlng]); },
    mouseup(e) {
      if (!active || !start) return;
      const b = L.latLngBounds(start, e.latlng);
      setStart(null); setRect(null);
      onSelect(b);
      if (onDone) onDone();
    },
  });
  return rect ? <Rectangle bounds={rect} pathOptions={{ color: VIOLET, weight: 1.5, dashArray: "5 4", fillOpacity: 0.05 }} /> : null;
}

export default function MapView({ center, zoom = 13, markers = [], circle, bbox, onMoveEnd, highlightId, onMarkerClick, flyTo, drawActive, onDrawSelect, onDrawDone, className, style }) {
  return (
    <MapContainer center={center} zoom={zoom} className={className} style={style} scrollWheelZoom>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      {markers.map((m) => (
        <Marker
          key={m.id}
          position={m.position}
          icon={pinIcon(m.color, m.id === highlightId)}
          eventHandlers={{ click: () => onMarkerClick && onMarkerClick(m.id) }}
        >
          {m.popup && <Popup>{m.popup}</Popup>}
        </Marker>
      ))}
      {circle && (
        <Circle center={circle.center} radius={(circle.radius || 5) * 1000} pathOptions={{ color: VIOLET, fillColor: VIOLET, fillOpacity: 0.06, weight: 1.5 }} />
      )}
      <AreaSelect active={drawActive} onSelect={onDrawSelect} onDone={onDrawDone} />
      <MoveHandler onMoveEnd={onMoveEnd} />
      <FlyTo position={flyTo} zoom={zoom} />
      <FitBounds bbox={bbox} />
    </MapContainer>
  );
}