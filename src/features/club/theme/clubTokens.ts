/**
 * Identité visuelle Pôle Club — premium, sportive, moderne.
 * Clair, football, ProDay. Pas un dashboard admin ni le thème Coach.
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

/** Tokens Club — surfaces premium claires, accent bleu ProDay Club (fallback). */
export const CLUB_TOKENS: ClubThemeTokens = {
  bg: '#F2F5FA',
  surface: '#FFFFFF',
  elevated: '#F7F9FC',
  raised: '#FFFFFF',
  border: 'rgba(10, 22, 40, 0.08)',
  borderStrong: 'rgba(10, 22, 40, 0.14)',
  foreground: '#0A1628',
  muted: 'rgba(10, 22, 40, 0.58)',
  faint: 'rgba(10, 22, 40, 0.38)',
  accent: '#006CFC',
  accentSoft: 'rgba(0, 108, 252, 0.12)',
  accentDeep: '#002478',
  secondary: '#002478',
  onAccent: '#FFFFFF',
  glow: 'rgba(0, 108, 252, 0.28)',
  headerWash: '#E8F0FC',
  success: '#0F7A45',
  successSoft: 'rgba(15, 122, 69, 0.12)',
  warning: '#B86E00',
  warningSoft: 'rgba(184, 110, 0, 0.12)',
  danger: '#C62828',
  dangerSoft: 'rgba(198, 40, 40, 0.12)',
  pitch: '#14532D',
  pitchSoft: 'rgba(20, 83, 45, 0.10)',
  scrim: 'rgba(6, 12, 24, 0.48)',
  isLight: true,
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
