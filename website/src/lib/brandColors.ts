/**
 * Identité officielle ProDay — source de vérité website.
 * Production : bleu master #1E3AFF. Experimental : or/noir rebrand.
 */

import { isExperimentalBrand } from "./experimentalBrand";

function rgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Master Brand — production (bleu). */
const PROD_OFFICIAL_BRAND = {
  black: "#000000",
  ink: "#0A0A0A",
  white: "#FFFFFF",
  accent: "#1E3AFF",
  bright: "#5B75FF",
  deep: "#0A1A8A",
  navy: "#050B33",
  gradient: "linear-gradient(135deg, #0A1A8A 0%, #1E3AFF 48%, #5B75FF 100%)",
} as const;

/** Master Brand — experimental (or/noir). */
const EXP_OFFICIAL_BRAND = {
  black: "#000000",
  ink: "#0A0A0A",
  white: "#FFFFFF",
  accent: "#E8B923",
  bright: "#F5D04A",
  deep: "#B8941F",
  navy: "#0A0A0A",
  gradient: "linear-gradient(135deg, #B8941F 0%, #E8B923 48%, #F5D04A 100%)",
} as const;

/** Master Brand actif selon le build. */
export const OFFICIAL_BRAND = isExperimentalBrand() ? EXP_OFFICIAL_BRAND : PROD_OFFICIAL_BRAND;

const PROD_POLE_ACCENT_HEX = {
  joueur: "#1E3AFF",
  coach: "#22C55E",
  club: "#7C3AED",
  president: "#FBBF24",
  parent: "#F97316",
  supporter: "#06B6D4",
  sponsor: "#EF4444",
  admin: "#A3A3A3",
  evenements: "#1E3AFF",
} as const;

const EXP_POLE_ACCENT_HEX = {
  joueur: "#FFFFFF",
  coach: "#E8B923",
  club: "#2563EB",
  president: "#E8B923",
  parent: "#84CC16",
  supporter: "#8B5CF6",
  sponsor: "#EF4444",
  admin: "#A3A3A3",
  evenements: "#F97316",
} as const;

/** Accents officiels par pôle (symbole inchangé). */
export const POLE_ACCENT_HEX = isExperimentalBrand() ? EXP_POLE_ACCENT_HEX : PROD_POLE_ACCENT_HEX;

export type OfficialPoleAccent = keyof typeof POLE_ACCENT_HEX;

function polePalette(accent: string, deep: string) {
  return {
    deep,
    accent,
    soft: rgba(accent, 0.14),
    glow: rgba(accent, 0.35),
  } as const;
}

const PROD_POLE_BRAND_COLORS = {
  joueur: polePalette(PROD_POLE_ACCENT_HEX.joueur, "#0A1A8A"),
  amateur: polePalette(PROD_POLE_ACCENT_HEX.joueur, "#0A1A8A"),
  pro_joueur: polePalette(PROD_POLE_ACCENT_HEX.joueur, "#0A1A8A"),
  homme: polePalette(PROD_POLE_ACCENT_HEX.joueur, "#0A1A8A"),
  coach: polePalette(PROD_POLE_ACCENT_HEX.coach, "#14532D"),
  pro_staff: polePalette(PROD_POLE_ACCENT_HEX.coach, "#14532D"),
  pro_club: polePalette(PROD_POLE_ACCENT_HEX.club, "#3B0764"),
  club: polePalette(PROD_POLE_ACCENT_HEX.club, "#3B0764"),
  president: polePalette(PROD_POLE_ACCENT_HEX.president, "#78350F"),
  parent: polePalette(PROD_POLE_ACCENT_HEX.parent, "#7C2D12"),
  supporter: polePalette(PROD_POLE_ACCENT_HEX.supporter, "#164E63"),
  sponsor: polePalette(PROD_POLE_ACCENT_HEX.sponsor, "#7F1D1D"),
  admin: polePalette(PROD_POLE_ACCENT_HEX.admin, "#404040"),
  evenements: polePalette(PROD_POLE_ACCENT_HEX.evenements, "#0A1A8A"),
  sante: polePalette(PROD_POLE_ACCENT_HEX.parent, "#7C2D12"),
  woman: polePalette(PROD_POLE_ACCENT_HEX.joueur, "#0A1A8A"),
} as const;

const EXP_POLE_BRAND_COLORS = {
  joueur: polePalette(EXP_POLE_ACCENT_HEX.joueur, "#CCCCCC"),
  amateur: polePalette(EXP_POLE_ACCENT_HEX.joueur, "#CCCCCC"),
  pro_joueur: polePalette(EXP_POLE_ACCENT_HEX.joueur, "#CCCCCC"),
  homme: polePalette(EXP_POLE_ACCENT_HEX.joueur, "#CCCCCC"),
  coach: polePalette(EXP_POLE_ACCENT_HEX.coach, "#92700C"),
  pro_staff: polePalette(EXP_POLE_ACCENT_HEX.coach, "#92700C"),
  pro_club: polePalette(EXP_POLE_ACCENT_HEX.club, "#1E40AF"),
  club: polePalette(EXP_POLE_ACCENT_HEX.club, "#1E40AF"),
  president: polePalette(EXP_POLE_ACCENT_HEX.president, "#92700C"),
  parent: polePalette(EXP_POLE_ACCENT_HEX.parent, "#4D7C0F"),
  supporter: polePalette(EXP_POLE_ACCENT_HEX.supporter, "#5B21B6"),
  sponsor: polePalette(EXP_POLE_ACCENT_HEX.sponsor, "#991B1B"),
  admin: polePalette(EXP_POLE_ACCENT_HEX.admin, "#404040"),
  evenements: polePalette(EXP_POLE_ACCENT_HEX.evenements, "#C2410C"),
  sante: polePalette(EXP_POLE_ACCENT_HEX.parent, "#4D7C0F"),
  woman: polePalette(EXP_POLE_ACCENT_HEX.joueur, "#CCCCCC"),
} as const;

/** Accents par pôle + alias legacy (vitrine / univers). */
export const POLE_BRAND_COLORS = isExperimentalBrand() ? EXP_POLE_BRAND_COLORS : PROD_POLE_BRAND_COLORS;

export type PoleBrandKey = keyof typeof POLE_BRAND_COLORS;

/** Resolve official pole palette from a page accent / pole id. */
export function getPoleBrandColors(
  key: string | null | undefined,
): (typeof POLE_BRAND_COLORS)[PoleBrandKey] {
  if (!key) return POLE_BRAND_COLORS.joueur;
  if (key === "pro" || key === "default") return POLE_BRAND_COLORS.joueur;
  if (
    key === "confiance" ||
    key === "fonctionnalites" ||
    key === "demo" ||
    key === "beta" ||
    key === "faq" ||
    key === "tarifs"
  ) {
    return isExperimentalBrand() ? POLE_BRAND_COLORS.coach : POLE_BRAND_COLORS.joueur;
  }
  if (key in POLE_BRAND_COLORS) {
    return POLE_BRAND_COLORS[key as PoleBrandKey];
  }
  return POLE_BRAND_COLORS.joueur;
}

/** CSS variables for a pole page (overrides SiteShell master accent). */
export function poleAccentCssVars(
  key: string | null | undefined,
): Record<string, string> {
  const c = getPoleBrandColors(key);
  return {
    "--pole-accent": c.accent,
    "--pole-accent-deep": c.deep,
    "--pole-accent-soft": c.soft,
    "--pole-accent-glow": c.glow,
    "--proday-accent": c.accent,
    "--proday-accent-bright": c.accent === POLE_ACCENT_HEX.joueur && isExperimentalBrand() ? "#FFFFFF" : c.accent,
    "--proday-accent-dim": c.deep,
    "--proday-accent-deep": c.deep,
    "--proday-accent-glow": c.glow,
    "--proday-accent-muted": c.soft,
    "--proday-accent-gradient": `linear-gradient(135deg, ${c.deep} 0%, ${c.accent} 100%)`,
  };
}

/** Variables CSS master (shell par défaut). */
export const MASTER_ACCENT_CSS_VARS: Record<string, string> = {
  "--proday-accent": OFFICIAL_BRAND.accent,
  "--proday-accent-bright": OFFICIAL_BRAND.bright,
  "--proday-accent-deep": OFFICIAL_BRAND.deep,
  "--proday-accent-dim": isExperimentalBrand() ? OFFICIAL_BRAND.deep : "#3B56FF",
  "--proday-accent-glow": rgba(OFFICIAL_BRAND.accent, 0.42),
  "--proday-accent-muted": rgba(OFFICIAL_BRAND.accent, 0.16),
  "--proday-accent-gradient": OFFICIAL_BRAND.gradient,
};
