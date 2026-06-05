import type { ProductLineWeb } from "@/lib/content";

export const UNIVERSE_THEME: Record<
  ProductLineWeb,
  {
    pageHeaderAccent: "default" | "woman" | "pro";
    moduleActive: string;
    moduleIdle: string;
    moduleRing: string;
    imageGradient: string;
    imageRing: string;
    moduleDesc: string;
    highlightBorder: string;
    highlightLabel: string;
    journeyActive: string;
    journeyIdle: string;
    pricingCard: string;
    ctaGradient: string;
    ctaText: string;
    ctaBtn: string;
    ctaBtnOutline: string;
    crossCard: string;
  }
> = {
  homme: {
    pageHeaderAccent: "default",
    moduleActive: "border-proday-ink bg-proday-ink text-white shadow-lg",
    moduleIdle: "border-neutral-200 bg-white hover:border-neutral-300",
    moduleRing: "",
    imageGradient: "from-black/70 via-black/20 to-transparent",
    imageRing: "",
    moduleDesc: "text-white/80",
    highlightBorder: "border-neutral-200 bg-white",
    highlightLabel: "text-proday-muted",
    journeyActive: "bg-proday-ink text-white shadow-md",
    journeyIdle:
      "bg-white text-proday-muted ring-1 ring-neutral-200 hover:ring-neutral-300",
    pricingCard: "border-neutral-200 bg-white hover:border-neutral-300",
    ctaGradient: "from-neutral-900 to-neutral-950",
    ctaText: "text-neutral-300",
    ctaBtn: "bg-white text-neutral-900 hover:bg-neutral-100",
    ctaBtnOutline: "border-white/30 text-white hover:bg-white/10",
    crossCard: "from-neutral-800 to-neutral-950",
  },
  woman: {
    pageHeaderAccent: "woman",
    moduleActive:
      "border-pink-600 bg-pink-700 text-white shadow-lg shadow-pink-900/20",
    moduleIdle: "border-pink-200 bg-white hover:border-pink-300",
    moduleRing: "ring-2 ring-pink-200",
    imageGradient: "from-pink-950/80 via-pink-900/20 to-transparent",
    imageRing: "ring-2 ring-pink-200",
    moduleDesc: "text-pink-100",
    highlightBorder: "border-pink-200 bg-pink-50/50",
    highlightLabel: "text-pink-800/70",
    journeyActive: "bg-pink-700 text-white shadow-md shadow-pink-900/20",
    journeyIdle:
      "bg-white text-proday-muted ring-1 ring-pink-200 hover:ring-pink-300",
    pricingCard: "border-pink-200 bg-white hover:border-pink-300",
    ctaGradient: "from-pink-800 to-rose-950",
    ctaText: "text-pink-100",
    ctaBtn: "bg-white text-pink-900 hover:bg-pink-50",
    ctaBtnOutline: "border-white/30 text-white hover:bg-white/10",
    crossCard: "from-pink-800 to-rose-950",
  },
  pro: {
    pageHeaderAccent: "pro",
    moduleActive:
      "border-blue-600 bg-blue-700 text-white shadow-lg shadow-blue-900/20",
    moduleIdle: "border-blue-200 bg-white hover:border-blue-300",
    moduleRing: "ring-2 ring-blue-200",
    imageGradient: "from-blue-950/80 via-blue-900/20 to-transparent",
    imageRing: "ring-2 ring-blue-200",
    moduleDesc: "text-blue-100",
    highlightBorder: "border-blue-200 bg-blue-50/40",
    highlightLabel: "text-blue-900/70",
    journeyActive: "bg-blue-700 text-white shadow-md shadow-blue-900/20",
    journeyIdle:
      "bg-white text-proday-muted ring-1 ring-blue-200 hover:ring-blue-300",
    pricingCard: "border-blue-200 bg-white hover:border-blue-300",
    ctaGradient: "from-blue-900 to-slate-950",
    ctaText: "text-blue-100",
    ctaBtn: "bg-white text-blue-900 hover:bg-blue-50",
    ctaBtnOutline: "border-white/30 text-white hover:bg-white/10",
    crossCard: "from-blue-900 to-slate-950",
  },
};
