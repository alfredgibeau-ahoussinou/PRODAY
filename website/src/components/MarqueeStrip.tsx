"use client";

import { BRAND } from "@/lib/content";

const ITEMS = [
  "Mercato",
  "Recruteurs",
  "Matchs amicaux",
  "Covoiturage",
  "Pôle santé",
  "ProDay Shop",
  "Arena",
  "Pulse ProDay",
  "Live Stats",
  "CV PDF",
  BRAND.tagline,
];

export function MarqueeStrip() {
  const row = ITEMS.map((t) => (
    <span
      key={t}
      className="mx-6 inline-flex items-center gap-3 text-sm font-medium tracking-wide text-neutral-400"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
      {t}
    </span>
  ));

  return (
    <div className="overflow-hidden border-y border-neutral-200 bg-white py-4">
      <div className="flex w-max animate-marquee">
        {row}
        {row}
      </div>
    </div>
  );
}
