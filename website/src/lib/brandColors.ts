/**
 * Identité officielle ProDay — source de vérité website.
 * Hex alignés avec l’app (Master + accents pôles). Symbole identique partout.
 */

function rgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Master Brand — noir / blanc / bleu ProDay */
export const OFFICIAL_BRAND = {
  black: "#000000",
  ink: "#0A0A0A",
  white: "#FFFFFF",
  /** Bleu Master ProDay (= Joueur) */
  accent: "#1E3AFF",
  bright: "#5B75FF",
  deep: "#0A1A8A",
  navy: "#050B33",
  gradient: "linear-gradient(135deg, #0A1A8A 0%, #1E3AFF 48%, #5B75FF 100%)",
} as const;

/** Accents officiels par pôle (symbole inchangé). */
export const POLE_ACCENT_HEX = {
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

export type OfficialPoleAccent = keyof typeof POLE_ACCENT_HEX;

function polePalette(accent: string, deep: string) {
  return {
    deep,
    accent,
    soft: rgba(accent, 0.14),
    glow: rgba(accent, 0.35),
  } as const;
}

/** Accents par pôle + alias legacy (vitrine / univers). */
export const POLE_BRAND_COLORS = {
  joueur: polePalette(POLE_ACCENT_HEX.joueur, "#0A1A8A"),
  /** @deprecated → joueur */
  amateur: polePalette(POLE_ACCENT_HEX.joueur, "#0A1A8A"),
  /** @deprecated → joueur */
  pro_joueur: polePalette(POLE_ACCENT_HEX.joueur, "#0A1A8A"),
  homme: polePalette(POLE_ACCENT_HEX.joueur, "#0A1A8A"),
  coach: polePalette(POLE_ACCENT_HEX.coach, "#14532D"),
  pro_staff: polePalette(POLE_ACCENT_HEX.coach, "#14532D"),
  pro_club: polePalette(POLE_ACCENT_HEX.club, "#3B0764"),
  club: polePalette(POLE_ACCENT_HEX.club, "#3B0764"),
  president: polePalette(POLE_ACCENT_HEX.president, "#78350F"),
  parent: polePalette(POLE_ACCENT_HEX.parent, "#7C2D12"),
  supporter: polePalette(POLE_ACCENT_HEX.supporter, "#164E63"),
  sponsor: polePalette(POLE_ACCENT_HEX.sponsor, "#7F1D1D"),
  admin: polePalette(POLE_ACCENT_HEX.admin, "#404040"),
  evenements: polePalette(POLE_ACCENT_HEX.evenements, "#0A1A8A"),
  /** @deprecated — Santé retiré vitrine ; alias parent */
  sante: polePalette(POLE_ACCENT_HEX.parent, "#7C2D12"),
  /** @deprecated — Woman n’est plus un pôle accent séparé */
  woman: polePalette(POLE_ACCENT_HEX.joueur, "#0A1A8A"),
} as const;

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
    return POLE_BRAND_COLORS.joueur;
  }
  if (key in POLE_BRAND_COLORS) {
    return POLE_BRAND_COLORS[key as PoleBrandKey];
  }
  return POLE_BRAND_COLORS.joueur;
}

/** CSS variables for a pole page (overrides SiteShell blues). */
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
    "--proday-accent-bright": c.accent,
    "--proday-accent-dim": c.accent,
    "--proday-accent-deep": c.deep,
    "--proday-accent-glow": c.glow,
    "--proday-accent-muted": c.soft,
    "--proday-accent-gradient": `linear-gradient(135deg, ${c.deep} 0%, ${c.accent} 100%)`,
  };
}
