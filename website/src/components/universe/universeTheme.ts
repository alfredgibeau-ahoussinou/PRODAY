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
    brandAccent: "#0054F0",
    brandDeep: "#001854",
    pulseStroke: "#0054F0",
    pulseSliderAccent: "accent-[#0054F0]",
    softSectionBg: "bg-black",
    verificationSectionBg: "bg-[#050505]",
    verificationTitle: "text-white",
    ambientWash: "radial-gradient(ellipse 80% 55% at 10% 0%, #0054F040, transparent 55%), radial-gradient(ellipse 60% 45% at 90% 20%, #00185466, transparent 50%)",
    moduleActive: "border-[#0054F0]/60 bg-[#0054F0]/25 text-white shadow-lg",
    moduleIdle: "border-[#0054F0]/25 bg-white/[0.04] hover:border-[#0054F0]/55 hover:bg-[#0054F0]/10",
    moduleRing: "ring-2 ring-[#0054F0]/35",
    imageGradient: "from-[#001854]/90 via-black/40 to-transparent",
    imageRing: "ring-2 ring-[#0054F0]/40",
    moduleDesc: "text-white/70",
    highlightBorder: "border-[#0054F0]/35 bg-gradient-to-br from-[#0054F0]/15 to-transparent backdrop-blur-md",
    highlightLabel: "text-[#0054F0]",
    journeyActive: "bg-[#0054F0] text-white shadow-md",
    journeyIdle: "bg-white/5 text-white/70 ring-1 ring-white/10 hover:ring-[#0054F0]/40",
    pricingCard: "border-[#0054F0]/30 bg-white/[0.04] hover:border-[#0054F0]/55",
    ctaGradient: "from-[#001854] to-black",
    ctaText: "text-white/75",
    ctaBtn: "bg-[#0054F0] text-white hover:brightness-110 shadow-[0_12px_40px_-12px_#0054F099]",
    ctaBtnOutline: "border-[#0054F0]/50 text-white hover:bg-[#0054F0]/15",
    crossCard: "from-[#001854] to-black",
    navCta: "bg-[#0054F0] hover:brightness-110",
    navLink: "font-medium text-[#0054F0] hover:text-white",
    pricingAccent: "bg-[#0054F0]",
    exploreCard: "border-[#0054F0]/30 ring-1 ring-[#0054F0]/15 hover:border-[#0054F0]/55",
    exploreBadge: "bg-[#0054F0] text-white",
    demoTabActive: "bg-[#0054F0]/30",
    screenBg: "bg-black",
    screenSurface: "bg-[#121212]",
    screenMuted: "bg-[#0a0a0a]",
    accentBar: "bg-gradient-to-r from-[#001854] to-[#0054F0]",
    chip: "bg-white/5 border border-[#0054F0]/35 text-white/80",
    chipHighlight: "bg-[#0054F0] text-white border-[#0054F0]",
    moduleCard: "bg-white/[0.04] border-l-[3px] border-l-[#0054F0] border border-[#0054F0]/25",
    actionTile: "bg-white/5 border border-[#0054F0]/40 text-white",
    actionTileActive: "bg-[#0054F0] text-white border-[#0054F0]",
    tabBar: "bg-[#111] border-t border-[#0054F0]/25",
    tabInactive: "text-[#0054F0]/45",
    tabActive: "text-[#0054F0]",
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
    brandAccent: "#3C00F0",
    brandDeep: "#180078",
    pulseStroke: "#3C00F0",
    pulseSliderAccent: "accent-[#3C00F0]",
    softSectionBg: "bg-black",
    verificationSectionBg: "bg-[#050505]",
    verificationTitle: "text-white",
    ambientWash: "radial-gradient(ellipse 80% 55% at 10% 0%, #3C00F040, transparent 55%), radial-gradient(ellipse 60% 45% at 90% 20%, #18007866, transparent 50%)",
    moduleActive: "border-[#3C00F0]/60 bg-[#3C00F0]/25 text-white shadow-lg",
    moduleIdle: "border-[#3C00F0]/25 bg-white/[0.04] hover:border-[#3C00F0]/55 hover:bg-[#3C00F0]/10",
    moduleRing: "ring-2 ring-[#3C00F0]/35",
    imageGradient: "from-[#180078]/90 via-black/40 to-transparent",
    imageRing: "ring-2 ring-[#3C00F0]/40",
    moduleDesc: "text-white/70",
    highlightBorder: "border-[#3C00F0]/35 bg-gradient-to-br from-[#3C00F0]/15 to-transparent backdrop-blur-md",
    highlightLabel: "text-[#3C00F0]",
    journeyActive: "bg-[#3C00F0] text-white shadow-md",
    journeyIdle: "bg-white/5 text-white/70 ring-1 ring-white/10 hover:ring-[#3C00F0]/40",
    pricingCard: "border-[#3C00F0]/30 bg-white/[0.04] hover:border-[#3C00F0]/55",
    ctaGradient: "from-[#180078] to-black",
    ctaText: "text-white/75",
    ctaBtn: "bg-[#3C00F0] text-white hover:brightness-110 shadow-[0_12px_40px_-12px_#3C00F099]",
    ctaBtnOutline: "border-[#3C00F0]/50 text-white hover:bg-[#3C00F0]/15",
    crossCard: "from-[#180078] to-black",
    navCta: "bg-[#3C00F0] hover:brightness-110",
    navLink: "font-medium text-[#3C00F0] hover:text-white",
    pricingAccent: "bg-[#3C00F0]",
    exploreCard: "border-[#3C00F0]/30 ring-1 ring-[#3C00F0]/15 hover:border-[#3C00F0]/55",
    exploreBadge: "bg-[#3C00F0] text-white",
    demoTabActive: "bg-[#3C00F0]/30",
    screenBg: "bg-black",
    screenSurface: "bg-[#121212]",
    screenMuted: "bg-[#0a0a0a]",
    accentBar: "bg-gradient-to-r from-[#180078] to-[#3C00F0]",
    chip: "bg-white/5 border border-[#3C00F0]/35 text-white/80",
    chipHighlight: "bg-[#3C00F0] text-white border-[#3C00F0]",
    moduleCard: "bg-white/[0.04] border-l-[3px] border-l-[#3C00F0] border border-[#3C00F0]/25",
    actionTile: "bg-white/5 border border-[#3C00F0]/40 text-white",
    actionTileActive: "bg-[#3C00F0] text-white border-[#3C00F0]",
    tabBar: "bg-[#111] border-t border-[#3C00F0]/25",
    tabInactive: "text-[#3C00F0]/45",
    tabActive: "text-[#3C00F0]",
  },
  pro: {
    pageHeaderAccent: "pro",
    brandAccent: "#006CFC",
    brandDeep: "#002478",
    pulseStroke: "#006CFC",
    pulseSliderAccent: "accent-[#006CFC]",
    softSectionBg: "bg-black",
    verificationSectionBg: "bg-[#050505]",
    verificationTitle: "text-white",
    ambientWash: "radial-gradient(ellipse 80% 55% at 10% 0%, #006CFC40, transparent 55%), radial-gradient(ellipse 60% 45% at 90% 20%, #00247866, transparent 50%)",
    moduleActive: "border-[#006CFC]/60 bg-[#006CFC]/25 text-white shadow-lg",
    moduleIdle: "border-[#006CFC]/25 bg-white/[0.04] hover:border-[#006CFC]/55 hover:bg-[#006CFC]/10",
    moduleRing: "ring-2 ring-[#006CFC]/35",
    imageGradient: "from-[#002478]/90 via-black/40 to-transparent",
    imageRing: "ring-2 ring-[#006CFC]/40",
    moduleDesc: "text-white/70",
    highlightBorder: "border-[#006CFC]/35 bg-gradient-to-br from-[#006CFC]/15 to-transparent backdrop-blur-md",
    highlightLabel: "text-[#006CFC]",
    journeyActive: "bg-[#006CFC] text-white shadow-md",
    journeyIdle: "bg-white/5 text-white/70 ring-1 ring-white/10 hover:ring-[#006CFC]/40",
    pricingCard: "border-[#006CFC]/30 bg-white/[0.04] hover:border-[#006CFC]/55",
    ctaGradient: "from-[#002478] to-black",
    ctaText: "text-white/75",
    ctaBtn: "bg-white text-black hover:bg-white/90",
    ctaBtnOutline: "border-[#006CFC]/50 text-white hover:bg-[#006CFC]/15",
    crossCard: "from-[#002478] to-black",
    navCta: "bg-[#006CFC] hover:brightness-110",
    navLink: "font-medium text-[#006CFC] hover:text-white",
    pricingAccent: "bg-[#006CFC]",
    exploreCard: "border-[#006CFC]/30 ring-1 ring-[#006CFC]/15 hover:border-[#006CFC]/55",
    exploreBadge: "bg-[#006CFC] text-white",
    demoTabActive: "bg-[#006CFC]/30",
    screenBg: "bg-black",
    screenSurface: "bg-[#121212]",
    screenMuted: "bg-[#0a0a0a]",
    accentBar: "bg-gradient-to-r from-[#002478] to-[#006CFC]",
    chip: "bg-white/5 border border-[#006CFC]/35 text-white/80",
    chipHighlight: "bg-[#006CFC] text-white border-[#006CFC]",
    moduleCard: "bg-white/[0.04] border-l-[3px] border-l-[#006CFC] border border-[#006CFC]/25",
    actionTile: "bg-white/5 border border-[#006CFC]/40 text-white",
    actionTileActive: "bg-[#006CFC] text-white border-[#006CFC]",
    tabBar: "bg-[#111] border-t border-[#006CFC]/25",
    tabInactive: "text-[#006CFC]/45",
    tabActive: "text-[#006CFC]",
  },
  sante: {
    pageHeaderAccent: "sante",
    brandAccent: "#00CCB4",
    brandDeep: "#006C60",
    pulseStroke: "#00CCB4",
    pulseSliderAccent: "accent-[#00CCB4]",
    softSectionBg: "bg-black",
    verificationSectionBg: "bg-[#050505]",
    verificationTitle: "text-white",
    ambientWash: "radial-gradient(ellipse 80% 55% at 10% 0%, #00CCB440, transparent 55%), radial-gradient(ellipse 60% 45% at 90% 20%, #006C6066, transparent 50%)",
    moduleActive: "border-[#00CCB4]/60 bg-[#00CCB4]/25 text-white shadow-lg",
    moduleIdle: "border-[#00CCB4]/25 bg-white/[0.04] hover:border-[#00CCB4]/55 hover:bg-[#00CCB4]/10",
    moduleRing: "ring-2 ring-[#00CCB4]/35",
    imageGradient: "from-[#006C60]/90 via-black/40 to-transparent",
    imageRing: "ring-2 ring-[#00CCB4]/40",
    moduleDesc: "text-white/70",
    highlightBorder: "border-[#00CCB4]/35 bg-gradient-to-br from-[#00CCB4]/15 to-transparent backdrop-blur-md",
    highlightLabel: "text-[#00CCB4]",
    journeyActive: "bg-[#00CCB4] text-white shadow-md",
    journeyIdle: "bg-white/5 text-white/70 ring-1 ring-white/10 hover:ring-[#00CCB4]/40",
    pricingCard: "border-[#00CCB4]/30 bg-white/[0.04] hover:border-[#00CCB4]/55",
    ctaGradient: "from-[#006C60] to-black",
    ctaText: "text-white/75",
    ctaBtn: "bg-[#00CCB4] text-white hover:brightness-110 shadow-[0_12px_40px_-12px_#00CCB499]",
    ctaBtnOutline: "border-[#00CCB4]/50 text-white hover:bg-[#00CCB4]/15",
    crossCard: "from-[#006C60] to-black",
    navCta: "bg-[#00CCB4] hover:brightness-110",
    navLink: "font-medium text-[#00CCB4] hover:text-white",
    pricingAccent: "bg-[#00CCB4]",
    exploreCard: "border-[#00CCB4]/30 ring-1 ring-[#00CCB4]/15 hover:border-[#00CCB4]/55",
    exploreBadge: "bg-[#00CCB4] text-white",
    demoTabActive: "bg-[#00CCB4]/30",
    screenBg: "bg-black",
    screenSurface: "bg-[#121212]",
    screenMuted: "bg-[#0a0a0a]",
    accentBar: "bg-gradient-to-r from-[#006C60] to-[#00CCB4]",
    chip: "bg-white/5 border border-[#00CCB4]/35 text-white/80",
    chipHighlight: "bg-[#00CCB4] text-white border-[#00CCB4]",
    moduleCard: "bg-white/[0.04] border-l-[3px] border-l-[#00CCB4] border border-[#00CCB4]/25",
    actionTile: "bg-white/5 border border-[#00CCB4]/40 text-white",
    actionTileActive: "bg-[#00CCB4] text-white border-[#00CCB4]",
    tabBar: "bg-[#111] border-t border-[#00CCB4]/25",
    tabInactive: "text-[#00CCB4]/45",
    tabActive: "text-[#00CCB4]",
  },
  pro_joueur: {
    pageHeaderAccent: "joueur",
    brandAccent: "#0054F0",
    brandDeep: "#001854",
    pulseStroke: "#0054F0",
    pulseSliderAccent: "accent-[#0054F0]",
    softSectionBg: "bg-black",
    verificationSectionBg: "bg-[#050505]",
    verificationTitle: "text-white",
    ambientWash: "radial-gradient(ellipse 80% 55% at 10% 0%, #0054F040, transparent 55%), radial-gradient(ellipse 60% 45% at 90% 20%, #00185466, transparent 50%)",
    moduleActive: "border-[#0054F0]/60 bg-[#0054F0]/25 text-white shadow-lg",
    moduleIdle: "border-[#0054F0]/25 bg-white/[0.04] hover:border-[#0054F0]/55 hover:bg-[#0054F0]/10",
    moduleRing: "ring-2 ring-[#0054F0]/35",
    imageGradient: "from-[#001854]/90 via-black/40 to-transparent",
    imageRing: "ring-2 ring-[#0054F0]/40",
    moduleDesc: "text-white/70",
    highlightBorder: "border-[#0054F0]/35 bg-gradient-to-br from-[#0054F0]/15 to-transparent backdrop-blur-md",
    highlightLabel: "text-[#0054F0]",
    journeyActive: "bg-[#0054F0] text-white shadow-md",
    journeyIdle: "bg-white/5 text-white/70 ring-1 ring-white/10 hover:ring-[#0054F0]/40",
    pricingCard: "border-[#0054F0]/30 bg-white/[0.04] hover:border-[#0054F0]/55",
    ctaGradient: "from-[#001854] to-black",
    ctaText: "text-white/75",
    ctaBtn: "bg-[#0054F0] text-white hover:brightness-110 shadow-[0_12px_40px_-12px_#0054F099]",
    ctaBtnOutline: "border-[#0054F0]/50 text-white hover:bg-[#0054F0]/15",
    crossCard: "from-[#001854] to-black",
    navCta: "bg-[#0054F0] hover:brightness-110",
    navLink: "font-medium text-[#0054F0] hover:text-white",
    pricingAccent: "bg-[#0054F0]",
    exploreCard: "border-[#0054F0]/30 ring-1 ring-[#0054F0]/15 hover:border-[#0054F0]/55",
    exploreBadge: "bg-[#0054F0] text-white",
    demoTabActive: "bg-[#0054F0]/30",
    screenBg: "bg-black",
    screenSurface: "bg-[#121212]",
    screenMuted: "bg-[#0a0a0a]",
    accentBar: "bg-gradient-to-r from-[#001854] to-[#0054F0]",
    chip: "bg-white/5 border border-[#0054F0]/35 text-white/80",
    chipHighlight: "bg-[#0054F0] text-white border-[#0054F0]",
    moduleCard: "bg-white/[0.04] border-l-[3px] border-l-[#0054F0] border border-[#0054F0]/25",
    actionTile: "bg-white/5 border border-[#0054F0]/40 text-white",
    actionTileActive: "bg-[#0054F0] text-white border-[#0054F0]",
    tabBar: "bg-[#111] border-t border-[#0054F0]/25",
    tabInactive: "text-[#0054F0]/45",
    tabActive: "text-[#0054F0]",
  },
  pro_club: {
    pageHeaderAccent: "pro_club",
    brandAccent: "#006CFC",
    brandDeep: "#002478",
    pulseStroke: "#006CFC",
    pulseSliderAccent: "accent-[#006CFC]",
    softSectionBg: "bg-black",
    verificationSectionBg: "bg-[#050505]",
    verificationTitle: "text-white",
    ambientWash: "radial-gradient(ellipse 80% 55% at 10% 0%, #006CFC40, transparent 55%), radial-gradient(ellipse 60% 45% at 90% 20%, #00247866, transparent 50%)",
    moduleActive: "border-[#006CFC]/60 bg-[#006CFC]/25 text-white shadow-lg",
    moduleIdle: "border-[#006CFC]/25 bg-white/[0.04] hover:border-[#006CFC]/55 hover:bg-[#006CFC]/10",
    moduleRing: "ring-2 ring-[#006CFC]/35",
    imageGradient: "from-[#002478]/90 via-black/40 to-transparent",
    imageRing: "ring-2 ring-[#006CFC]/40",
    moduleDesc: "text-white/70",
    highlightBorder: "border-[#006CFC]/35 bg-gradient-to-br from-[#006CFC]/15 to-transparent backdrop-blur-md",
    highlightLabel: "text-[#006CFC]",
    journeyActive: "bg-[#006CFC] text-white shadow-md",
    journeyIdle: "bg-white/5 text-white/70 ring-1 ring-white/10 hover:ring-[#006CFC]/40",
    pricingCard: "border-[#006CFC]/30 bg-white/[0.04] hover:border-[#006CFC]/55",
    ctaGradient: "from-[#002478] to-black",
    ctaText: "text-white/75",
    ctaBtn: "bg-[#006CFC] text-white hover:brightness-110 shadow-[0_12px_40px_-12px_#006CFC99]",
    ctaBtnOutline: "border-[#006CFC]/50 text-white hover:bg-[#006CFC]/15",
    crossCard: "from-[#002478] to-black",
    navCta: "bg-[#006CFC] hover:brightness-110",
    navLink: "font-medium text-[#006CFC] hover:text-white",
    pricingAccent: "bg-[#006CFC]",
    exploreCard: "border-[#006CFC]/30 ring-1 ring-[#006CFC]/15 hover:border-[#006CFC]/55",
    exploreBadge: "bg-[#006CFC] text-white",
    demoTabActive: "bg-[#006CFC]/30",
    screenBg: "bg-black",
    screenSurface: "bg-[#121212]",
    screenMuted: "bg-[#0a0a0a]",
    accentBar: "bg-gradient-to-r from-[#002478] to-[#006CFC]",
    chip: "bg-white/5 border border-[#006CFC]/35 text-white/80",
    chipHighlight: "bg-[#006CFC] text-white border-[#006CFC]",
    moduleCard: "bg-white/[0.04] border-l-[3px] border-l-[#006CFC] border border-[#006CFC]/25",
    actionTile: "bg-white/5 border border-[#006CFC]/40 text-white",
    actionTileActive: "bg-[#006CFC] text-white border-[#006CFC]",
    tabBar: "bg-[#111] border-t border-[#006CFC]/25",
    tabInactive: "text-[#006CFC]/45",
    tabActive: "text-[#006CFC]",
  },
  pro_staff: {
    pageHeaderAccent: "pro_staff",
    brandAccent: "#3B5BFF",
    brandDeep: "#001848",
    pulseStroke: "#3B5BFF",
    pulseSliderAccent: "accent-[#3B5BFF]",
    softSectionBg: "bg-black",
    verificationSectionBg: "bg-[#050505]",
    verificationTitle: "text-white",
    ambientWash: "radial-gradient(ellipse 80% 55% at 10% 0%, #3B5BFF40, transparent 55%), radial-gradient(ellipse 60% 45% at 90% 20%, #00184866, transparent 50%)",
    moduleActive: "border-[#3B5BFF]/60 bg-[#3B5BFF]/25 text-white shadow-lg",
    moduleIdle: "border-[#3B5BFF]/25 bg-white/[0.04] hover:border-[#3B5BFF]/55 hover:bg-[#3B5BFF]/10",
    moduleRing: "ring-2 ring-[#3B5BFF]/35",
    imageGradient: "from-[#001848]/90 via-black/40 to-transparent",
    imageRing: "ring-2 ring-[#3B5BFF]/40",
    moduleDesc: "text-white/70",
    highlightBorder: "border-[#3B5BFF]/35 bg-gradient-to-br from-[#3B5BFF]/15 to-transparent backdrop-blur-md",
    highlightLabel: "text-[#3B5BFF]",
    journeyActive: "bg-[#3B5BFF] text-white shadow-md",
    journeyIdle: "bg-white/5 text-white/70 ring-1 ring-white/10 hover:ring-[#3B5BFF]/40",
    pricingCard: "border-[#3B5BFF]/30 bg-white/[0.04] hover:border-[#3B5BFF]/55",
    ctaGradient: "from-[#001848] to-black",
    ctaText: "text-white/75",
    ctaBtn: "bg-[#3B5BFF] text-white hover:brightness-110 shadow-[0_12px_40px_-12px_#3B5BFF99]",
    ctaBtnOutline: "border-[#3B5BFF]/50 text-white hover:bg-[#3B5BFF]/15",
    crossCard: "from-[#001848] to-black",
    navCta: "bg-[#3B5BFF] hover:brightness-110",
    navLink: "font-medium text-[#3B5BFF] hover:text-white",
    pricingAccent: "bg-[#3B5BFF]",
    exploreCard: "border-[#3B5BFF]/30 ring-1 ring-[#3B5BFF]/15 hover:border-[#3B5BFF]/55",
    exploreBadge: "bg-[#3B5BFF] text-white",
    demoTabActive: "bg-[#3B5BFF]/30",
    screenBg: "bg-black",
    screenSurface: "bg-[#121212]",
    screenMuted: "bg-[#0a0a0a]",
    accentBar: "bg-gradient-to-r from-[#001848] to-[#3B5BFF]",
    chip: "bg-white/5 border border-[#3B5BFF]/35 text-white/80",
    chipHighlight: "bg-[#3B5BFF] text-white border-[#3B5BFF]",
    moduleCard: "bg-white/[0.04] border-l-[3px] border-l-[#3B5BFF] border border-[#3B5BFF]/25",
    actionTile: "bg-white/5 border border-[#3B5BFF]/40 text-white",
    actionTileActive: "bg-[#3B5BFF] text-white border-[#3B5BFF]",
    tabBar: "bg-[#111] border-t border-[#3B5BFF]/25",
    tabInactive: "text-[#3B5BFF]/45",
    tabActive: "text-[#3B5BFF]",
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
