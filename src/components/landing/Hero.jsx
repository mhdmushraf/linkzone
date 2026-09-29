import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";

function ProductMock() {
  return (
    <div className="relative mx-auto w-full max-w-[340px]">
      <div className="rounded-[28px] border border-border bg-card shadow-xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 bg-whatsapp text-white">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-700">AS</div>
          <div className="min-w-0">
            <p className="text-sm font-600 truncate">Al Safa Mini Mart</p>
            <p className="text-[11px] text-white/80">online</p>
          </div>
        </div>
        <div className="p-4 space-y-3 bg-tint min-h-[260px]">
          <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-card border border-border px-3 py-2 text-sm text-foreground">
            Hi! Do you have Nestlé Milk 1L in stock?
          </div>
          <div className="ml-auto max-w-[88%] rounded-2xl rounded-tr-sm bg-whatsapp/10 border border-whatsapp/20 px-3 py-2 text-sm text-foreground">
            Yes! Here's our offer:
            <div className="mt-2 rounded-xl bg-card border border-border p-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-tint flex items-center justify-center text-2xl" aria-hidden>🥛</div>
                <div className="min-w-0">
                  <p className="text-sm font-700 truncate">Nestlé Milk 1L</p>
                  <p className="text-xs text-faint">Pack of 12</p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm font-display font-extrabold text-primary">AED 240</span>
                <span className="text-[11px] text-success font-600">In stock</span>
              </div>
            </div>
          </div>
          <div className="ml-auto w-fit">
            <Button size="sm" className="h-9 rounded-xl font-700">
              Close deal <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-grid">
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/10 blur-3xl" aria-hidden />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-600 bg-tint text-primary px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" /> For distributors & wholesalers
          </span>
          <h1 className="mt-5 font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-foreground" style={{ letterSpacing: "-0.03em" }}>
            Find shops. Send offers on WhatsApp. Close orders.
          </h1>
          <p className="mt-5 text-base sm:text-lg text-faint leading-relaxed max-w-xl">
            Linkzone helps distributors and wholesalers find retailers in any area, message them on WhatsApp, and turn replies into orders, with every route assigned to the right salesman.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <Button asChild className="h-12 rounded-xl px-6 text-base font-700">
              <Link to="/register">Start 14-day free trial <ArrowRight className="w-4 h-4" /></Link>
            </Button>
            <Button asChild variant="outline" className="h-12 rounded-xl px-6 text-base font-600 bg-card">
              <a href="#how-it-works">See how it works</a>
            </Button>
          </div>
          <p className="mt-4 text-sm text-faint flex items-start gap-2">
            <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
            <span>14 days free. Card required, nothing charged until day 14. Cancel any time before.</span>
          </p>
        </div>
        <div className="relative" aria-hidden>
          <ProductMock />
        </div>
      </div>
    </section>
  );
}