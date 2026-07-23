import {
  HOMME_BRAND,
  AMATEUR_BRAND,
  SUPPORTER_BRAND,
  PRO_BRAND,
  PRO_JOUEUR_BRAND,
  PRO_CLUB_BRAND,
  PRO_STAFF_BRAND,
  SANTE_BRAND,
  WOMAN_BRAND,
  type ProductLineWeb,
} from "@/lib/content";
import { PRODAY_LOGO_OFFICIAL } from "@/lib/brandingAssets";
import { ROUTES } from "@/lib/routes";

export type UniverseThemeId = ProductLineWeb | "pro_joueur" | "pro_club" | "pro_staff";

type UniverseThemeTokens = {
    pageHeaderAccent: "default" | "joueur" | "woman" | "amateur" | "supporter" | "pro" | "pro_club" | "pro_staff" | "sante";
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
    brandAccent: string;
    pulseSliderAccent: string;
    exploreCard: string;
    exploreBadge: string;
    demoTabActive: string;
};

export const UNIVERSE_THEME: Record<UniverseThemeId, UniverseThemeTokens> = {
  homme: {
    pageHeaderAccent: "joueur",
    moduleActive: "border-emerald-500/50 bg-emerald-600/30 text-white shadow-lg shadow-emerald-900/20",
    moduleIdle: "border-emerald-500/20 bg-white/5 hover:border-emerald-400/40",
    moduleRing: "ring-2 ring-emerald-500/30",
    imageGradient: "from-emerald-950/80 via-black/30 to-transparent",
    imageRing: "ring-2 ring-emerald-500/30",
    moduleDesc: "text-emerald-100/80",
    highlightBorder: "border-emerald-500/20 bg-white/5 backdrop-blur-sm",
    highlightLabel: "text-emerald-300/70",
    journeyActive: "bg-emerald-600 text-white shadow-md shadow-emerald-900/30",
    journeyIdle:
      "bg-white/5 text-white/70 ring-1 ring-white/10 hover:ring-emerald-400/30",
    pricingCard: "border-emerald-500/20 bg-white/5 hover:border-emerald-400/40",
    ctaGradient: "from-emerald-950 to-neutral-950",
    ctaText: "text-emerald-100/80",
    ctaBtn: "bg-emerald-500 text-white hover:bg-emerald-400",
    ctaBtnOutline: "border-white/30 text-white hover:bg-white/10",
    crossCard: "from-emerald-900 to-neutral-950",
    navCta: "bg-emerald-600 hover:bg-emerald-500",
    navLink: "font-medium text-emerald-300 hover:text-white",
    pricingAccent: "bg-emerald-600",
    softSectionBg: "bg-[#030303]",
    verificationSectionBg: "bg-[#050505]",
    verificationTitle: "text-white",
    pulseStroke: "#0054F0",
    brandAccent: "#0054F0",
    pulseSliderAccent: "accent-emerald-500",
    exploreCard: "border-emerald-500/20 ring-1 ring-emerald-500/10 hover:border-emerald-400/40",
    exploreBadge: "bg-emerald-600/90 text-white",
    demoTabActive: "bg-emerald-500/25",
    screenBg: "bg-[#0a0f0c]",
    screenSurface: "bg-[#111816]",
    screenMuted: "bg-[#0d1210]",
    accentBar: "bg-gradient-to-r from-emerald-950 to-emerald-600",
    chip: "bg-white/5 border border-emerald-500/30 text-emerald-100/80",
    chipHighlight: "bg-emerald-600 text-white border-emerald-600",
    moduleCard: "bg-white/5 border-l-[3px] border-l-emerald-600 border border-emerald-500/20",
    actionTile: "bg-white/5 border border-emerald-500/40 text-emerald-50",
    actionTileActive: "bg-emerald-600 text-white border-emerald-600",
    tabBar: "bg-[#111816] border-t border-emerald-500/20",
    tabInactive: "text-emerald-400/50",
    tabActive: "text-emerald-200",
  },
  woman: {
    pageHeaderAccent: "woman",
    moduleActive: "border-pink-500/50 bg-pink-600/30 text-white shadow-lg shadow-pink-900/20",
    moduleIdle: "border-pink-500/20 bg-white/5 hover:border-pink-400/40",
    moduleRing: "ring-2 ring-pink-500/30",
    imageGradient: "from-pink-950/80 via-black/30 to-transparent",
    imageRing: "ring-2 ring-pink-500/30",
    moduleDesc: "text-pink-100/80",
    highlightBorder: "border-pink-500/20 bg-white/5 backdrop-blur-sm",
    highlightLabel: "text-pink-300/70",
    journeyActive: "bg-pink-600 text-white shadow-md shadow-pink-900/30",
    journeyIdle:
      "bg-white/5 text-white/70 ring-1 ring-white/10 hover:ring-pink-400/30",
    pricingCard: "border-pink-500/20 bg-white/5 hover:border-pink-400/40",
    ctaGradient: "from-pink-950 to-neutral-950",
    ctaText: "text-pink-100/80",
    ctaBtn: "bg-pink-500 text-white hover:bg-pink-400",
    ctaBtnOutline: "border-white/30 text-white hover:bg-white/10",
    crossCard: "from-pink-900 to-neutral-950",
    navCta: "bg-pink-600 hover:bg-pink-500",
    navLink: "font-medium text-pink-300 hover:text-white",
    pricingAccent: "bg-pink-600",
    softSectionBg: "bg-[#030303]",
    verificationSectionBg: "bg-[#050505]",
    verificationTitle: "text-white",
    pulseStroke: "#F00000",
    brandAccent: "#F00000",
    pulseSliderAccent: "accent-pink-500",
    exploreCard: "border-pink-500/20 ring-1 ring-pink-500/10 hover:border-pink-400/40",
    exploreBadge: "bg-pink-600/90 text-white",
    demoTabActive: "bg-pink-500/25",
    screenBg: "bg-[#120a0e]",
    screenSurface: "bg-[#181014]",
    screenMuted: "bg-[#140c10]",
    accentBar: "bg-gradient-to-r from-pink-950 to-pink-600",
    chip: "bg-white/5 border border-pink-500/30 text-pink-100/80",
    chipHighlight: "bg-pink-600 text-white border-pink-600",
    moduleCard: "bg-white/5 border-l-[3px] border-l-pink-600 border border-pink-500/20",
    actionTile: "bg-white/5 border border-pink-500/40 text-pink-50",
    actionTileActive: "bg-pink-600 text-white border-pink-600",
    tabBar: "bg-[#181014] border-t border-pink-500/20",
    tabInactive: "text-pink-400/50",
    tabActive: "text-pink-200",
  },
  amateur: {
    pageHeaderAccent: "amateur",
    moduleActive: "border-orange-500/50 bg-orange-600/30 text-white shadow-lg shadow-orange-900/20",
    moduleIdle: "border-orange-500/20 bg-white/5 hover:border-orange-400/40",
    moduleRing: "ring-2 ring-orange-500/30",
    imageGradient: "from-orange-950/80 via-black/30 to-transparent",
    imageRing: "ring-2 ring-orange-500/30",
    moduleDesc: "text-orange-100/80",
    highlightBorder: "border-orange-500/20 bg-white/5 backdrop-blur-sm",
    highlightLabel: "text-orange-300/70",
    journeyActive: "bg-orange-600 text-white shadow-md shadow-orange-900/30",
    journeyIdle:
      "bg-white/5 text-white/70 ring-1 ring-white/10 hover:ring-orange-400/30",
    pricingCard: "border-orange-500/20 bg-white/5 hover:border-orange-400/40",
    ctaGradient: "from-orange-950 to-neutral-950",
    ctaText: "text-orange-100/80",
    ctaBtn: "bg-orange-500 text-white hover:bg-orange-400",
    ctaBtnOutline: "border-white/30 text-white hover:bg-white/10",
    crossCard: "from-orange-900 to-neutral-950",
    navCta: "bg-orange-600 hover:bg-orange-500",
    navLink: "font-medium text-orange-300 hover:text-white",
    pricingAccent: "bg-orange-600",
    softSectionBg: "bg-[#030303]",
    verificationSectionBg: "bg-[#050505]",
    verificationTitle: "text-white",
    pulseStroke: "#f97316",
    brandAccent: "#F03000",
    pulseSliderAccent: "accent-orange-500",
    exploreCard: "border-orange-500/20 ring-1 ring-orange-500/10 hover:border-orange-400/40",
    exploreBadge: "bg-orange-600/90 text-white",
    demoTabActive: "bg-orange-500/25",
    screenBg: "bg-[#120c08]",
    screenSurface: "bg-[#181210]",
    screenMuted: "bg-[#140e0a]",
    accentBar: "bg-gradient-to-r from-orange-950 to-orange-600",
    chip: "bg-white/5 border border-orange-500/30 text-orange-100/80",
    chipHighlight: "bg-orange-600 text-white border-orange-600",
    moduleCard: "bg-white/5 border-l-[3px] border-l-orange-600 border border-orange-500/20",
    actionTile: "bg-white/5 border border-orange-500/40 text-orange-50",
    actionTileActive: "bg-orange-600 text-white border-orange-600",
    tabBar: "bg-[#181210] border-t border-orange-500/20",
    tabInactive: "text-orange-400/50",
    tabActive: "text-orange-200",
  },
  supporter: {
    pageHeaderAccent: "supporter",
    moduleActive: "border-violet-500/50 bg-violet-600/30 text-white shadow-lg shadow-violet-900/20",
    moduleIdle: "border-violet-500/20 bg-white/5 hover:border-violet-400/40",
    moduleRing: "ring-2 ring-violet-500/30",
    imageGradient: "from-violet-950/80 via-black/30 to-transparent",
    imageRing: "ring-2 ring-violet-500/30",
    moduleDesc: "text-violet-100/80",
    highlightBorder: "border-violet-500/20 bg-white/5 backdrop-blur-sm",
    highlightLabel: "text-violet-300/70",
    journeyActive: "bg-violet-600 text-white shadow-md shadow-violet-900/30",
    journeyIdle:
      "bg-white/5 text-white/70 ring-1 ring-white/10 hover:ring-violet-400/30",
    pricingCard: "border-violet-500/20 bg-white/5 hover:border-violet-400/40",
    ctaGradient: "from-violet-950 to-neutral-950",
    ctaText: "text-violet-100/80",
    ctaBtn: "bg-violet-600 text-white hover:bg-violet-500",
    ctaBtnOutline: "border-white/30 text-white hover:bg-white/10",
    crossCard: "from-violet-900 to-neutral-950",
    navCta: "bg-violet-600 hover:bg-violet-500",
    navLink: "font-medium text-violet-300 hover:text-white",
    pricingAccent: "bg-violet-600",
    softSectionBg: "bg-[#030303]",
    verificationSectionBg: "bg-[#050505]",
    verificationTitle: "text-white",
    pulseStroke: "#8b5cf6",
    brandAccent: "#3C00F0",
    pulseSliderAccent: "accent-violet-500",
    exploreCard: "border-violet-500/20 ring-1 ring-violet-500/10 hover:border-violet-400/40",
    exploreBadge: "bg-violet-600/90 text-white",
    demoTabActive: "bg-violet-500/25",
    screenBg: "bg-[#0c0812]",
    screenSurface: "bg-[#141018]",
    screenMuted: "bg-[#100c14]",
    accentBar: "bg-gradient-to-r from-violet-950 to-violet-600",
    chip: "bg-white/5 border border-violet-500/30 text-violet-100/80",
    chipHighlight: "bg-violet-600 text-white border-violet-600",
    moduleCard: "bg-white/5 border-l-[3px] border-l-violet-600 border border-violet-500/20",
    actionTile: "bg-white/5 border border-violet-500/40 text-violet-50",
    actionTileActive: "bg-violet-600 text-white border-violet-600",
    tabBar: "bg-[#141018] border-t border-violet-500/20",
    tabInactive: "text-violet-400/50",
    tabActive: "text-violet-200",
  },
  pro: {
    pageHeaderAccent: "pro",
    moduleActive: "border-blue-500/50 bg-blue-600/30 text-white shadow-lg shadow-blue-900/20",
    moduleIdle: "border-blue-500/20 bg-white/5 hover:border-blue-400/40",
    moduleRing: "ring-2 ring-blue-500/30",
    imageGradient: "from-blue-950/80 via-black/30 to-transparent",
    imageRing: "ring-2 ring-blue-500/30",
    moduleDesc: "text-blue-100/80",
    highlightBorder: "border-blue-500/20 bg-white/5 backdrop-blur-sm",
    highlightLabel: "text-blue-300/70",
    journeyActive: "bg-blue-600 text-white shadow-md shadow-blue-900/30",
    journeyIdle:
      "bg-white/5 text-white/70 ring-1 ring-white/10 hover:ring-blue-400/30",
    pricingCard: "border-blue-500/20 bg-white/5 hover:border-blue-400/40",
    ctaGradient: "from-blue-950 to-neutral-950",
    ctaText: "text-blue-100/80",
    ctaBtn: "bg-white text-blue-950 hover:bg-blue-50",
    ctaBtnOutline: "border-white/30 text-white hover:bg-white/10",
    crossCard: "from-blue-900 to-slate-950",
    navCta: "bg-blue-600 hover:bg-blue-500",
    navLink: "font-medium text-blue-300 hover:text-white",
    pricingAccent: "bg-blue-600",
    softSectionBg: "bg-[#030303]",
    verificationSectionBg: "bg-[#050505]",
    verificationTitle: "text-white",
    pulseStroke: "#3b82f6",
    brandAccent: "#006CFC",
    pulseSliderAccent: "accent-blue-500",
    exploreCard: "border-blue-500/20 ring-1 ring-blue-500/10 hover:border-blue-400/40",
    exploreBadge: "bg-blue-600/90 text-white",
    demoTabActive: "bg-blue-500/25",
    screenBg: "bg-[#0a0c12]",
    screenSurface: "bg-[#111318]",
    screenMuted: "bg-[#0d0f14]",
    accentBar: "bg-gradient-to-r from-blue-950 to-blue-600",
    chip: "bg-white/5 border border-blue-500/30 text-blue-100/80",
    chipHighlight: "bg-blue-600 text-white border-blue-600",
    moduleCard: "bg-white/5 border-l-[3px] border-l-blue-600 border border-blue-500/20",
    actionTile: "bg-white/5 border border-blue-500/40 text-blue-50",
    actionTileActive: "bg-blue-600 text-white border-blue-600",
    tabBar: "bg-[#111318] border-t border-blue-500/20",
    tabInactive: "text-blue-400/50",
    tabActive: "text-blue-200",
  },
  sante: {
    pageHeaderAccent: "sante",
    moduleActive: "border-teal-500/50 bg-teal-600/30 text-white shadow-lg shadow-teal-900/20",
    moduleIdle: "border-teal-500/20 bg-white/5 hover:border-teal-400/40",
    moduleRing: "ring-2 ring-teal-500/30",
    imageGradient: "from-teal-950/80 via-black/30 to-transparent",
    imageRing: "ring-2 ring-teal-500/30",
    moduleDesc: "text-teal-100/80",
    highlightBorder: "border-teal-500/20 bg-white/5 backdrop-blur-sm",
    highlightLabel: "text-teal-300/70",
    journeyActive: "bg-teal-600 text-white shadow-md shadow-teal-900/30",
    journeyIdle:
      "bg-white/5 text-white/70 ring-1 ring-white/10 hover:ring-teal-400/30",
    pricingCard: "border-teal-500/20 bg-white/5 hover:border-teal-400/40",
    ctaGradient: "from-teal-950 to-neutral-950",
    ctaText: "text-teal-100/80",
    ctaBtn: "bg-teal-500 text-white hover:bg-teal-400",
    ctaBtnOutline: "border-white/30 text-white hover:bg-white/10",
    crossCard: "from-teal-900 to-neutral-950",
    navCta: "bg-teal-600 hover:bg-teal-500",
    navLink: "font-medium text-teal-300 hover:text-white",
    pricingAccent: "bg-teal-600",
    softSectionBg: "bg-[#030303]",
    verificationSectionBg: "bg-[#050505]",
    verificationTitle: "text-white",
    pulseStroke: "#14b8a6",
    brandAccent: "#00CCB4",
    pulseSliderAccent: "accent-teal-500",
    exploreCard: "border-teal-500/20 ring-1 ring-teal-500/10 hover:border-teal-400/40",
    exploreBadge: "bg-teal-600/90 text-white",
    demoTabActive: "bg-teal-500/25",
    screenBg: "bg-[#0a100f]",
    screenSurface: "bg-[#111816]",
    screenMuted: "bg-[#0d1210]",
    accentBar: "bg-gradient-to-r from-teal-950 to-teal-500",
    chip: "bg-white/5 border border-teal-500/30 text-teal-100/80",
    chipHighlight: "bg-teal-600 text-white border-teal-600",
    moduleCard: "bg-white/5 border-l-[3px] border-l-teal-600 border border-teal-500/20",
    actionTile: "bg-white/5 border border-teal-500/40 text-teal-50",
    actionTileActive: "bg-teal-600 text-white border-teal-600",
    tabBar: "bg-[#111816] border-t border-teal-500/20",
    tabInactive: "text-teal-400/50",
    tabActive: "text-teal-200",
  },
  pro_joueur: {
    pageHeaderAccent: "joueur",
    moduleActive: "border-emerald-500/50 bg-emerald-600/30 text-white shadow-lg shadow-emerald-900/20",
    moduleIdle: "border-emerald-500/20 bg-white/5 hover:border-emerald-400/40",
    moduleRing: "ring-2 ring-emerald-500/30",
    imageGradient: "from-emerald-950/80 via-black/30 to-transparent",
    imageRing: "ring-2 ring-emerald-500/30",
    moduleDesc: "text-emerald-100/80",
    highlightBorder: "border-emerald-500/20 bg-white/5 backdrop-blur-sm",
    highlightLabel: "text-emerald-300/70",
    journeyActive: "bg-emerald-600 text-white shadow-md shadow-emerald-900/30",
    journeyIdle:
      "bg-white/5 text-white/70 ring-1 ring-white/10 hover:ring-emerald-400/30",
    pricingCard: "border-emerald-500/20 bg-white/5 hover:border-emerald-400/40",
    ctaGradient: "from-emerald-950 to-neutral-950",
    ctaText: "text-emerald-100/80",
    ctaBtn: "bg-emerald-500 text-white hover:bg-emerald-400",
    ctaBtnOutline: "border-white/30 text-white hover:bg-white/10",
    crossCard: "from-emerald-900 to-neutral-950",
    navCta: "bg-emerald-600 hover:bg-emerald-500",
    navLink: "font-medium text-emerald-300 hover:text-white",
    pricingAccent: "bg-emerald-600",
    softSectionBg: "bg-[#030303]",
    verificationSectionBg: "bg-[#050505]",
    verificationTitle: "text-white",
    pulseStroke: "#0054F0",
    brandAccent: "#0054F0",
    pulseSliderAccent: "accent-emerald-500",
    exploreCard: "border-emerald-500/20 ring-1 ring-emerald-500/10 hover:border-emerald-400/40",
    exploreBadge: "bg-emerald-600/90 text-white",
    demoTabActive: "bg-emerald-500/25",
    screenBg: "bg-[#0a100f]",
    screenSurface: "bg-[#111816]",
    screenMuted: "bg-[#0d1210]",
    accentBar: "bg-gradient-to-r from-emerald-950 to-emerald-500",
    chip: "bg-white/5 border border-emerald-500/30 text-emerald-100/80",
    chipHighlight: "bg-emerald-600 text-white border-emerald-600",
    moduleCard: "bg-white/5 border-l-[3px] border-l-emerald-600 border border-emerald-500/20",
    actionTile: "bg-white/5 border border-emerald-500/40 text-emerald-50",
    actionTileActive: "bg-emerald-600 text-white border-emerald-600",
    tabBar: "bg-[#111816] border-t border-emerald-500/20",
    tabInactive: "text-emerald-400/50",
    tabActive: "text-emerald-200",
  },
  pro_club: {
    pageHeaderAccent: "pro_club",
    moduleActive: "border-blue-500/50 bg-blue-600/30 text-white shadow-lg shadow-blue-900/20",
    moduleIdle: "border-blue-500/20 bg-white/5 hover:border-blue-400/40",
    moduleRing: "ring-2 ring-blue-500/30",
    imageGradient: "from-blue-950/80 via-black/30 to-transparent",
    imageRing: "ring-2 ring-blue-500/30",
    moduleDesc: "text-blue-100/80",
    highlightBorder: "border-blue-500/20 bg-white/5 backdrop-blur-sm",
    highlightLabel: "text-blue-300/70",
    journeyActive: "bg-blue-600 text-white shadow-md shadow-blue-900/30",
    journeyIdle:
      "bg-white/5 text-white/70 ring-1 ring-white/10 hover:ring-blue-400/30",
    pricingCard: "border-blue-500/20 bg-white/5 hover:border-blue-400/40",
    ctaGradient: "from-blue-950 to-neutral-950",
    ctaText: "text-blue-100/80",
    ctaBtn: "bg-white text-blue-950 hover:bg-blue-50",
    ctaBtnOutline: "border-white/30 text-white hover:bg-white/10",
    crossCard: "from-blue-900 to-slate-950",
    navCta: "bg-blue-600 hover:bg-blue-500",
    navLink: "font-medium text-blue-300 hover:text-white",
    pricingAccent: "bg-blue-600",
    softSectionBg: "bg-[#030303]",
    verificationSectionBg: "bg-[#050505]",
    verificationTitle: "text-white",
    pulseStroke: "#3b82f6",
    brandAccent: "#006CFC",
    pulseSliderAccent: "accent-blue-500",
    exploreCard: "border-blue-500/20 ring-1 ring-blue-500/10 hover:border-blue-400/40",
    exploreBadge: "bg-blue-600/90 text-white",
    demoTabActive: "bg-blue-500/25",
    screenBg: "bg-[#0a0c12]",
    screenSurface: "bg-[#111318]",
    screenMuted: "bg-[#0d0f14]",
    accentBar: "bg-gradient-to-r from-blue-950 to-blue-600",
    chip: "bg-white/5 border border-blue-500/30 text-blue-100/80",
    chipHighlight: "bg-blue-600 text-white border-blue-600",
    moduleCard: "bg-white/5 border-l-[3px] border-l-blue-600 border border-blue-500/20",
    actionTile: "bg-white/5 border border-blue-500/40 text-blue-50",
    actionTileActive: "bg-blue-600 text-white border-blue-600",
    tabBar: "bg-[#111318] border-t border-blue-500/20",
    tabInactive: "text-blue-400/50",
    tabActive: "text-blue-200",
  },
  pro_staff: {
    pageHeaderAccent: "pro_staff",
    moduleActive: "border-indigo-500/50 bg-indigo-600/30 text-white shadow-lg shadow-indigo-900/20",
    moduleIdle: "border-indigo-500/20 bg-white/5 hover:border-indigo-400/40",
    moduleRing: "ring-2 ring-indigo-500/30",
    imageGradient: "from-indigo-950/80 via-black/30 to-transparent",
    imageRing: "ring-2 ring-indigo-500/30",
    moduleDesc: "text-indigo-100/80",
    highlightBorder: "border-indigo-500/20 bg-white/5 backdrop-blur-sm",
    highlightLabel: "text-indigo-300/70",
    journeyActive: "bg-indigo-600 text-white shadow-md shadow-indigo-900/30",
    journeyIdle:
      "bg-white/5 text-white/70 ring-1 ring-white/10 hover:ring-indigo-400/30",
    pricingCard: "border-indigo-500/20 bg-white/5 hover:border-indigo-400/40",
    ctaGradient: "from-indigo-950 to-neutral-950",
    ctaText: "text-indigo-100/80",
    ctaBtn: "bg-indigo-500 text-white hover:bg-indigo-400",
    ctaBtnOutline: "border-white/30 text-white hover:bg-white/10",
    crossCard: "from-indigo-900 to-slate-950",
    navCta: "bg-indigo-600 hover:bg-indigo-500",
    navLink: "font-medium text-indigo-300 hover:text-white",
    pricingAccent: "bg-indigo-600",
    softSectionBg: "bg-[#030303]",
    verificationSectionBg: "bg-[#050505]",
    verificationTitle: "text-white",
    pulseStroke: "#6366f1",
    brandAccent: "#3B5BFF",
    pulseSliderAccent: "accent-indigo-500",
    exploreCard: "border-indigo-500/20 ring-1 ring-indigo-500/10 hover:border-indigo-400/40",
    exploreBadge: "bg-indigo-600/90 text-white",
    demoTabActive: "bg-indigo-500/25",
    screenBg: "bg-[#0a0a12]",
    screenSurface: "bg-[#111118]",
    screenMuted: "bg-[#0d0d14]",
    accentBar: "bg-gradient-to-r from-indigo-950 to-indigo-600",
    chip: "bg-white/5 border border-indigo-500/30 text-indigo-100/80",
    chipHighlight: "bg-indigo-600 text-white border-indigo-600",
    moduleCard: "bg-white/5 border-l-[3px] border-l-indigo-600 border border-indigo-500/20",
    actionTile: "bg-white/5 border border-indigo-500/40 text-indigo-50",
    actionTileActive: "bg-indigo-600 text-white border-indigo-600",
    tabBar: "bg-[#111118] border-t border-indigo-500/20",
    tabInactive: "text-indigo-400/50",
    tabActive: "text-indigo-200",
  },
};

export function universeFromPath(pathname: string): ProductLineWeb | null {
  if (pathname.startsWith(ROUTES.proJoueur)) return "pro";
  if (pathname.startsWith(ROUTES.proClub)) return "pro";
  if (pathname.startsWith(ROUTES.proStaff)) return "pro";
  if (pathname.startsWith(ROUTES.woman)) return "woman";
  if (pathname.startsWith(ROUTES.amateur)) return "amateur";
  if (pathname.startsWith(ROUTES.supporter)) return "supporter";
  if (pathname.startsWith(ROUTES.pro)) return "pro";
  if (pathname.startsWith(ROUTES.sante)) return "sante";
  if (pathname.startsWith(ROUTES.homme)) return "homme";
  if (pathname.startsWith(ROUTES.joueurs)) return "homme";
  return null;
}

export function themeIdForUniverse(universe: import("@/lib/content").UniversePageId): UniverseThemeId {
  if (universe === "pro_joueur") return "pro_joueur";
  if (universe === "pro_club") return "pro_club";
  if (universe === "pro_staff") return "pro_staff";
  return universe as ProductLineWeb;
}

export function universeFromExploreHref(href: string): ProductLineWeb | null {
  if (href === ROUTES.woman) return "woman";
  if (href === ROUTES.amateur) return "amateur";
  if (href === ROUTES.supporter) return "supporter";
  if (href === ROUTES.pro) return "pro";
  if (href === ROUTES.homme) return "homme";
  if (href === ROUTES.joueurs) return "homme";
  return null;
}

export function navBrandForPath(pathname: string) {
  if (pathname.startsWith(ROUTES.proJoueur)) {
    return { name: PRO_JOUEUR_BRAND.name, logo: PRO_JOUEUR_BRAND.logo, theme: UNIVERSE_THEME.pro_joueur };
  }
  if (pathname.startsWith(ROUTES.proClub)) {
    return { name: PRO_CLUB_BRAND.name, logo: PRO_CLUB_BRAND.logo, theme: UNIVERSE_THEME.pro_club };
  }
  if (pathname.startsWith(ROUTES.proStaff)) {
    return { name: PRO_STAFF_BRAND.name, logo: PRO_STAFF_BRAND.logo, theme: UNIVERSE_THEME.pro_staff };
  }
  if (pathname.startsWith(ROUTES.sponsor) || pathname.startsWith(ROUTES.partenaires)) {
    return {
      name: "Pro Day Sponsor",
      logo: PRO_BRAND.logo,
      theme: UNIVERSE_THEME.pro,
    };
  }
  const line = universeFromPath(pathname);
  if (line === "woman") {
    return { name: WOMAN_BRAND.name, logo: WOMAN_BRAND.logo, theme: UNIVERSE_THEME.woman };
  }
  if (line === "pro") {
    return { name: PRO_BRAND.name, logo: PRO_BRAND.logo, theme: UNIVERSE_THEME.pro };
  }
  if (line === "supporter") {
    return { name: SUPPORTER_BRAND.name, logo: SUPPORTER_BRAND.logo, theme: UNIVERSE_THEME.supporter };
  }
  if (line === "sante") {
    return { name: SANTE_BRAND.name, logo: SANTE_BRAND.logo, theme: UNIVERSE_THEME.sante };
  }
  if (line === "homme") {
    return { name: HOMME_BRAND.name, logo: HOMME_BRAND.logo, theme: UNIVERSE_THEME.homme };
  }
  return {
    name: "ProDay",
    logo: PRODAY_LOGO_OFFICIAL,
    theme: UNIVERSE_THEME.homme,
  };
}
