import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";

export default function FinalCTA() {
  return (
    <section className="py-16 lg:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-14 lg:px-16 lg:py-20 text-center">
          <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-white/10 blur-2xl" aria-hidden />
          <div className="absolute -bottom-20 -right-10 w-72 h-72 rounded-full bg-accent/20 blur-3xl" aria-hidden />
          <div className="relative">
            <Logo variant="light" size={40} className="justify-center mb-5" />
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight" style={{ letterSpacing: "-0.02em" }}>Start finding shops today</h2>
            <p className="mt-3 text-white/80 max-w-xl mx-auto">14 days free. Card required, nothing charged until day 14. Cancel any time before.</p>
            <Button asChild className="mt-7 h-12 rounded-xl px-7 text-base font-700 bg-white text-primary hover:bg-white/90">
              <Link to="/register">Start free trial <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}