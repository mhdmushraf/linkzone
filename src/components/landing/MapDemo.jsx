import React, { useMemo, useState, Suspense, lazy } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ArrowRight, Route as RouteIcon } from "lucide-react";
import { AREA_OPTIONS, INDUSTRY_OPTIONS, SAMPLE_SHOPS, areaCenter } from "./mapDemoData";

const MapDemoMap = lazy(() => import("./MapDemoMap"));

const INDUSTRY_LABEL = (ind) => (ind === "Grocery / Mini mart" ? "Grocery" : ind);

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function MapSkeleton() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-tint/40">
      <div className="flex flex-col items-center gap-3 text-faint">
        <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <span className="text-xs">Loading map…</span>
      </div>
    </div>
  );
}

export default function MapDemo() {
  const [area, setArea] = useState("Al Karama");
  const [industry, setIndustry] = useState("All");
  const [hasWhatsApp, setHasWhatsApp] = useState(false);
  const [radius, setRadius] = useState(3);
  const [added, setAdded] = useState(() => new Set());

  const center = useMemo(() => areaCenter(area), [area]);
  const zoom = radius <= 2 ? 14 : radius <= 4 ? 13 : 12;

  const shops = useMemo(() => {
    const [clat, clng] = center;
    return SAMPLE_SHOPS.filter((s) => {
      if (s.area !== area) return false;
      if (industry !== "All" && s.industry !== industry) return false;
      if (hasWhatsApp && !s.hasWhatsApp) return false;
      return haversine(clat, clng, s.lat, s.lng) <= radius;
    });
  }, [area, industry, hasWhatsApp, radius, center]);

  const toggleAdd = (id) =>
    setAdded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <section id="map-demo" className="py-16 lg:py-24 bg-tint/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-bold text-primary uppercase tracking-wider">Lead Finder</p>
          <h2
            className="mt-2 font-display font-extrabold text-3xl sm:text-4xl tracking-tight text-foreground"
            style={{ letterSpacing: "-0.02em" }}
          >
            See every shop in your area on one map
          </h2>
          <p className="mt-4 text-base text-faint leading-relaxed">
            Pick an area and an industry, see the shops around you, and add them to a route in one click.
          </p>
        </div>

        <div className="mt-10 grid lg:grid-cols-[320px_1fr] gap-6 items-start">
          {/* Filter card */}
          <div className="rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-6">
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-faint uppercase tracking-wide">Area</label>
                <Select value={area} onValueChange={setArea}>
                  <SelectTrigger className="mt-1.5 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AREA_OPTIONS.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-faint uppercase tracking-wide">Industry</label>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {["All", ...INDUSTRY_OPTIONS].map((ind) => (
                    <button
                      key={ind}
                      type="button"
                      onClick={() => setIndustry(ind)}
                      className={`text-xs font-semibold rounded-full px-3 py-1.5 border transition-colors ${
                        industry === ind
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-faint border-border hover:border-primary/40"
                      }`}
                    >
                      {INDUSTRY_LABEL(ind)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-faint uppercase tracking-wide">Has WhatsApp</label>
                <Switch checked={hasWhatsApp} onCheckedChange={setHasWhatsApp} />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-faint uppercase tracking-wide">Radius</label>
                  <span className="text-xs font-bold text-foreground">{radius} km</span>
                </div>
                <Slider
                  value={[radius]}
                  onValueChange={(v) => setRadius(v[0])}
                  min={1}
                  max={5}
                  step={1}
                  className="mt-3"
                />
              </div>
            </div>
          </div>

          {/* Map + summary */}
          <div>
            <div className="rounded-2xl border border-border bg-card overflow-hidden h-[360px] sm:h-[460px]">
              <Suspense fallback={<MapSkeleton />}>
                <MapDemoMap
                  shops={shops}
                  center={center}
                  zoom={zoom}
                  radius={radius}
                  added={added}
                  onAdd={toggleAdd}
                />
              </Suspense>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-sm">
                <span className="font-bold text-foreground">{shops.length}</span>
                <span className="text-faint">shops found in {area}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs font-semibold">
                  <RouteIcon className="w-3.5 h-3.5" /> Route 1 · Ahmed
                </span>
                <span className="text-faint">{added.size} added</span>
              </div>
            </div>

            <p className="mt-3 text-xs text-faint">
              Sample data for demo. Real results appear after you sign up.
            </p>

            <div className="mt-4">
              <Button asChild className="rounded-xl font-bold">
                <Link to="/register">
                  Try it with your own area <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}