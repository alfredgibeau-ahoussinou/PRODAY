/**
 * Design system — ProDay Admin Control Center.
 * Densités / typo / chrome calés sur le Pôle Président (série executive).
 */

import type { TextStyle, ViewStyle } from 'react-native';
import { fontFamily } from '../../../theme/typography';
import { ADMIN_TOKENS, type AdminThemeTokens } from './adminTokens';

export const adminType = {
  display: {
    fontFamily: fontFamily.displayBold,
    fontSize: 36,
    letterSpacing: -1.4,
    lineHeight: 42,
  },
  displaySm: {
    fontFamily: fontFamily.displayBold,
    fontSize: 28,
    letterSpacing: -1,
    lineHeight: 34,
  },
  h1: {
    fontFamily: fontFamily.extrabold,
    fontSize: 24,
    letterSpacing: -0.6,
    lineHeight: 30,
  },
  h2: {
    fontFamily: fontFamily.bold,
    fontSize: 19,
    letterSpacing: -0.35,
    lineHeight: 25,
  },
  h3: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    letterSpacing: -0.15,
    lineHeight: 21,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    letterSpacing: 0.05,
    lineHeight: 22,
  },
  caption: {
    fontFamily: fontFamily.semibold,
    fontSize: 12,
    letterSpacing: 0.12,
    lineHeight: 16,
  },
  label: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    letterSpacing: 1.8,
    lineHeight: 13,
    textTransform: 'uppercase' as const,
  },
  brand: {
    fontFamily: fontFamily.displayBold,
    fontSize: 11,
    letterSpacing: 2.2,
    lineHeight: 14,
    textTransform: 'uppercase' as const,
  },
  stat: {
    fontFamily: fontFamily.displayBold,
    fontSize: 42,
    letterSpacing: -1.6,
    lineHeight: 46,
  },
  statSm: {
    fontFamily: fontFamily.displayBold,
    fontSize: 22,
    letterSpacing: -0.6,
    lineHeight: 26,
  },
  nav: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
    letterSpacing: 0.08,
    lineHeight: 18,
  },
  mono: {
    fontFamily: 'Menlo',
    fontSize: 11,
    letterSpacing: 0.2,
    lineHeight: 15,
  },
} satisfies Record<string, TextStyle>;

export type AdminTypeVariant = keyof typeof adminType;

export const adminSpace = {
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

export const adminRadius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 28,
  hero: 32,
  pill: 999,
} as const;

export const adminShadow = {
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
  glow: (tokens: AdminThemeTokens = ADMIN_TOKENS): ViewStyle => ({
    shadowColor: tokens.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 28,
    elevation: 8,
  }),
  champagne: (tokens: AdminThemeTokens = ADMIN_TOKENS): ViewStyle => ({
    shadowColor: tokens.champagne,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 4,
  }),
};

export const adminChrome = {
  wideBreakpoint: 920,
  tabletBreakpoint: 700,
  sidebarExpanded: 276,
  sidebarCollapsed: 76,
  topBarHeight: 62,
  dockRailHeight: 56,
  tabBarIcon: 22,
  contentMax: 1280,
  brandMark: 'PRODAY CONTROL',
} as const;

export const adminLayout = {
  pageGutter: adminSpace.lg,
  cardPad: adminSpace.lg,
  heroPad: adminSpace.xl,
  sectionGap: adminSpace.xl,
  stackGap: adminSpace.lg,
  gridGap: adminSpace.md,
  dockClearance: adminSpace.hero + adminChrome.dockRailHeight,
  /**
   * Air sous la status bar / Dynamic Island (mobile, dock seul).
   * Pas juste 1–12 px : zone cliquable Rechercher / actions hors système.
   */
  contentTop: adminSpace.xl,
  /** Plancher insets.top (évite le flash à 0 au mount / îlot). */
  statusBarMin: 54,
  headerPadX: adminSpace.lg,
  listRowMinHeight: 52,
  hitTarget: 44,
} as const;

export const adminMotion = {
  press: 100,
  enter: 380,
  settle: 560,
  stagger: 48,
} as const;

export function adminPanelStyle(tokens: AdminThemeTokens = ADMIN_TOKENS): ViewStyle {
  return {
    backgroundColor: tokens.surface,
    borderColor: tokens.border,
    borderWidth: 1,
    borderRadius: adminRadius.lg,
    ...adminShadow.card,
  };
}

export function adminSurfaceHero(tokens: AdminThemeTokens = ADMIN_TOKENS): ViewStyle {
  return {
    backgroundColor: tokens.surfaceRaised,
    borderRadius: adminRadius.hero,
    borderWidth: 1,
    borderColor: tokens.borderLuxury,
    overflow: 'hidden',
    ...adminShadow.deep,
    ...adminShadow.champagne(tokens),
  };
}

export function adminSurfaceCard(tokens: AdminThemeTokens = ADMIN_TOKENS): ViewStyle {
  return {
    backgroundColor: tokens.surface,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: tokens.border,
    ...adminShadow.card,
  };
}
