import React from "react";
import { Link } from "react-router-dom";
import Logo from "@/components/Logo";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <Link to="/" aria-label="Linkzone home"><Logo size={32} /></Link>
          <nav className="flex items-center gap-6 text-sm" aria-label="Footer">
            <Link to="/login" className="text-faint hover:text-foreground font-500">Log in</Link>
            <Link to="/register" className="text-faint hover:text-foreground font-500">Start free trial</Link>
            <a href="mailto:hello@linkzone.ae" className="text-faint hover:text-foreground font-500">hello@linkzone.ae</a>
          </nav>
        </div>
        <div className="mt-6 pt-6 border-t border-border text-xs text-faint flex flex-col sm:flex-row justify-between gap-2">
          <span>© 2026 Linkzone Global FZ-LLC</span>
          <span>Find shops. Send offers on WhatsApp. Close orders.</span>
        </div>
      </div>
    </footer>
  );
}