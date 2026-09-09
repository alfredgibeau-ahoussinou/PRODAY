/**
 * Design system — ProDay Admin Control Center.
 * Densité instrument / fondateur · Inter pour l’UI · Syne/Sora réservés au brand mark.
 */

import type { TextStyle, ViewStyle } from 'react-native';
import { fontFamily } from '../../../theme/typography';
import { ADMIN_TOKENS, type AdminThemeTokens } from './adminTokens';

export const adminType = {
  display: {
    fontFamily: fontFamily.extrabold,
    fontSize: 32,
    letterSpacing: -0.9,
    lineHeight: 38,
  },
  displaySm: {
    fontFamily: fontFamily.extrabold,
    fontSize: 26,
    letterSpacing: -0.7,
    lineHeight: 32,
  },
  h1: {
    fontFamily: fontFamily.extrabold,
    fontSize: 22,
    letterSpacing: -0.45,
    lineHeight: 28,
  },
  h2: {
    fontFamily: fontFamily.bold,
    fontSize: 17,
    letterSpacing: -0.25,
    lineHeight: 23,
  },
  h3: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    letterSpacing: -0.1,
    lineHeight: 19,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    letterSpacing: 0.01,
    lineHeight: 21,
  },
  caption: {
    fontFamily: fontFamily.semibold,
    fontSize: 12,
    letterSpacing: 0.08,
    lineHeight: 16,
  },
  label: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    letterSpacing: 1.5,
    lineHeight: 13,
    textTransform: 'uppercase' as const,
  },
  brand: {
    fontFamily: fontFamily.brand,
    fontSize: 11,
    letterSpacing: 2.4,
    lineHeight: 14,
    textTransform: 'uppercase' as const,
  },
  stat: {
    fontFamily: fontFamily.extrabold,
    fontSize: 40,
    letterSpacing: -1.2,
    lineHeight: 44,
  },
  statSm: {
    fontFamily: fontFamily.extrabold,
    fontSize: 22,
    letterSpacing: -0.5,
    lineHeight: 26,
  },
  nav: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
    letterSpacing: 0.04,
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

/** Rayons plus instrumentaux — moins « bubbly » club. */
export const adminRadius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 14,
  xl: 18,
  xxl: 22,
  hero: 20,
  pill: 999,
} as const;

export const adminShadow = {
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 3,
  } satisfies ViewStyle,
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 6,
  } satisfies ViewStyle,
  deep: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.42,
    shadowRadius: 28,
    elevation: 10,
  } satisfies ViewStyle,
  glow: (tokens: AdminThemeTokens = ADMIN_TOKENS): ViewStyle => ({
    shadowColor: tokens.signal,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 5,
  }),
  champagne: (tokens: AdminThemeTokens = ADMIN_TOKENS): ViewStyle => ({
    shadowColor: tokens.accentHot,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 3,
  }),
};

export const adminChrome = {
  wideBreakpoint: 920,
  tabletBreakpoint: 700,
  sidebarExpanded: 268,
  sidebarCollapsed: 72,
  topBarHeight: 56,
  dockRailHeight: 54,
  tabBarIcon: 21,
  contentMax: 1200,
  brandMark: 'COCKPIT TOTAL',
} as const;

export const adminLayout = {
  pageGutter: adminSpace.lg,
  cardPad: adminSpace.lg,
  heroPad: adminSpace.xl,
  sectionGap: adminSpace.lg + 4,
  stackGap: adminSpace.md + 2,
  gridGap: adminSpace.md,
  dockClearance: adminSpace.hero + adminChrome.dockRailHeight,
  /**
   * Air sous la status bar / Dynamic Island (mobile, dock seul).
   */
  contentTop: adminSpace.xl,
  /** Plancher insets.top (évite le flash à 0 au mount / îlot). */
  statusBarMin: 54,
  headerPadX: adminSpace.lg,
  listRowMinHeight: 52,
  hitTarget: 44,
} as const;

export const adminMotion = {
  press: 90,
  enter: 320,
  settle: 480,
  stagger: 40,
} as const;

export function adminPanelStyle(tokens: AdminThemeTokens = ADMIN_TOKENS): ViewStyle {
  return {
    backgroundColor: tokens.surface,
    borderColor: tokens.border,
    borderWidth: 1,
    borderRadius: adminRadius.lg,
  };
}

export function adminSurfaceHero(tokens: AdminThemeTokens = ADMIN_TOKENS): ViewStyle {
  return {
    backgroundColor: tokens.surfaceRaised,
    borderRadius: adminRadius.hero,
    borderWidth: 1,
    borderColor: tokens.borderLuxury,
    overflow: 'hidden',
    ...adminShadow.soft,
  };
}

export function adminSurfaceCard(tokens: AdminThemeTokens = ADMIN_TOKENS): ViewStyle {
  return {
    backgroundColor: tokens.surface,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: tokens.border,
    ...adminShadow.soft,
  };
}
