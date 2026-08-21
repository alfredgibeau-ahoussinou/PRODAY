/**
 * Design system Pôle Président — typographie Display executive, surfaces, chrome.
 */

import type { TextStyle, ViewStyle } from 'react-native';
import { fontFamily } from '../../../theme/typography';
import { PRESIDENT_TOKENS, type PresidentThemeTokens } from './presidentTokens';

export const presidentType = {
  display: {
    fontFamily: fontFamily.displayBold,
    fontSize: 36,
    fontWeight: '800' as const,
    letterSpacing: -1.4,
    lineHeight: 42,
  },
  displaySm: {
    fontFamily: fontFamily.displayBold,
    fontSize: 28,
    fontWeight: '800' as const,
    letterSpacing: -1,
    lineHeight: 34,
  },
  h1: {
    fontFamily: fontFamily.extrabold,
    fontSize: 24,
    fontWeight: '800' as const,
    letterSpacing: -0.6,
    lineHeight: 30,
  },
  h2: {
    fontFamily: fontFamily.bold,
    fontSize: 19,
    fontWeight: '700' as const,
    letterSpacing: -0.35,
    lineHeight: 25,
  },
  h3: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    fontWeight: '700' as const,
    letterSpacing: -0.15,
    lineHeight: 21,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    fontWeight: '400' as const,
    letterSpacing: 0.05,
    lineHeight: 22,
  },
  caption: {
    fontFamily: fontFamily.semibold,
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 0.12,
    lineHeight: 16,
  },
  label: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 1.8,
    lineHeight: 13,
    textTransform: 'uppercase' as const,
  },
  brand: {
    fontFamily: fontFamily.displayBold,
    fontSize: 11,
    fontWeight: '800' as const,
    letterSpacing: 2.2,
    lineHeight: 14,
    textTransform: 'uppercase' as const,
  },
  stat: {
    fontFamily: fontFamily.displayBold,
    fontSize: 42,
    fontWeight: '800' as const,
    letterSpacing: -1.6,
    lineHeight: 46,
  },
  statSm: {
    fontFamily: fontFamily.displayBold,
    fontSize: 22,
    fontWeight: '800' as const,
    letterSpacing: -0.6,
    lineHeight: 26,
  },
  nav: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
    fontWeight: '600' as const,
    letterSpacing: 0.08,
    lineHeight: 18,
  },
} satisfies Record<string, TextStyle>;

export type PresidentTypeVariant = keyof typeof presidentType;

export const presidentSpace = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  hero: 56,
} as const;

export const presidentRadius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 28,
  hero: 32,
  pill: 999,
} as const;

export const presidentShadow = {
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 5,
  } satisfies ViewStyle,
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.55,
    shadowRadius: 36,
    elevation: 10,
  } satisfies ViewStyle,
  deep: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 22 },
    shadowOpacity: 0.62,
    shadowRadius: 48,
    elevation: 14,
  } satisfies ViewStyle,
  glow: (tokens: PresidentThemeTokens = PRESIDENT_TOKENS): ViewStyle => ({
    shadowColor: tokens.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 28,
    elevation: 8,
  }),
  champagne: (tokens: PresidentThemeTokens = PRESIDENT_TOKENS): ViewStyle => ({
    shadowColor: tokens.champagne,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 4,
  }),
};

export const presidentMotion = {
  press: 100,
  enter: 380,
  settle: 560,
  stagger: 48,
  bar: 720,
} as const;

export const presidentChrome = {
  sidebarExpanded: 276,
  sidebarCollapsed: 76,
  wideBreakpoint: 920,
  tabletBreakpoint: 700,
  headerHeight: 62,
  tabBarIcon: 22,
  /** Hauteur utile du dock mobile (hors safe-area). */
  dockRailHeight: 56,
  brandMark: 'PRODAY EXECUTIVE',
} as const;

/**
 * Cadre page — gutters / paddings / gaps alignés sur tout le pôle.
 * Évite les écarts ad hoc entre Cockpit, sections et Menu.
 */
export const presidentLayout = {
  /** Marge horizontale des scrolls / panes. */
  pageGutter: presidentSpace.lg,
  /** Padding interne des cartes section. */
  cardPad: presidentSpace.lg,
  /** Padding interne des surfaces héro / décision. */
  heroPad: presidentSpace.xl,
  /** Espacement vertical entre blocs de page. */
  sectionGap: presidentSpace.xl,
  /** Espacement interne dans une composition (héro deck, axes). */
  stackGap: presidentSpace.lg,
  /** Espacement grille 2 colonnes. */
  gridGap: presidentSpace.md,
  /** Clearance bas pour ne pas masquer le contenu sous le dock. */
  dockClearance: presidentSpace.hero + presidentChrome.dockRailHeight,
  /** Padding top contenu sous la status bar (mobile, hors sidebar). */
  contentTop: presidentSpace.md,
} as const;

export function presidentSurfaceCard(tokens: PresidentThemeTokens): ViewStyle {
  return {
    backgroundColor: tokens.surface,
    borderRadius: presidentRadius.lg,
    borderWidth: 1,
    borderColor: tokens.border,
    ...presidentShadow.card,
  };
}

export function presidentSurfaceHero(tokens: PresidentThemeTokens): ViewStyle {
  return {
    backgroundColor: tokens.surfaceRaised,
    borderRadius: presidentRadius.hero,
    borderWidth: 1,
    borderColor: tokens.borderLuxury,
    overflow: 'hidden',
    ...presidentShadow.deep,
    ...presidentShadow.champagne(tokens),
  };
}

export function presidentHairline(tokens: PresidentThemeTokens): ViewStyle {
  return {
    height: StyleSheetHairline,
    backgroundColor: tokens.hairline,
  };
}

const StyleSheetHairline = 1;
