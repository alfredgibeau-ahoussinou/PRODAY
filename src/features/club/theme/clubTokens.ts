/**
 * Identité visuelle Pôle Club — contrôle, simplicité, professionnalisme, communauté.
 * Clair, football, premium. Pas un dashboard admin ni le thème Coach.
 */

export type ClubThemeTokens = {
  bg: string;
  surface: string;
  elevated: string;
  border: string;
  foreground: string;
  muted: string;
  accent: string;
  accentSoft: string;
  accentDeep: string;
  success: string;
  warning: string;
  danger: string;
  pitch: string;
  isLight: boolean;
};

/** Tokens Club — surface claire, accent bleu ProDay Club. */
export const CLUB_TOKENS: ClubThemeTokens = {
  bg: '#F4F6F9',
  surface: '#FFFFFF',
  elevated: '#EEF2F7',
  border: 'rgba(10, 22, 40, 0.10)',
  foreground: '#0A1628',
  muted: 'rgba(10, 22, 40, 0.55)',
  accent: '#006CFC',
  accentSoft: 'rgba(0, 108, 252, 0.12)',
  accentDeep: '#002478',
  success: '#0F7A45',
  warning: '#B86E00',
  danger: '#C62828',
  pitch: '#14532D',
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
