import {
  HOMME_BRAND,
  PRO_BRAND,
  SANTE_BRAND,
  WOMAN_BRAND,
  type ProductLineWeb,
} from "@/lib/content";
import { ROUTES } from "@/lib/routes";

export const UNIVERSE_THEME: Record<
  ProductLineWeb,
  {
    pageHeaderAccent: "default" | "woman" | "pro" | "sante";
    screenBg: string;
    screenSurface: string;
    screenMuted: string;
    accentBar: string;
    chip: string;
    chipHighlight: string;
    moduleCard: string;
    actionTile: string;
    actionTileActive: string;
    tabBar: string;
    tabInactive: string;
    tabActive: string;
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
    screenBg: "bg-[#F6F8F6]",
    screenSurface: "bg-white",
    screenMuted: "bg-[#F4FAF6]",
    accentBar: "bg-gradient-to-r from-neutral-900 to-emerald-800",
    chip: "bg-white border border-emerald-800/30 text-neutral-700",
    chipHighlight: "bg-neutral-900 text-white border-neutral-900",
    moduleCard: "bg-white border-l-[3px] border-l-emerald-700 border border-emerald-100",
    actionTile: "bg-white border border-emerald-800/40 text-neutral-800",
    actionTileActive: "bg-neutral-900 text-white border-neutral-900",
    tabBar: "bg-white border-t border-neutral-200",
    tabInactive: "text-neutral-400",
    tabActive: "text-neutral-900",
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
    screenBg: "bg-[#FFF5F8]",
    screenSurface: "bg-white",
    screenMuted: "bg-pink-50",
    accentBar: "bg-gradient-to-r from-pink-900 to-pink-600",
    chip: "bg-white border border-pink-300 text-pink-900/80",
    chipHighlight: "bg-pink-700 text-white border-pink-700",
    moduleCard: "bg-white border-l-[3px] border-l-pink-600 border border-pink-100",
    actionTile: "bg-white border border-pink-400/50 text-pink-950",
    actionTileActive: "bg-pink-700 text-white border-pink-700",
    tabBar: "bg-white border-t border-pink-100",
    tabInactive: "text-pink-300",
    tabActive: "text-pink-800",
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
    screenBg: "bg-[#F8FAFC]",
    screenSurface: "bg-white",
    screenMuted: "bg-blue-50/60",
    accentBar: "bg-gradient-to-r from-blue-950 to-blue-600",
    chip: "bg-white border border-blue-200 text-blue-900/80",
    chipHighlight: "bg-blue-700 text-white border-blue-700",
    moduleCard: "bg-white border-l-[3px] border-l-blue-600 border border-blue-100",
    actionTile: "bg-white border border-blue-400/50 text-blue-950",
    actionTileActive: "bg-blue-700 text-white border-blue-700",
    tabBar: "bg-white border-t border-blue-100",
    tabInactive: "text-blue-300",
    tabActive: "text-blue-800",
  },
  sante: {
    pageHeaderAccent: "sante",
    moduleActive:
      "border-teal-600 bg-teal-700 text-white shadow-lg shadow-teal-900/20",
    moduleIdle: "border-teal-200 bg-white hover:border-teal-300",
    moduleRing: "ring-2 ring-teal-200",
    imageGradient: "from-teal-950/80 via-teal-900/20 to-transparent",
    imageRing: "ring-2 ring-teal-200",
    moduleDesc: "text-teal-100",
    highlightBorder: "border-teal-200 bg-teal-50/50",
    highlightLabel: "text-teal-900/70",
    journeyActive: "bg-teal-700 text-white shadow-md shadow-teal-900/20",
    journeyIdle:
      "bg-white text-proday-muted ring-1 ring-teal-200 hover:ring-teal-300",
    pricingCard: "border-teal-200 bg-white hover:border-teal-300",
    ctaGradient: "from-teal-900 to-teal-950",
    ctaText: "text-teal-100",
    ctaBtn: "bg-white text-teal-900 hover:bg-teal-50",
    ctaBtnOutline: "border-white/30 text-white hover:bg-white/10",
    crossCard: "from-teal-800 to-teal-950",
    navCta: "bg-teal-700 hover:bg-teal-800",
    navLink: "font-medium text-teal-700 hover:text-teal-800",
    pricingAccent: "bg-teal-700",
    softSectionBg: "bg-teal-50/50",
    verificationSectionBg: "bg-teal-50/40",
    verificationTitle: "text-teal-950",
    pulseStroke: SANTE_BRAND.accent,
    pulseSliderAccent: "accent-teal-700",
    exploreCard: "border-teal-200 ring-1 ring-teal-100 hover:border-teal-300",
    exploreBadge: "bg-teal-600 text-white",
    demoTabActive: "bg-teal-500/25",
    screenBg: "bg-[#F0FDFA]",
    screenSurface: "bg-white",
    screenMuted: "bg-teal-50",
    accentBar: "bg-gradient-to-r from-teal-950 to-teal-500",
    chip: "bg-white border border-teal-300 text-teal-900/80",
    chipHighlight: "bg-teal-700 text-white border-teal-700",
    moduleCard: "bg-white border-l-[3px] border-l-teal-600 border border-teal-100",
    actionTile: "bg-white border border-teal-500/40 text-teal-950",
    actionTileActive: "bg-teal-700 text-white border-teal-700",
    tabBar: "bg-white border-t border-teal-100",
    tabInactive: "text-teal-300",
    tabActive: "text-teal-800",
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
