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
  brandDeep: string;
  pulseSliderAccent: string;
  exploreCard: string;
  exploreBadge: string;
  demoTabActive: string;
  ambientWash: string;
};

export const UNIVERSE_THEME: Record<UniverseThemeId, UniverseThemeTokens> = {
  homme: {
    pageHeaderAccent: "joueur",
    brandAccent: "#E8B923",
    brandDeep: "#B8941F",
    pulseStroke: "#E8B923",
    pulseSliderAccent: "accent-[#E8B923]",
    softSectionBg: "bg-black",
    verificationSectionBg: "bg-[#050505]",
    verificationTitle: "text-white",
    ambientWash: "radial-gradient(ellipse 80% 55% at 10% 0%, #E8B92340, transparent 55%), radial-gradient(ellipse 60% 45% at 90% 20%, #B8941F66, transparent 50%)",
    moduleActive: "border-[#E8B923]/60 bg-[#E8B923]/25 text-white shadow-lg",
    moduleIdle: "border-[#E8B923]/25 bg-white/[0.04] hover:border-[#E8B923]/55 hover:bg-[#E8B923]/10",
    moduleRing: "ring-2 ring-[#E8B923]/35",
    imageGradient: "from-[#B8941F]/90 via-black/40 to-transparent",
    imageRing: "ring-2 ring-[#E8B923]/40",
    moduleDesc: "text-white/70",
    highlightBorder: "border-[#E8B923]/35 bg-gradient-to-br from-[#E8B923]/15 to-transparent backdrop-blur-md",
    highlightLabel: "text-[#F5D04A]",
    journeyActive: "bg-[#E8B923] text-white shadow-md",
    journeyIdle: "bg-white/5 text-white/70 ring-1 ring-white/10 hover:ring-[#E8B923]/40",
    pricingCard: "border-[#E8B923]/30 bg-white/[0.04] hover:border-[#E8B923]/55",
    ctaGradient: "from-[#B8941F] to-black",
    ctaText: "text-white/75",
    ctaBtn: "bg-[#E8B923] text-white hover:brightness-110 shadow-[0_12px_40px_-12px_#E8B92399]",
    ctaBtnOutline: "border-[#E8B923]/50 text-white hover:bg-[#E8B923]/15",
    crossCard: "from-[#B8941F] to-black",
    navCta: "bg-[#E8B923] hover:brightness-110",
    navLink: "font-medium text-[#F5D04A] hover:text-white",
    pricingAccent: "bg-[#E8B923]",
    exploreCard: "border-[#E8B923]/30 ring-1 ring-[#E8B923]/15 hover:border-[#E8B923]/55",
    exploreBadge: "bg-[#E8B923] text-white",
    demoTabActive: "bg-[#E8B923]/30",
    screenBg: "bg-black",
    screenSurface: "bg-[#121212]",
    screenMuted: "bg-[#0a0a0a]",
    accentBar: "bg-gradient-to-r from-[#B8941F] to-[#E8B923]",
    chip: "bg-white/5 border border-[#E8B923]/35 text-white/80",
    chipHighlight: "bg-[#E8B923] text-white border-[#E8B923]",
    moduleCard: "bg-white/[0.04] border-l-[3px] border-l-[#E8B923] border border-[#E8B923]/25",
    actionTile: "bg-white/5 border border-[#E8B923]/40 text-white",
    actionTileActive: "bg-[#E8B923] text-white border-[#E8B923]",
    tabBar: "bg-[#111] border-t border-[#E8B923]/25",
    tabInactive: "text-[#F5D04A]/45",
    tabActive: "text-[#F5D04A]",
  },
  woman: {
    pageHeaderAccent: "woman",
    brandAccent: "#F00000",
    brandDeep: "#540000",
    pulseStroke: "#F00000",
    pulseSliderAccent: "accent-[#F00000]",
    softSectionBg: "bg-black",
    verificationSectionBg: "bg-[#050505]",
    verificationTitle: "text-white",
    ambientWash: "radial-gradient(ellipse 80% 55% at 10% 0%, #F0000040, transparent 55%), radial-gradient(ellipse 60% 45% at 90% 20%, #54000066, transparent 50%)",
    moduleActive: "border-[#F00000]/60 bg-[#F00000]/25 text-white shadow-lg",
    moduleIdle: "border-[#F00000]/25 bg-white/[0.04] hover:border-[#F00000]/55 hover:bg-[#F00000]/10",
    moduleRing: "ring-2 ring-[#F00000]/35",
    imageGradient: "from-[#540000]/90 via-black/40 to-transparent",
    imageRing: "ring-2 ring-[#F00000]/40",
    moduleDesc: "text-white/70",
    highlightBorder: "border-[#F00000]/35 bg-gradient-to-br from-[#F00000]/15 to-transparent backdrop-blur-md",
    highlightLabel: "text-[#F00000]",
    journeyActive: "bg-[#F00000] text-white shadow-md",
    journeyIdle: "bg-white/5 text-white/70 ring-1 ring-white/10 hover:ring-[#F00000]/40",
    pricingCard: "border-[#F00000]/30 bg-white/[0.04] hover:border-[#F00000]/55",
    ctaGradient: "from-[#540000] to-black",
    ctaText: "text-white/75",
    ctaBtn: "bg-[#F00000] text-white hover:brightness-110 shadow-[0_12px_40px_-12px_#F0000099]",
    ctaBtnOutline: "border-[#F00000]/50 text-white hover:bg-[#F00000]/15",
    crossCard: "from-[#540000] to-black",
    navCta: "bg-[#F00000] hover:brightness-110",
    navLink: "font-medium text-[#F00000] hover:text-white",
    pricingAccent: "bg-[#F00000]",
    exploreCard: "border-[#F00000]/30 ring-1 ring-[#F00000]/15 hover:border-[#F00000]/55",
    exploreBadge: "bg-[#F00000] text-white",
    demoTabActive: "bg-[#F00000]/30",
    screenBg: "bg-black",
    screenSurface: "bg-[#121212]",
    screenMuted: "bg-[#0a0a0a]",
    accentBar: "bg-gradient-to-r from-[#540000] to-[#F00000]",
    chip: "bg-white/5 border border-[#F00000]/35 text-white/80",
    chipHighlight: "bg-[#F00000] text-white border-[#F00000]",
    moduleCard: "bg-white/[0.04] border-l-[3px] border-l-[#F00000] border border-[#F00000]/25",
    actionTile: "bg-white/5 border border-[#F00000]/40 text-white",
    actionTileActive: "bg-[#F00000] text-white border-[#F00000]",
    tabBar: "bg-[#111] border-t border-[#F00000]/25",
    tabInactive: "text-[#F00000]/45",
    tabActive: "text-[#F00000]",
  },
  amateur: {
    pageHeaderAccent: "amateur",
    brandAccent: "#F03000",
    brandDeep: "#841800",
    pulseStroke: "#F03000",
    pulseSliderAccent: "accent-[#F03000]",
    softSectionBg: "bg-black",
    verificationSectionBg: "bg-[#050505]",
    verificationTitle: "text-white",
    ambientWash: "radial-gradient(ellipse 80% 55% at 10% 0%, #F0300040, transparent 55%), radial-gradient(ellipse 60% 45% at 90% 20%, #84180066, transparent 50%)",
    moduleActive: "border-[#F03000]/60 bg-[#F03000]/25 text-white shadow-lg",
    moduleIdle: "border-[#F03000]/25 bg-white/[0.04] hover:border-[#F03000]/55 hover:bg-[#F03000]/10",
    moduleRing: "ring-2 ring-[#F03000]/35",
    imageGradient: "from-[#841800]/90 via-black/40 to-transparent",
    imageRing: "ring-2 ring-[#F03000]/40",
    moduleDesc: "text-white/70",
    highlightBorder: "border-[#F03000]/35 bg-gradient-to-br from-[#F03000]/15 to-transparent backdrop-blur-md",
    highlightLabel: "text-[#F03000]",
    journeyActive: "bg-[#F03000] text-white shadow-md",
    journeyIdle: "bg-white/5 text-white/70 ring-1 ring-white/10 hover:ring-[#F03000]/40",
    pricingCard: "border-[#F03000]/30 bg-white/[0.04] hover:border-[#F03000]/55",
    ctaGradient: "from-[#841800] to-black",
    ctaText: "text-white/75",
    ctaBtn: "bg-[#F03000] text-white hover:brightness-110 shadow-[0_12px_40px_-12px_#F0300099]",
    ctaBtnOutline: "border-[#F03000]/50 text-white hover:bg-[#F03000]/15",
    crossCard: "from-[#841800] to-black",
    navCta: "bg-[#F03000] hover:brightness-110",
    navLink: "font-medium text-[#F03000] hover:text-white",
    pricingAccent: "bg-[#F03000]",
    exploreCard: "border-[#F03000]/30 ring-1 ring-[#F03000]/15 hover:border-[#F03000]/55",
    exploreBadge: "bg-[#F03000] text-white",
    demoTabActive: "bg-[#F03000]/30",
    screenBg: "bg-black",
    screenSurface: "bg-[#121212]",
    screenMuted: "bg-[#0a0a0a]",
    accentBar: "bg-gradient-to-r from-[#841800] to-[#F03000]",
    chip: "bg-white/5 border border-[#F03000]/35 text-white/80",
    chipHighlight: "bg-[#F03000] text-white border-[#F03000]",
    moduleCard: "bg-white/[0.04] border-l-[3px] border-l-[#F03000] border border-[#F03000]/25",
    actionTile: "bg-white/5 border border-[#F03000]/40 text-white",
    actionTileActive: "bg-[#F03000] text-white border-[#F03000]",
    tabBar: "bg-[#111] border-t border-[#F03000]/25",
    tabInactive: "text-[#F03000]/45",
    tabActive: "text-[#F03000]",
  },
  supporter: {
    pageHeaderAccent: "supporter",
    brandAccent: "#06B6D4",
    brandDeep: "#164E63",
    pulseStroke: "#06B6D4",
    pulseSliderAccent: "accent-[#06B6D4]",
    softSectionBg: "bg-black",
    verificationSectionBg: "bg-[#050505]",
    verificationTitle: "text-white",
    ambientWash: "radial-gradient(ellipse 80% 55% at 10% 0%, #06B6D440, transparent 55%), radial-gradient(ellipse 60% 45% at 90% 20%, #164E6366, transparent 50%)",
    moduleActive: "border-[#06B6D4]/60 bg-[#06B6D4]/25 text-white shadow-lg",
    moduleIdle: "border-[#06B6D4]/25 bg-white/[0.04] hover:border-[#06B6D4]/55 hover:bg-[#06B6D4]/10",
    moduleRing: "ring-2 ring-[#06B6D4]/35",
    imageGradient: "from-[#164E63]/90 via-black/40 to-transparent",
    imageRing: "ring-2 ring-[#06B6D4]/40",
    moduleDesc: "text-white/70",
    highlightBorder: "border-[#06B6D4]/35 bg-gradient-to-br from-[#06B6D4]/15 to-transparent backdrop-blur-md",
    highlightLabel: "text-[#06B6D4]",
    journeyActive: "bg-[#06B6D4] text-white shadow-md",
    journeyIdle: "bg-white/5 text-white/70 ring-1 ring-white/10 hover:ring-[#06B6D4]/40",
    pricingCard: "border-[#06B6D4]/30 bg-white/[0.04] hover:border-[#06B6D4]/55",
    ctaGradient: "from-[#164E63] to-black",
    ctaText: "text-white/75",
    ctaBtn: "bg-[#06B6D4] text-white hover:brightness-110 shadow-[0_12px_40px_-12px_#06B6D499]",
    ctaBtnOutline: "border-[#06B6D4]/50 text-white hover:bg-[#06B6D4]/15",
    crossCard: "from-[#164E63] to-black",
    navCta: "bg-[#06B6D4] hover:brightness-110",
    navLink: "font-medium text-[#06B6D4] hover:text-white",
    pricingAccent: "bg-[#06B6D4]",
    exploreCard: "border-[#06B6D4]/30 ring-1 ring-[#06B6D4]/15 hover:border-[#06B6D4]/55",
    exploreBadge: "bg-[#06B6D4] text-white",
    demoTabActive: "bg-[#06B6D4]/30",
    screenBg: "bg-black",
    screenSurface: "bg-[#121212]",
    screenMuted: "bg-[#0a0a0a]",
    accentBar: "bg-gradient-to-r from-[#164E63] to-[#06B6D4]",
    chip: "bg-white/5 border border-[#06B6D4]/35 text-white/80",
    chipHighlight: "bg-[#06B6D4] text-white border-[#06B6D4]",
    moduleCard: "bg-white/[0.04] border-l-[3px] border-l-[#06B6D4] border border-[#06B6D4]/25",
    actionTile: "bg-white/5 border border-[#06B6D4]/40 text-white",
    actionTileActive: "bg-[#06B6D4] text-white border-[#06B6D4]",
    tabBar: "bg-[#111] border-t border-[#06B6D4]/25",
    tabInactive: "text-[#06B6D4]/45",
    tabActive: "text-[#06B6D4]",
  },
  pro: {
    pageHeaderAccent: "pro",
    brandAccent: "#7C3AED",
    brandDeep: "#3B0764",
    pulseStroke: "#7C3AED",
    pulseSliderAccent: "accent-[#7C3AED]",
    softSectionBg: "bg-black",
    verificationSectionBg: "bg-[#050505]",
    verificationTitle: "text-white",
    ambientWash: "radial-gradient(ellipse 80% 55% at 10% 0%, #7C3AED40, transparent 55%), radial-gradient(ellipse 60% 45% at 90% 20%, #3B076466, transparent 50%)",
    moduleActive: "border-[#7C3AED]/60 bg-[#7C3AED]/25 text-white shadow-lg",
    moduleIdle: "border-[#7C3AED]/25 bg-white/[0.04] hover:border-[#7C3AED]/55 hover:bg-[#7C3AED]/10",
    moduleRing: "ring-2 ring-[#7C3AED]/35",
    imageGradient: "from-[#3B0764]/90 via-black/40 to-transparent",
    imageRing: "ring-2 ring-[#7C3AED]/40",
    moduleDesc: "text-white/70",
    highlightBorder: "border-[#7C3AED]/35 bg-gradient-to-br from-[#7C3AED]/15 to-transparent backdrop-blur-md",
    highlightLabel: "text-[#7C3AED]",
    journeyActive: "bg-[#7C3AED] text-white shadow-md",
    journeyIdle: "bg-white/5 text-white/70 ring-1 ring-white/10 hover:ring-[#7C3AED]/40",
    pricingCard: "border-[#7C3AED]/30 bg-white/[0.04] hover:border-[#7C3AED]/55",
    ctaGradient: "from-[#3B0764] to-black",
    ctaText: "text-white/75",
    ctaBtn: "bg-white text-black hover:bg-white/90",
    ctaBtnOutline: "border-[#7C3AED]/50 text-white hover:bg-[#7C3AED]/15",
    crossCard: "from-[#3B0764] to-black",
    navCta: "bg-[#7C3AED] hover:brightness-110",
    navLink: "font-medium text-[#7C3AED] hover:text-white",
    pricingAccent: "bg-[#7C3AED]",
    exploreCard: "border-[#7C3AED]/30 ring-1 ring-[#7C3AED]/15 hover:border-[#7C3AED]/55",
    exploreBadge: "bg-[#7C3AED] text-white",
    demoTabActive: "bg-[#7C3AED]/30",
    screenBg: "bg-black",
    screenSurface: "bg-[#121212]",
    screenMuted: "bg-[#0a0a0a]",
    accentBar: "bg-gradient-to-r from-[#3B0764] to-[#7C3AED]",
    chip: "bg-white/5 border border-[#7C3AED]/35 text-white/80",
    chipHighlight: "bg-[#7C3AED] text-white border-[#7C3AED]",
    moduleCard: "bg-white/[0.04] border-l-[3px] border-l-[#7C3AED] border border-[#7C3AED]/25",
    actionTile: "bg-white/5 border border-[#7C3AED]/40 text-white",
    actionTileActive: "bg-[#7C3AED] text-white border-[#7C3AED]",
    tabBar: "bg-[#111] border-t border-[#7C3AED]/25",
    tabInactive: "text-[#7C3AED]/45",
    tabActive: "text-[#7C3AED]",
  },
  sante: {
    pageHeaderAccent: "sante",
    brandAccent: "#F97316",
    brandDeep: "#7C2D12",
    pulseStroke: "#F97316",
    pulseSliderAccent: "accent-[#F97316]",
    softSectionBg: "bg-black",
    verificationSectionBg: "bg-[#050505]",
    verificationTitle: "text-white",
    ambientWash: "radial-gradient(ellipse 80% 55% at 10% 0%, #F9731640, transparent 55%), radial-gradient(ellipse 60% 45% at 90% 20%, #7C2D1266, transparent 50%)",
    moduleActive: "border-[#F97316]/60 bg-[#F97316]/25 text-white shadow-lg",
    moduleIdle: "border-[#F97316]/25 bg-white/[0.04] hover:border-[#F97316]/55 hover:bg-[#F97316]/10",
    moduleRing: "ring-2 ring-[#F97316]/35",
    imageGradient: "from-[#7C2D12]/90 via-black/40 to-transparent",
    imageRing: "ring-2 ring-[#F97316]/40",
    moduleDesc: "text-white/70",
    highlightBorder: "border-[#F97316]/35 bg-gradient-to-br from-[#F97316]/15 to-transparent backdrop-blur-md",
    highlightLabel: "text-[#F97316]",
    journeyActive: "bg-[#F97316] text-white shadow-md",
    journeyIdle: "bg-white/5 text-white/70 ring-1 ring-white/10 hover:ring-[#F97316]/40",
    pricingCard: "border-[#F97316]/30 bg-white/[0.04] hover:border-[#F97316]/55",
    ctaGradient: "from-[#7C2D12] to-black",
    ctaText: "text-white/75",
    ctaBtn: "bg-[#F97316] text-white hover:brightness-110 shadow-[0_12px_40px_-12px_#F9731699]",
    ctaBtnOutline: "border-[#F97316]/50 text-white hover:bg-[#F97316]/15",
    crossCard: "from-[#7C2D12] to-black",
    navCta: "bg-[#F97316] hover:brightness-110",
    navLink: "font-medium text-[#F97316] hover:text-white",
    pricingAccent: "bg-[#F97316]",
    exploreCard: "border-[#F97316]/30 ring-1 ring-[#F97316]/15 hover:border-[#F97316]/55",
    exploreBadge: "bg-[#F97316] text-white",
    demoTabActive: "bg-[#F97316]/30",
    screenBg: "bg-black",
    screenSurface: "bg-[#121212]",
    screenMuted: "bg-[#0a0a0a]",
    accentBar: "bg-gradient-to-r from-[#7C2D12] to-[#F97316]",
    chip: "bg-white/5 border border-[#F97316]/35 text-white/80",
    chipHighlight: "bg-[#F97316] text-white border-[#F97316]",
    moduleCard: "bg-white/[0.04] border-l-[3px] border-l-[#F97316] border border-[#F97316]/25",
    actionTile: "bg-white/5 border border-[#F97316]/40 text-white",
    actionTileActive: "bg-[#F97316] text-white border-[#F97316]",
    tabBar: "bg-[#111] border-t border-[#F97316]/25",
    tabInactive: "text-[#F97316]/45",
    tabActive: "text-[#F97316]",
  },
  pro_joueur: {
    pageHeaderAccent: "joueur",
    brandAccent: "#E8B923",
    brandDeep: "#B8941F",
    pulseStroke: "#E8B923",
    pulseSliderAccent: "accent-[#E8B923]",
    softSectionBg: "bg-black",
    verificationSectionBg: "bg-[#050505]",
    verificationTitle: "text-white",
    ambientWash: "radial-gradient(ellipse 80% 55% at 10% 0%, #E8B92340, transparent 55%), radial-gradient(ellipse 60% 45% at 90% 20%, #B8941F66, transparent 50%)",
    moduleActive: "border-[#E8B923]/60 bg-[#E8B923]/25 text-white shadow-lg",
    moduleIdle: "border-[#E8B923]/25 bg-white/[0.04] hover:border-[#E8B923]/55 hover:bg-[#E8B923]/10",
    moduleRing: "ring-2 ring-[#E8B923]/35",
    imageGradient: "from-[#B8941F]/90 via-black/40 to-transparent",
    imageRing: "ring-2 ring-[#E8B923]/40",
    moduleDesc: "text-white/70",
    highlightBorder: "border-[#E8B923]/35 bg-gradient-to-br from-[#E8B923]/15 to-transparent backdrop-blur-md",
    highlightLabel: "text-[#F5D04A]",
    journeyActive: "bg-[#E8B923] text-white shadow-md",
    journeyIdle: "bg-white/5 text-white/70 ring-1 ring-white/10 hover:ring-[#E8B923]/40",
    pricingCard: "border-[#E8B923]/30 bg-white/[0.04] hover:border-[#E8B923]/55",
    ctaGradient: "from-[#B8941F] to-black",
    ctaText: "text-white/75",
    ctaBtn: "bg-[#E8B923] text-white hover:brightness-110 shadow-[0_12px_40px_-12px_#E8B92399]",
    ctaBtnOutline: "border-[#E8B923]/50 text-white hover:bg-[#E8B923]/15",
    crossCard: "from-[#B8941F] to-black",
    navCta: "bg-[#E8B923] hover:brightness-110",
    navLink: "font-medium text-[#F5D04A] hover:text-white",
    pricingAccent: "bg-[#E8B923]",
    exploreCard: "border-[#E8B923]/30 ring-1 ring-[#E8B923]/15 hover:border-[#E8B923]/55",
    exploreBadge: "bg-[#E8B923] text-white",
    demoTabActive: "bg-[#E8B923]/30",
    screenBg: "bg-black",
    screenSurface: "bg-[#121212]",
    screenMuted: "bg-[#0a0a0a]",
    accentBar: "bg-gradient-to-r from-[#B8941F] to-[#E8B923]",
    chip: "bg-white/5 border border-[#E8B923]/35 text-white/80",
    chipHighlight: "bg-[#E8B923] text-white border-[#E8B923]",
    moduleCard: "bg-white/[0.04] border-l-[3px] border-l-[#E8B923] border border-[#E8B923]/25",
    actionTile: "bg-white/5 border border-[#E8B923]/40 text-white",
    actionTileActive: "bg-[#E8B923] text-white border-[#E8B923]",
    tabBar: "bg-[#111] border-t border-[#E8B923]/25",
    tabInactive: "text-[#F5D04A]/45",
    tabActive: "text-[#F5D04A]",
  },
  pro_club: {
    pageHeaderAccent: "pro_club",
    brandAccent: "#7C3AED",
    brandDeep: "#3B0764",
    pulseStroke: "#7C3AED",
    pulseSliderAccent: "accent-[#7C3AED]",
    softSectionBg: "bg-black",
    verificationSectionBg: "bg-[#050505]",
    verificationTitle: "text-white",
    ambientWash: "radial-gradient(ellipse 80% 55% at 10% 0%, #7C3AED40, transparent 55%), radial-gradient(ellipse 60% 45% at 90% 20%, #3B076466, transparent 50%)",
    moduleActive: "border-[#7C3AED]/60 bg-[#7C3AED]/25 text-white shadow-lg",
    moduleIdle: "border-[#7C3AED]/25 bg-white/[0.04] hover:border-[#7C3AED]/55 hover:bg-[#7C3AED]/10",
    moduleRing: "ring-2 ring-[#7C3AED]/35",
    imageGradient: "from-[#3B0764]/90 via-black/40 to-transparent",
    imageRing: "ring-2 ring-[#7C3AED]/40",
    moduleDesc: "text-white/70",
    highlightBorder: "border-[#7C3AED]/35 bg-gradient-to-br from-[#7C3AED]/15 to-transparent backdrop-blur-md",
    highlightLabel: "text-[#7C3AED]",
    journeyActive: "bg-[#7C3AED] text-white shadow-md",
    journeyIdle: "bg-white/5 text-white/70 ring-1 ring-white/10 hover:ring-[#7C3AED]/40",
    pricingCard: "border-[#7C3AED]/30 bg-white/[0.04] hover:border-[#7C3AED]/55",
    ctaGradient: "from-[#3B0764] to-black",
    ctaText: "text-white/75",
    ctaBtn: "bg-[#7C3AED] text-white hover:brightness-110 shadow-[0_12px_40px_-12px_#7C3AED99]",
    ctaBtnOutline: "border-[#7C3AED]/50 text-white hover:bg-[#7C3AED]/15",
    crossCard: "from-[#3B0764] to-black",
    navCta: "bg-[#7C3AED] hover:brightness-110",
    navLink: "font-medium text-[#7C3AED] hover:text-white",
    pricingAccent: "bg-[#7C3AED]",
    exploreCard: "border-[#7C3AED]/30 ring-1 ring-[#7C3AED]/15 hover:border-[#7C3AED]/55",
    exploreBadge: "bg-[#7C3AED] text-white",
    demoTabActive: "bg-[#7C3AED]/30",
    screenBg: "bg-black",
    screenSurface: "bg-[#121212]",
    screenMuted: "bg-[#0a0a0a]",
    accentBar: "bg-gradient-to-r from-[#3B0764] to-[#7C3AED]",
    chip: "bg-white/5 border border-[#7C3AED]/35 text-white/80",
    chipHighlight: "bg-[#7C3AED] text-white border-[#7C3AED]",
    moduleCard: "bg-white/[0.04] border-l-[3px] border-l-[#7C3AED] border border-[#7C3AED]/25",
    actionTile: "bg-white/5 border border-[#7C3AED]/40 text-white",
    actionTileActive: "bg-[#7C3AED] text-white border-[#7C3AED]",
    tabBar: "bg-[#111] border-t border-[#7C3AED]/25",
    tabInactive: "text-[#7C3AED]/45",
    tabActive: "text-[#7C3AED]",
  },
  pro_staff: {
    pageHeaderAccent: "pro_staff",
    brandAccent: "#22C55E",
    brandDeep: "#14532D",
    pulseStroke: "#22C55E",
    pulseSliderAccent: "accent-[#22C55E]",
    softSectionBg: "bg-black",
    verificationSectionBg: "bg-[#050505]",
    verificationTitle: "text-white",
    ambientWash: "radial-gradient(ellipse 80% 55% at 10% 0%, #22C55E40, transparent 55%), radial-gradient(ellipse 60% 45% at 90% 20%, #14532D66, transparent 50%)",
    moduleActive: "border-[#22C55E]/60 bg-[#22C55E]/25 text-white shadow-lg",
    moduleIdle: "border-[#22C55E]/25 bg-white/[0.04] hover:border-[#22C55E]/55 hover:bg-[#22C55E]/10",
    moduleRing: "ring-2 ring-[#22C55E]/35",
    imageGradient: "from-[#14532D]/90 via-black/40 to-transparent",
    imageRing: "ring-2 ring-[#22C55E]/40",
    moduleDesc: "text-white/70",
    highlightBorder: "border-[#22C55E]/35 bg-gradient-to-br from-[#22C55E]/15 to-transparent backdrop-blur-md",
    highlightLabel: "text-[#22C55E]",
    journeyActive: "bg-[#22C55E] text-white shadow-md",
    journeyIdle: "bg-white/5 text-white/70 ring-1 ring-white/10 hover:ring-[#22C55E]/40",
    pricingCard: "border-[#22C55E]/30 bg-white/[0.04] hover:border-[#22C55E]/55",
    ctaGradient: "from-[#14532D] to-black",
    ctaText: "text-white/75",
    ctaBtn: "bg-[#22C55E] text-white hover:brightness-110 shadow-[0_12px_40px_-12px_#22C55E99]",
    ctaBtnOutline: "border-[#22C55E]/50 text-white hover:bg-[#22C55E]/15",
    crossCard: "from-[#14532D] to-black",
    navCta: "bg-[#22C55E] hover:brightness-110",
    navLink: "font-medium text-[#22C55E] hover:text-white",
    pricingAccent: "bg-[#22C55E]",
    exploreCard: "border-[#22C55E]/30 ring-1 ring-[#22C55E]/15 hover:border-[#22C55E]/55",
    exploreBadge: "bg-[#22C55E] text-white",
    demoTabActive: "bg-[#22C55E]/30",
    screenBg: "bg-black",
    screenSurface: "bg-[#121212]",
    screenMuted: "bg-[#0a0a0a]",
    accentBar: "bg-gradient-to-r from-[#14532D] to-[#22C55E]",
    chip: "bg-white/5 border border-[#22C55E]/35 text-white/80",
    chipHighlight: "bg-[#22C55E] text-white border-[#22C55E]",
    moduleCard: "bg-white/[0.04] border-l-[3px] border-l-[#22C55E] border border-[#22C55E]/25",
    actionTile: "bg-white/5 border border-[#22C55E]/40 text-white",
    actionTileActive: "bg-[#22C55E] text-white border-[#22C55E]",
    tabBar: "bg-[#111] border-t border-[#22C55E]/25",
    tabInactive: "text-[#22C55E]/45",
    tabActive: "text-[#22C55E]",
  }
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
      logo: "/branding/logo-proday-mark-sponsor.png",
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
  if (line === "amateur") {
    return { name: AMATEUR_BRAND.name, logo: AMATEUR_BRAND.logo, theme: UNIVERSE_THEME.amateur };
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
