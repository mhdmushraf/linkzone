import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import Logo from "@/components/Logo";
import { useAuth } from "@/lib/AuthContext";

const LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export default function LandingNav() {
  const { isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const AuthButtons = ({ mobile }) => (
    isAuthenticated ? (
      <Button asChild className="h-10 rounded-xl px-5 font-600">
        <Link to="/dashboard" onClick={() => setOpen(false)}>Go to dashboard</Link>
      </Button>
    ) : (
      <>
        <Button asChild variant="ghost" className="h-10 px-4 font-600">
          <Link to="/login" onClick={() => setOpen(false)}>Log in</Link>
        </Button>
        <Button asChild className="h-10 rounded-xl px-5 font-600">
          <Link to="/register" onClick={() => setOpen(false)}>Start free trial</Link>
        </Button>
      </>
    )
  );

  return (
    <header className={`sticky top-0 z-50 bg-background/80 backdrop-blur-md transition-shadow ${scrolled ? "border-b border-border shadow-sm" : "border-b border-transparent"}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center" aria-label="Linkzone home">
          <Logo size={32} />
        </Link>
        <nav className="hidden md:flex items-center gap-7" aria-label="Sections">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-500 text-faint hover:text-foreground transition-colors">{l.label}</a>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-2.5">
          <AuthButtons />
        </div>
        <button className="md:hidden p-2 -mr-2 text-foreground" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu" aria-expanded={open}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-1">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block py-2.5 text-sm font-500 text-foreground">{l.label}</a>
          ))}
          <div className="pt-3 flex flex-col gap-2 border-t border-border mt-2">
            <AuthButtons mobile />
          </div>
        </div>
      )}
    </header>
  );
}