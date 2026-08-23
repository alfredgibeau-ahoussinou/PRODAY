/**
 * Identité officielle ProDay — source de vérité website.
 * Hex alignés planche brand (Master or + accents pôles).
 */

function rgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Master Brand — noir / blanc / or ProDay */
export const OFFICIAL_BRAND = {
  black: "#000000",
  ink: "#0A0A0A",
  white: "#FFFFFF",
  /** Or master (CTA, nav active, accents site) */
  accent: "#E8B923",
  bright: "#F5D04A",
  deep: "#B8941F",
  navy: "#0A0A0A",
  gradient: "linear-gradient(135deg, #B8941F 0%, #E8B923 48%, #F5D04A 100%)",
} as const;

/** Accents officiels par pôle (symbole inchangé, teinte planche). */
export const POLE_ACCENT_HEX = {
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
  joueur: polePalette(POLE_ACCENT_HEX.joueur, "#CCCCCC"),
  /** @deprecated → joueur */
  amateur: polePalette(POLE_ACCENT_HEX.joueur, "#CCCCCC"),
  /** @deprecated → joueur */
  pro_joueur: polePalette(POLE_ACCENT_HEX.joueur, "#CCCCCC"),
  homme: polePalette(POLE_ACCENT_HEX.joueur, "#CCCCCC"),
  coach: polePalette(POLE_ACCENT_HEX.coach, "#92700C"),
  pro_staff: polePalette(POLE_ACCENT_HEX.coach, "#92700C"),
  pro_club: polePalette(POLE_ACCENT_HEX.club, "#1E40AF"),
  club: polePalette(POLE_ACCENT_HEX.club, "#1E40AF"),
  president: polePalette(POLE_ACCENT_HEX.president, "#92700C"),
  parent: polePalette(POLE_ACCENT_HEX.parent, "#4D7C0F"),
  supporter: polePalette(POLE_ACCENT_HEX.supporter, "#5B21B6"),
  sponsor: polePalette(POLE_ACCENT_HEX.sponsor, "#991B1B"),
  admin: polePalette(POLE_ACCENT_HEX.admin, "#404040"),
  evenements: polePalette(POLE_ACCENT_HEX.evenements, "#C2410C"),
  /** @deprecated — Santé retiré vitrine ; alias parent */
  sante: polePalette(POLE_ACCENT_HEX.parent, "#4D7C0F"),
  /** @deprecated — Woman n’est plus un pôle accent séparé */
  woman: polePalette(POLE_ACCENT_HEX.joueur, "#CCCCCC"),
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
    return POLE_BRAND_COLORS.coach;
  }
  if (key in POLE_BRAND_COLORS) {
    return POLE_BRAND_COLORS[key as PoleBrandKey];
  }
  return POLE_BRAND_COLORS.joueur;
}

/** CSS variables for a pole page (overrides SiteShell master or). */
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
    "--proday-accent-bright": c.accent === POLE_ACCENT_HEX.joueur ? "#FFFFFF" : c.accent,
    "--proday-accent-dim": c.deep,
    "--proday-accent-deep": c.deep,
    "--proday-accent-glow": c.glow,
    "--proday-accent-muted": c.soft,
    "--proday-accent-gradient": `linear-gradient(135deg, ${c.deep} 0%, ${c.accent} 100%)`,
  };
}

/** Variables CSS master or (shell par défaut). */
export const MASTER_ACCENT_CSS_VARS: Record<string, string> = {
  "--proday-accent": OFFICIAL_BRAND.accent,
  "--proday-accent-bright": OFFICIAL_BRAND.bright,
  "--proday-accent-deep": OFFICIAL_BRAND.deep,
  "--proday-accent-dim": OFFICIAL_BRAND.deep,
  "--proday-accent-glow": rgba(OFFICIAL_BRAND.accent, 0.42),
  "--proday-accent-muted": rgba(OFFICIAL_BRAND.accent, 0.16),
  "--proday-accent-gradient": OFFICIAL_BRAND.gradient,
};
