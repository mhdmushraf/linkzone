import React from "react";
import { Check } from "lucide-react";
import Logo from "@/components/Logo";

const BULLETS = [
  "Find shops by area & industry with phone numbers",
  "Send products on WhatsApp and reply in one inbox",
  "Close deals into orders tracked by route & salesman",
];

export function AuthSidePanel() {
  return (
    <div className="hidden lg:flex w-[42%] bg-primary relative flex-col justify-between p-12 overflow-hidden">
      <div className="absolute -right-16 -bottom-16 w-72 h-72 rounded-full bg-white/5" />
      <div className="absolute right-20 -top-10 w-40 h-40 rounded-full bg-white/5" />
      <div className="relative"><Logo variant="light" size={40} /></div>
      <div className="relative">
        <h1
          className="font-display font-extrabold text-white text-[2.75rem] leading-[1.04] tracking-tight"
          style={{ letterSpacing: "-0.02em" }}
        >
          Turn every area<br />into orders.
        </h1>
        <ul className="mt-9 space-y-4">
          {BULLETS.map((b) => (
            <li key={b} className="flex items-start gap-3">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-white" strokeWidth={3.5} />
              </span>
              <span className="text-white/90 text-[15px] leading-snug font-500">{b}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="relative text-white/50 text-xs font-500">© Linkzone — WhatsApp sales for distributors</p>
    </div>
  );
}

export default function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex bg-background">
      <AuthSidePanel />
      <div className="flex-1 flex items-center justify-center px-6 py-10 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Logo size={36} />
          </div>
          {title && (
            <h1
              className="font-display font-extrabold text-[2rem] leading-tight tracking-tight text-foreground"
              style={{ letterSpacing: "-0.02em" }}
            >
              {title}
            </h1>
          )}
          {subtitle && <p className="text-muted-foreground mt-2 text-[15px]">{subtitle}</p>}
          <div className="mt-7">{children}</div>
          {footer && <p className="text-sm text-muted-foreground mt-7">{footer}</p>}
        </div>
      </div>
    </div>
  );
}