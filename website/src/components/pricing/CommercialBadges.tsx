"use client";

import { ShieldCheck, Gift } from "lucide-react";

type CommercialBadgesProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  align?: "left" | "center" | "right";
  showDescriptions?: boolean;
};

/**
 * Badges commerciaux ultra-visibles :
 * 1. "Sans engagement" (Vert émeraude vibrant #10B981 / #00E676)
 * 2. "Parrainage possible" (Or / Ambre brillant #F59E0B / #FBBF24)
 */
export function CommercialBadges({
  className = "",
  size = "md",
  align = "left",
  showDescriptions = false,
}: CommercialBadgesProps) {
  const alignClasses = {
    left: "justify-start",
    center: "justify-center text-center",
    right: "justify-end",
  }[align];

  const badgeSize = {
    sm: "px-3 py-1 text-xs gap-1.5",
    md: "px-4 py-1.5 text-xs sm:text-sm gap-2",
    lg: "px-5 py-2.5 text-sm sm:text-base gap-2.5",
  }[size];

  return (
    <div className={`flex flex-wrap items-center gap-3 ${alignClasses} ${className}`}>
      {/* Badge 1 : Sans engagement (Vert Émeraude Néon Ultra-Visible) */}
      <div className="group relative inline-flex items-center">
        <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 opacity-70 blur-sm transition group-hover:opacity-100" />
        <div
          className={`relative inline-flex items-center rounded-full border-2 border-emerald-400 bg-[#02241b] font-bold uppercase tracking-wider text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.45)] backdrop-blur-md transition hover:scale-105 hover:border-emerald-300 hover:text-white ${badgeSize}`}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <ShieldCheck size={size === "lg" ? 18 : size === "sm" ? 14 : 16} className="text-emerald-400" />
          <span>Sans engagement</span>
        </div>
      </div>

      {/* Badge 2 : Parrainage possible (Or / Ambre Flamboyant Ultra-Visible) */}
      <div className="group relative inline-flex items-center">
        <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-300 opacity-70 blur-sm transition group-hover:opacity-100" />
        <div
          className={`relative inline-flex items-center rounded-full border-2 border-amber-400 bg-[#2d1d03] font-bold uppercase tracking-wider text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.45)] backdrop-blur-md transition hover:scale-105 hover:border-amber-300 hover:text-white ${badgeSize}`}
        >
          <Gift size={size === "lg" ? 18 : size === "sm" ? 14 : 16} className="text-amber-400" />
          <span>Parrainage possible</span>
        </div>
      </div>

      {showDescriptions && (
        <p className="w-full text-xs text-white/70">
          Résiliation à tout moment en 1 clic · Code parrainage dispo dès l’inscription
        </p>
      )}
    </div>
  );
}
