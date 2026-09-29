import React, { useState, useEffect } from "react";
import { Star, MessageCircle, MapPin, ChevronDown, Plus, Check } from "lucide-react";
import { INDUSTRY_OPTIONS, maskPhone } from "./mapDemoData";

const CAT_LABEL = (c) => (c === "Grocery / Mini mart" ? "Grocery" : c);

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" && window.matchMedia(query).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = () => setMatches(mq.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, [query]);
  return matches;
}

function ShopCard({ s, added, onAdd, onActivate, onDeactivate, pulse }) {
  const isAdded = added.has(s.id);
  return (
    <div
      data-shop-id={s.id}
      onMouseEnter={() => onActivate(s)}
      onMouseLeave={onDeactivate}
      onFocus={() => onActivate(s)}
      onClick={() => onActivate(s)}
      className={`rounded-xl border bg-card p-3.5 transition-all cursor-pointer ${
        pulse ? "ring-2 ring-primary border-primary" : "border-border hover:border-primary/40 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{s.name}</p>
          <p className="text-xs text-faint mt-0.5 flex items-center gap-1">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{s.address}, {s.area}</span>
          </p>
        </div>
        {s.hasWhatsApp && (
          <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-whatsapp/10 text-whatsapp px-2 py-0.5 text-[10px] font-bold">
            <MessageCircle className="w-3 h-3" />WA
          </span>
        )}
      </div>

      <p className="text-xs text-faint mt-1.5">{s.contactName}</p>

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-xs">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="font-bold text-foreground">{s.rating.toFixed(1)}</span>
          <span className="text-faint">({s.reviews})</span>
        </div>
        <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${s.openNow ? "bg-success/15 text-success" : "bg-muted text-faint"}`}>
          {s.openNow ? "Open now" : "Closed"}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-xs text-faint">{maskPhone(s.phone)}</span>
        <span className="text-xs font-semibold text-foreground">AED {s.avgOrderAED.toLocaleString()}</span>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onAdd(s.id); }}
        className={`mt-2.5 w-full h-8 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors ${
          isAdded ? "bg-success/15 text-success" : "bg-primary text-primary-foreground hover:bg-primary/90"
        }`}
      >
        {isAdded ? <><Check className="w-3.5 h-3.5" />Added</> : <><Plus className="w-3.5 h-3.5" />Add to route</>}
      </button>
    </div>
  );
}

export default function ShopList({ shops, area, added, onAdd, onActivate, onDeactivate, pulseId, listRef }) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const grouped = INDUSTRY_OPTIONS
    .map((cat) => ({ cat, items: shops.filter((s) => s.industry === cat) }))
    .filter((g) => g.items.length > 0);
  const presentCats = grouped.map((g) => g.cat);
  const [openCats, setOpenCats] = useState(() => new Set(presentCats));

  // Reset open state when the filtered set / viewport changes.
  const filterKey = shops.map((s) => s.id).join(",") + "|" + isDesktop;
  useEffect(() => {
    if (isDesktop) setOpenCats(new Set(presentCats));
    else setOpenCats(new Set(presentCats.slice(0, 1)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  const toggle = (cat) =>
    setOpenCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });

  if (!shops.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
        <MapPin className="w-8 h-8 text-faint/50 mx-auto" />
        <p className="mt-2 text-sm font-semibold text-foreground">No shops match your filters</p>
        <p className="text-xs text-faint mt-1">Try a wider radius or a different industry.</p>
      </div>
    );
  }

  return (
    <div ref={listRef} className="space-y-3">
      <div className="flex items-center justify-between">
        <h3
          className="font-display font-extrabold text-lg text-foreground"
          style={{ letterSpacing: "-0.02em" }}
        >
          Shops in {area}
        </h3>
        <span className="text-xs font-semibold text-faint">{shops.length} shops</span>
      </div>

      {grouped.map((g) => {
        const open = openCats.has(g.cat);
        return (
          <div key={g.cat} className="rounded-2xl border border-border bg-background overflow-hidden">
            <button
              type="button"
              onClick={() => toggle(g.cat)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/40"
            >
              <span className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">{CAT_LABEL(g.cat)}</span>
                <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold px-1.5">
                  {g.items.length}
                </span>
              </span>
              <ChevronDown className={`w-4 h-4 text-faint transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 pt-1">
                {g.items.map((s) => (
                  <ShopCard
                    key={s.id}
                    s={s}
                    added={added}
                    onAdd={onAdd}
                    onActivate={onActivate}
                    onDeactivate={onDeactivate}
                    pulse={pulseId === s.id}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}