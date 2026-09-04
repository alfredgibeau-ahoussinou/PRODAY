/**
 * Design system Pôle Joueur — FUT 18 Color Premium.
 * Tokens statiques (sans dépendance React Native context).
 */
import { JOUEUR_SITE } from '../content/joueurPageIdentity';
import { FUT18_PREMIUM, FUT18_TIER_THEME } from './fut18PremiumPalette';
import { PLAYER_DARK } from './playerDarkPremium';
import { spacing } from './designTokens';
import type { JoueurPageIdentity } from '../content/joueurPageIdentity';

export { JOUEUR_SITE, JOUEUR_AGE_MOODS, JOUEUR_AGE_GENDER_ACCENTS } from '../content/joueurPageIdentity';
export { FUT18_PREMIUM, FUT18_TIER_THEME } from './fut18PremiumPalette';
export { PLAYER_DARK, PLAYER_DARK_RADIUS } from './playerDarkPremium';

/** Surfaces liste / panneau joueur — dark premium (#1A1A24). */
export const JOUEUR_SURFACES = {
  card: PLAYER_DARK.surface,
  cardBorder: PLAYER_DARK.border,
  cardRim: PLAYER_DARK.borderStrong,
  listRow: PLAYER_DARK.bgElevated,
  listRowBorder: PLAYER_DARK.border,
  filterBar: PLAYER_DARK.bgElevated,
  chip: 'rgba(255,255,255,0.06)',
  chipActive: PLAYER_DARK.accentSoft,
  shadow: 'rgba(0,0,0,0.45)',
} as const;

/** Espacements standard pôle joueur. */
export const JOUEUR_SPACE = {
  xs: spacing.xs,
  sm: spacing.sm,
  md: spacing.md,
  lg: spacing.lg,
  xl: spacing.xl,
} as const;

export const JOUEUR_RADIUS = {
  sm: 12,
  md: 16,
  lg: 20,
  pill: 999,
} as const;

export type JoueurThemeTokens = {
  ready: boolean;
  identity: JoueurPageIdentity | null;
  accent: string;
  accentBright: string;
  ink: string;
  inkMuted: string;
  surface: string;
  elevated: string;
  border: string;
  panel: string;
  shellBg: string;
  radius: number;
  cardRadius: number;
};

/** Tokens Reels joueur — dark premium + accent mint. */
export const JOUEUR_REELS = {
  stage: PLAYER_DARK.bg,
  backdrop: 'rgba(10,10,15,0.72)',
  accent: PLAYER_DARK.accent,
  accentSoft: PLAYER_DARK.accentSoft,
  accentLine: 'rgba(0,230,118,0.42)',
  ember: '#FF4F7A',
  text: PLAYER_DARK.text,
  textDim: PLAYER_DARK.textMuted,
  hairline: PLAYER_DARK.border,
  scrimTop: 'rgba(10,10,15,0.58)',
  scrimStrong: 'rgba(10,10,15,0.92)',
  atmosphere: [PLAYER_DARK.bgElevated, PLAYER_DARK.bg] as [string, string],
  glow: [PLAYER_DARK.accentSoft, 'transparent'] as [string, string],
} as const;

/** Tokens Discover invité — hero dark premium. */
export const JOUEUR_DISCOVER = {
  heroBg: PLAYER_DARK.surface,
  heroBorder: PLAYER_DARK.border,
  heroMuted: PLAYER_DARK.textMuted,
  tileBg: JOUEUR_SURFACES.card,
  tileBorder: JOUEUR_SURFACES.cardBorder,
  chipBg: JOUEUR_SURFACES.chip,
} as const;

/** Composants hub joueur — rayons & micro-interactions. */
export const JOUEUR_HUB = {
  pressScale: 0.98,
  cardRevealMs: 320,
  sectionGap: JOUEUR_SPACE.lg,
} as const;

/** Tokens covoiturage en mode joueur — dark premium mint. */
export const JOUEUR_CARPOOL = {
  sky: PLAYER_DARK.bg,
  asphalt: PLAYER_DARK.text,
  asphaltRaised: JOUEUR_SURFACES.card,
  asphaltLane: JOUEUR_SURFACES.listRowBorder,
  surface: JOUEUR_SURFACES.card,
  surfaceMuted: JOUEUR_SURFACES.listRow,
  fog: 'rgba(0,0,0,0.25)',
  lane: PLAYER_DARK.border,
  laneDash: 'rgba(0,230,118,0.35)',
  signal: PLAYER_DARK.accent,
  signalSoft: PLAYER_DARK.accentSoft,
  signalDeep: PLAYER_DARK.accentAlt,
  signalMuted: 'rgba(45,212,191,0.35)',
  ink: PLAYER_DARK.text,
  inkMuted: PLAYER_DARK.textMuted,
  inkDim: PLAYER_DARK.textDim,
  live: JOUEUR_SITE.live,
  wash: [PLAYER_DARK.bgElevated, PLAYER_DARK.bg, PLAYER_DARK.bg] as [string, string, string],
  heroWash: [PLAYER_DARK.bgElevated, PLAYER_DARK.bg] as [string, string],
  horizon: ['rgba(0,230,118,0)', 'rgba(0,230,118,0.18)', 'rgba(0,230,118,0)'] as [
    string,
    string,
    string,
  ],
} as const;
