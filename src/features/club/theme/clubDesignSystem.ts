/**
 * Club Design System — identité visuelle premium du Pôle Club.
 * Surfaces claires, accents ProDay Club, codes sportifs. Pas de thème Coach.
 *
 * Utiliser via `clubUi` / shell ; éviter les styles one-off sur les écrans.
 */

import type { TextStyle, ViewStyle } from 'react-native';
import { CLUB_TOKENS, type ClubThemeTokens } from './clubTokens';

/** Échelle typographique Club (Display → Nav). */
export const clubType = {
  display: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.8, lineHeight: 38 },
  h1: { fontSize: 26, fontWeight: '800' as const, letterSpacing: -0.6, lineHeight: 32 },
  h2: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.35, lineHeight: 26 },
  h3: { fontSize: 17, fontWeight: '700' as const, letterSpacing: -0.2, lineHeight: 22 },
  body: { fontSize: 15, fontWeight: '500' as const, letterSpacing: 0, lineHeight: 21 },
  caption: { fontSize: 12, fontWeight: '500' as const, letterSpacing: 0.1, lineHeight: 16 },
  label: {
    fontSize: 11,
    fontWeight: '800' as const,
    letterSpacing: 1.15,
    lineHeight: 14,
    textTransform: 'uppercase' as const,
  },
  stat: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.8, lineHeight: 32 },
  score: { fontSize: 36, fontWeight: '800' as const, letterSpacing: -1, lineHeight: 40 },
  nav: { fontSize: 14, fontWeight: '600' as const, letterSpacing: 0, lineHeight: 18 },
} satisfies Record<string, TextStyle>;

export type ClubTypeVariant = keyof typeof clubType;

/** Espacements Club (grille 4). */
export const clubSpace = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

/** Rayons. */
export const clubRadius = {
  xs: 8,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
  pill: 999,
} as const;

/** Ombres premium (profondeur subtile). */
export const clubShadow = {
  none: {} as ViewStyle,
  soft: {
    shadowColor: '#0A1628',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  } satisfies ViewStyle,
  card: {
    shadowColor: '#0A1628',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  } satisfies ViewStyle,
  lift: {
    shadowColor: '#0A1628',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 6,
  } satisfies ViewStyle,
  accent: (tokens: ClubThemeTokens): ViewStyle => ({
    shadowColor: tokens.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 5,
  }),
};

/** Codes couleur événements calendrier / sport. */
export const clubEventTone = {
  match: { key: 'match', label: 'MATCH', color: '#006CFC', soft: 'rgba(0,108,252,0.12)' },
  training: { key: 'training', label: 'ENTRAÎNEMENT', color: '#0F7A45', soft: 'rgba(15,122,69,0.12)' },
  tournament: { key: 'tournament', label: 'TOURNOI', color: '#7C3AED', soft: 'rgba(124,58,237,0.12)' },
  meeting: { key: 'meeting', label: 'RÉUNION', color: '#B86E00', soft: 'rgba(184,110,0,0.12)' },
  event: { key: 'event', label: 'ÉVÉNEMENT', color: '#0E7490', soft: 'rgba(14,116,144,0.12)' },
} as const;

export type ClubEventKind = keyof typeof clubEventTone;

/** Durées micro-interactions (ms). */
export const clubMotion = {
  press: 120,
  enter: 280,
  collapse: 220,
  shimmer: 1400,
} as const;

/** Largeurs chrome. */
export const clubChrome = {
  sidebarExpanded: 260,
  sidebarCollapsed: 76,
  wideBreakpoint: 900,
  tabletBreakpoint: 680,
  headerHeight: 56,
  tabBarIcon: 22,
} as const;

/** Recettes de surface (cartes, chrome). */
export function clubSurfaceCard(tokens: ClubThemeTokens): ViewStyle {
  return {
    backgroundColor: tokens.surface,
    borderRadius: clubRadius.lg,
    borderWidth: 1,
    borderColor: tokens.border,
    ...clubShadow.card,
  };
}

export function clubSurfaceElevated(tokens: ClubThemeTokens): ViewStyle {
  return {
    backgroundColor: tokens.elevated,
    borderRadius: clubRadius.md,
    borderWidth: 1,
    borderColor: tokens.border,
  };
}

export function clubSurfacePremium(tokens: ClubThemeTokens): ViewStyle {
  return {
    backgroundColor: tokens.surface,
    borderRadius: clubRadius.xl,
    borderWidth: 1,
    borderColor: tokens.border,
    overflow: 'hidden' as const,
    ...clubShadow.lift,
  };
}

/** Export groupé pour imports uniques. */
export const clubDesignSystem = {
  tokens: CLUB_TOKENS,
  type: clubType,
  space: clubSpace,
  radius: clubRadius,
  shadow: clubShadow,
  eventTone: clubEventTone,
  motion: clubMotion,
  chrome: clubChrome,
  surfaceCard: clubSurfaceCard,
  surfaceElevated: clubSurfaceElevated,
  surfacePremium: clubSurfacePremium,
} as const;
