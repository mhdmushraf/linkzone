import L from "leaflet";

const PIN_SVG =
  '<svg width="W" height="H" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg">' +
  '<path d="M13 0C5.8 0 0 5.8 0 13c0 9.1 13 21 13 21s13-11.9 13-21C26 5.8 20.2 0 13 0z" fill="COLOR" stroke="#fff" stroke-width="STROKE"/>' +
  '<circle cx="13" cy="13" r="4.5" fill="#fff"/></svg>';

export function pinIcon(color, highlighted) {
  const scale = highlighted ? 1.3 : 1;
  const w = 26 * scale;
  const h = 34 * scale;
  const stroke = highlighted ? 3 : 2;
  return L.divIcon({
    className: "lz-pin",
    html: PIN_SVG.replace(/W/g, w).replace(/H/g, h).replace("COLOR", color).replace("STROKE", stroke),
    iconSize: [w, h],
    iconAnchor: [w / 2, h],
    popupAnchor: [0, -h + 6],
  });
}

export function clusterIcon(cluster) {
  const count = cluster.getChildCount();
  return L.divIcon({
    className: "lz-cluster",
    html: `<div style="width:38px;height:38px;border-radius:50%;background:#6B4EF0;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-family:Figtree,system-ui,sans-serif;font-size:13px;box-shadow:0 2px 8px rgba(107,78,240,.4);border:2px solid #fff;">${count}</div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
}

export const STATUS_COLORS = {
  new: "#6B4EF0",
  active: "#22A95B",
  to_reorder: "#FF8A3D",
  win_back: "#E0588F",
};

export const VIOLET = "#6B4EF0";
export const GREEN = "#22A95B";