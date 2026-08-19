/**
 * Design system Pôle Joueur — FUT 18 Color Premium.
 * Tokens statiques (sans dépendance React Native context).
 */
import { JOUEUR_SITE } from '../content/joueurPageIdentity';
import { FUT18_PREMIUM, FUT18_TIER_THEME } from './fut18PremiumPalette';
import { spacing } from './designTokens';
import type { JoueurPageIdentity } from '../content/joueurPageIdentity';

export { JOUEUR_SITE, JOUEUR_AGE_MOODS, JOUEUR_AGE_GENDER_ACCENTS } from '../content/joueurPageIdentity';
export { FUT18_PREMIUM, FUT18_TIER_THEME } from './fut18PremiumPalette';

/** Surfaces liste / panneau joueur — jamais blanc plat. */
export const JOUEUR_SURFACES = {
  card: FUT18_PREMIUM.panelBg,
  cardBorder: FUT18_PREMIUM.panelBorder,
  cardRim: FUT18_PREMIUM.dockBorder,
  listRow: 'rgba(10,16,28,0.88)',
  listRowBorder: 'rgba(255,255,255,0.06)',
  filterBar: 'rgba(8,14,24,0.92)',
  chip: 'rgba(255,255,255,0.06)',
  chipActive: 'rgba(255,255,255,0.14)',
  shadow: FUT18_PREMIUM.cardShadow,
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

/** Tokens covoiturage en mode joueur — fond sombre FUT18. */
export const JOUEUR_CARPOOL = {
  sky: JOUEUR_SITE.bg,
  asphalt: JOUEUR_SITE.foreground,
  asphaltRaised: JOUEUR_SURFACES.card,
  asphaltLane: JOUEUR_SURFACES.listRowBorder,
  surface: JOUEUR_SURFACES.card,
  surfaceMuted: JOUEUR_SURFACES.listRow,
  fog: 'rgba(0,0,0,0.25)',
  lane: JOUEUR_SITE.border,
  laneDash: 'rgba(232,200,114,0.35)',
  signal: FUT18_PREMIUM.goldAccent,
  signalSoft: FUT18_PREMIUM.goldSoft,
  signalDeep: FUT18_PREMIUM.pitchGreen,
  signalMuted: 'rgba(34,197,94,0.35)',
  ink: JOUEUR_SITE.foreground,
  inkMuted: JOUEUR_SITE.muted,
  inkDim: JOUEUR_SITE.dim,
  live: JOUEUR_SITE.live,
  wash: [JOUEUR_SITE.bg, '#0E1A2E', '#070B14'] as [string, string, string],
  heroWash: ['#0E1A2E', JOUEUR_SITE.bg] as [string, string],
  horizon: ['rgba(232,200,114,0)', 'rgba(232,200,114,0.18)', 'rgba(232,200,114,0)'] as [
    string,
    string,
    string,
  ],
} as const;
