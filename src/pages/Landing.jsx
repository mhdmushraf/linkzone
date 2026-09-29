import React from "react";
import LandingNav from "@/components/landing/LandingNav";
import Hero from "@/components/landing/Hero";
import MapDemo from "@/components/landing/MapDemo";
import HowItWorks from "@/components/landing/HowItWorks";
import Features from "@/components/landing/Features";
import WorksFor from "@/components/landing/WorksFor";
import Pricing from "@/components/landing/Pricing";
import FAQ from "@/components/landing/FAQ";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <main>
        <ErrorBoundary><Hero /></ErrorBoundary>
        <ErrorBoundary><MapDemo /></ErrorBoundary>
        <ErrorBoundary><HowItWorks /></ErrorBoundary>
        <ErrorBoundary><Features /></ErrorBoundary>
        <ErrorBoundary><WorksFor /></ErrorBoundary>
        <ErrorBoundary><Pricing /></ErrorBoundary>
        <ErrorBoundary><FAQ /></ErrorBoundary>
        <ErrorBoundary><FinalCTA /></ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}