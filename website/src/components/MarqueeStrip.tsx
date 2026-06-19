"use client";

import { BRAND } from "@/lib/content";

const ITEMS = [
  "Mercato",
  "Reels",
  "Fil",
  "Partenaires",
  "Arena",
  "Matchs",
  "Covoiturage",
  "Pôle santé",
  "Pulse ProDay",
  "Live Stats",
  "Famille",
  BRAND.tagline,
];

export function MarqueeStrip() {
  const row = ITEMS.map((t) => (
    <span
      key={t}
      className="mx-8 inline-flex items-center gap-3 text-sm font-medium tracking-widest text-white/35"
    >
      <span className="h-1 w-1 rounded-full bg-blue-500/60" />
      {t}
    </span>
  ));

  return (
    <div className="overflow-hidden border-y border-white/8 bg-[#050505] py-5">
      <div className="flex w-max animate-marquee">{row}{row}</div>
    </div>
  );
}
