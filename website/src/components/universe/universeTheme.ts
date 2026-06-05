import {
  HOMME_BRAND,
  PRO_BRAND,
  WOMAN_BRAND,
  type ProductLineWeb,
} from "@/lib/content";
import { ROUTES } from "@/lib/routes";

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
    navCta: string;
    navLink: string;
    pricingAccent: string;
    softSectionBg: string;
    verificationSectionBg: string;
    verificationTitle: string;
    pulseStroke: string;
    pulseSliderAccent: string;
    exploreCard: string;
    exploreBadge: string;
    demoTabActive: string;
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
    navCta: "bg-proday-ink hover:bg-neutral-800",
    navLink: "font-medium text-neutral-800 hover:text-proday-ink",
    pricingAccent: "bg-proday-ink",
    softSectionBg: "",
    verificationSectionBg: "",
    verificationTitle: "",
    pulseStroke: HOMME_BRAND.accent,
    pulseSliderAccent: "accent-neutral-900",
    exploreCard: "border-neutral-200 hover:border-neutral-300",
    exploreBadge: "bg-white/90 text-proday-ink",
    demoTabActive: "bg-white/15",
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
    navCta: "bg-pink-700 hover:bg-pink-800",
    navLink: "font-medium text-pink-700 hover:text-pink-800",
    pricingAccent: "bg-pink-700",
    softSectionBg: "bg-pink-50/50",
    verificationSectionBg: "",
    verificationTitle: "",
    pulseStroke: WOMAN_BRAND.accent,
    pulseSliderAccent: "accent-pink-700",
    exploreCard: "border-pink-200 ring-1 ring-pink-100 hover:border-pink-300",
    exploreBadge: "bg-pink-600 text-white",
    demoTabActive: "bg-pink-500/25",
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
    navCta: "bg-blue-700 hover:bg-blue-800",
    navLink: "font-medium text-blue-700 hover:text-blue-800",
    pricingAccent: "bg-blue-700",
    softSectionBg: "bg-blue-50/30",
    verificationSectionBg: "bg-blue-50/30",
    verificationTitle: "text-blue-950",
    pulseStroke: PRO_BRAND.accent,
    pulseSliderAccent: "accent-blue-700",
    exploreCard: "border-blue-200 ring-1 ring-blue-100 hover:border-blue-300",
    exploreBadge: "bg-blue-700 text-white",
    demoTabActive: "bg-blue-500/25",
  },
};

export function universeFromPath(pathname: string): ProductLineWeb | null {
  if (pathname.startsWith(ROUTES.woman)) return "woman";
  if (pathname.startsWith(ROUTES.pro)) return "pro";
  if (pathname.startsWith(ROUTES.homme)) return "homme";
  return null;
}

export function universeFromExploreHref(href: string): ProductLineWeb | null {
  if (href === ROUTES.woman) return "woman";
  if (href === ROUTES.pro) return "pro";
  if (href === ROUTES.homme) return "homme";
  return null;
}

export function navBrandForPath(pathname: string) {
  const line = universeFromPath(pathname);
  if (line === "woman") {
    return { name: WOMAN_BRAND.name, logo: WOMAN_BRAND.logo, theme: UNIVERSE_THEME.woman };
  }
  if (line === "pro") {
    return { name: PRO_BRAND.name, logo: PRO_BRAND.logo, theme: UNIVERSE_THEME.pro };
  }
  if (line === "homme") {
    return { name: HOMME_BRAND.name, logo: HOMME_BRAND.logo, theme: UNIVERSE_THEME.homme };
  }
  return {
    name: "ProDay",
    logo: "/branding/logo-light.png",
    theme: UNIVERSE_THEME.homme,
  };
}
