/**
 * Identité visuelle Pôle Club — premium sombre, sportive, moderne.
 * Navy / charcoal + émeraude + bleu vif (réf. sport management). Pas SaaS violet.
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

/** Tokens Club — night navy, émeraude status, bleu FAB. */
export const CLUB_TOKENS: ClubThemeTokens = {
  bg: '#0B121F',
  surface: '#121A28',
  elevated: '#182233',
  raised: '#1E2A3C',
  border: 'rgba(186, 204, 230, 0.12)',
  borderStrong: 'rgba(186, 204, 230, 0.22)',
  foreground: '#F4F7FC',
  muted: 'rgba(186, 204, 230, 0.72)',
  faint: 'rgba(186, 204, 230, 0.48)',
  accent: '#006CFC',
  accentSoft: 'rgba(0, 108, 252, 0.22)',
  accentDeep: '#0047B8',
  secondary: '#5BA3FF',
  onAccent: '#FFFFFF',
  glow: 'rgba(0, 108, 252, 0.50)',
  headerWash: '#0A2A22',
  success: '#10B981',
  successSoft: 'rgba(16, 185, 129, 0.18)',
  warning: '#FBBF24',
  warningSoft: 'rgba(251, 191, 36, 0.16)',
  danger: '#F87171',
  dangerSoft: 'rgba(248, 113, 113, 0.16)',
  pitch: '#059669',
  pitchSoft: 'rgba(5, 150, 105, 0.28)',
  scrim: 'rgba(4, 8, 16, 0.78)',
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
  pitchDeep: '#064E3B',
  pitch: '#047857',
  pitchLight: '#059669',
} as const;
