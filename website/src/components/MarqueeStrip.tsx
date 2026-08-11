"use client";

import { BRAND } from "@/lib/content";

const ITEMS = [
  "Mercato",
  "Reels",
  "Fil",
  "Partenaires",
  "Arène",
  "Matchs",
  "Covoiturage",
  "Caméras & Vidéo",
  "Visibilité ProDay",
  "Stats en direct",
  "Famille",
  BRAND.tagline,
];

export function MarqueeStrip() {
  const row = ITEMS.map((t) => (
    <span
      key={t}
      className="mx-8 inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-widest text-white/30"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--proday-accent)] shadow-[0_0_8px_var(--proday-accent-glow)]" />
      {t}
    </span>
  ));

  return (
    <div className="overflow-hidden border-y border-[var(--proday-accent)]/10 bg-black py-5">
      <div className="flex w-max animate-marquee">{row}{row}</div>
    </div>
  );
}
