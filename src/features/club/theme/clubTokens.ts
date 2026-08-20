/**
 * Identité visuelle Pôle Club — premium sombre, sportive, moderne.
 * Charcoal / night pitch. Pas un dashboard admin blanc ni le thème Coach.
 */

export type ClubThemeTokens = {
  bg: string;
  /** Surface principale (cartes). */
  surface: string;
  /** Surface secondaire / chips. */
  elevated: string;
  /** Surface encore plus haute (modales, sheets). */
  raised: string;
  border: string;
  borderStrong: string;
  foreground: string;
  muted: string;
  faint: string;
  accent: string;
  accentSoft: string;
  accentDeep: string;
  /** Couleur secondaire (logo / club). */
  secondary: string;
  /** Texte / icônes sur fond accent. */
  onAccent: string;
  glow: string;
  /** Lavage header teinté. */
  headerWash: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  pitch: string;
  pitchSoft: string;
  scrim: string;
  isLight: boolean;
};

/** Tokens Club — fond sombre premium night pitch, accent bleu ProDay Club. */
export const CLUB_TOKENS: ClubThemeTokens = {
  bg: '#070B14',
  surface: '#101826',
  elevated: '#172033',
  raised: '#1C283C',
  border: 'rgba(232, 240, 255, 0.10)',
  borderStrong: 'rgba(232, 240, 255, 0.18)',
  foreground: '#EEF3FB',
  muted: 'rgba(238, 243, 251, 0.62)',
  faint: 'rgba(238, 243, 251, 0.40)',
  accent: '#006CFC',
  accentSoft: 'rgba(0, 108, 252, 0.24)',
  accentDeep: '#0039A6',
  secondary: '#5BA3FF',
  onAccent: '#FFFFFF',
  glow: 'rgba(0, 108, 252, 0.45)',
  headerWash: '#0C1730',
  success: '#34D399',
  successSoft: 'rgba(52, 211, 153, 0.16)',
  warning: '#FBBF24',
  warningSoft: 'rgba(251, 191, 36, 0.16)',
  danger: '#F87171',
  dangerSoft: 'rgba(248, 113, 113, 0.16)',
  pitch: '#1F7A45',
  pitchSoft: 'rgba(31, 122, 69, 0.22)',
  scrim: 'rgba(2, 6, 14, 0.72)',
  isLight: false,
};

/** Compat site / legacy dark chrome (upsell, vitrine publique). */
export const CLUB_SITE_LEGACY = {
  accent: '#006CFC',
  deep: '#002478',
  soft: 'rgba(0, 108, 252, 0.14)',
  glow: 'rgba(0, 108, 252, 0.35)',
  bg: '#000000',
  band: '#020814',
  surface: '#0c0c0c',
  elevated: '#141414',
  border: 'rgba(255,255,255,0.12)',
  foreground: '#f5f5f0',
  muted: 'rgba(245,245,240,0.55)',
  pitchDeep: '#0a3d1a',
  pitch: '#14532d',
  pitchLight: '#166534',
} as const;
