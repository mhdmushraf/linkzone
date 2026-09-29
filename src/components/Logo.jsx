import React from "react";
import { cn } from "@/lib/utils";

/**
 * Linkzone logo mark: rounded violet square with two linked nodes.
 * variant:
 *  - "default"  → violet square, white nodes, ink wordmark (on light backgrounds)
 *  - "light"    → white square, violet nodes, white wordmark (on violet/dark panels)
 */
export function LogoMark({ variant = "default", className = "", size = 36 }) {
  const isLight = variant === "light";
  const square = isLight ? "#FFFFFF" : "#6B4EF0";
  const node = isLight ? "#6B4EF0" : "#FFFFFF";
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <rect width="48" height="48" rx="13" fill={square} />
      <g stroke={node} strokeWidth="3.6" fill="none" strokeLinecap="round">
        <circle cx="18" cy="18" r="5.4" />
        <circle cx="30" cy="30" r="5.4" />
        <path d="M21.8 21.8 27 27" />
      </g>
    </svg>
  );
}

export default function Logo({ variant = "default", size = 36, showWordmark = true, className = "" }) {
  const isLight = variant === "light";
  return (
    <div className={cn("flex items-center gap-2.5 select-none", className)}>
      <LogoMark variant={variant} size={size} />
      {showWordmark && (
        <span
          className="font-display font-extrabold lowercase leading-none"
          style={{ fontSize: size * 0.52, letterSpacing: "-0.04em", color: isLight ? "#FFFFFF" : "hsl(var(--foreground))" }}
        >
          linkzone
        </span>
      )}
    </div>
  );
}