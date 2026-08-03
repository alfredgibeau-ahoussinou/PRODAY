/**
 * Couleurs extraites des logos officiels ProDay (PNG branding/).
 * Source de vérité pour le site. ne pas inventer de cyan hors logo.
 */

export const OFFICIAL_BRAND = {
  /** Bleu électrique « Day » / bas du P */
  accent: "#0054F0",
  /** Navy profond haut du P */
  deep: "#001854",
  navy: "#000C30",
  black: "#0A0A0A",
  white: "#FFFFFF",
} as const;

/** Accents par pôle. échantillons réels des pictos. */
export const POLE_BRAND_COLORS = {
  joueur: {
    deep: "#001854",
    accent: "#0054F0",
    soft: "rgba(0, 84, 240, 0.14)",
    glow: "rgba(0, 84, 240, 0.35)",
  },
  /** @deprecated → joueur */
  amateur: {
    deep: "#001854",
    accent: "#0054F0",
    soft: "rgba(0, 84, 240, 0.14)",
    glow: "rgba(0, 84, 240, 0.35)",
  },
  supporter: {
    deep: "#180078",
    accent: "#3C00F0",
    soft: "rgba(60, 0, 240, 0.14)",
    glow: "rgba(60, 0, 240, 0.35)",
  },
  sante: {
    deep: "#006C60",
    accent: "#00CCB4",
    soft: "rgba(0, 204, 180, 0.14)",
    glow: "rgba(0, 204, 180, 0.35)",
  },
  /** @deprecated → joueur */
  pro_joueur: {
    deep: "#001854",
    accent: "#0054F0",
    soft: "rgba(0, 84, 240, 0.14)",
    glow: "rgba(0, 84, 240, 0.35)",
  },
  pro_club: {
    deep: "#002478",
    accent: "#006CFC",
    soft: "rgba(0, 108, 252, 0.14)",
    glow: "rgba(0, 108, 252, 0.35)",
  },
  pro_staff: {
    deep: "#001848",
    accent: "#3B5BFF",
    soft: "rgba(59, 91, 255, 0.14)",
    glow: "rgba(59, 91, 255, 0.35)",
  },
  evenements: {
    deep: "#0e4a5c",
    accent: "#0891B2",
    soft: "rgba(8, 145, 178, 0.14)",
    glow: "rgba(8, 145, 178, 0.35)",
  },
  sponsor: {
    deep: "#070605",
    accent: "#D4AF37",
    soft: "rgba(212, 175, 55, 0.14)",
    glow: "rgba(212, 175, 55, 0.35)",
  },
  woman: {
    deep: "#540000",
    accent: "#F00000",
    soft: "rgba(240, 0, 0, 0.14)",
    glow: "rgba(240, 0, 0, 0.35)",
  },
  homme: {
    deep: "#001854",
    accent: "#0054F0",
    soft: "rgba(0, 84, 240, 0.14)",
    glow: "rgba(0, 84, 240, 0.35)",
  },
} as const;

export type PoleBrandKey = keyof typeof POLE_BRAND_COLORS;
