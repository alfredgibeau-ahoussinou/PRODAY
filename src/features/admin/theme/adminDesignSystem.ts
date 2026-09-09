/**
 * Design system — ProDay Espace Admin (control room).
 * Typo densifiée · Inter UI · surfaces sombres premium.
 */

import type { TextStyle, ViewStyle } from 'react-native';
import { fontFamily } from '../../../theme/typography';
import { ADMIN_TOKENS, type AdminThemeTokens } from './adminTokens';

export const adminType = {
  display: {
    fontFamily: fontFamily.black,
    fontSize: 32,
    letterSpacing: -1.0,
    lineHeight: 36,
  },
  displaySm: {
    fontFamily: fontFamily.extrabold,
    fontSize: 22,
    letterSpacing: -0.5,
    lineHeight: 26,
  },
  h1: {
    fontFamily: fontFamily.extrabold,
    fontSize: 20,
    letterSpacing: -0.4,
    lineHeight: 26,
  },
  h2: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    letterSpacing: -0.15,
    lineHeight: 20,
  },
  h3: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    letterSpacing: -0.05,
    lineHeight: 18,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    letterSpacing: 0.01,
    lineHeight: 20,
  },
  caption: {
    fontFamily: fontFamily.semibold,
    fontSize: 11,
    letterSpacing: 0.12,
    lineHeight: 15,
  },
  label: {
    fontFamily: fontFamily.bold,
    fontSize: 9,
    letterSpacing: 1.6,
    lineHeight: 12,
    textTransform: 'uppercase' as const,
  },
  brand: {
    fontFamily: fontFamily.brand,
    fontSize: 10,
    letterSpacing: 2.4,
    lineHeight: 13,
    textTransform: 'uppercase' as const,
  },
  stat: {
    fontFamily: fontFamily.black,
    fontSize: 40,
    letterSpacing: -1.2,
    lineHeight: 42,
  },
  statSm: {
    fontFamily: fontFamily.extrabold,
    fontSize: 22,
    letterSpacing: -0.6,
    lineHeight: 26,
  },
  nav: {
    fontFamily: fontFamily.semibold,
    fontSize: 12,
    letterSpacing: 0.15,
    lineHeight: 16,
  },
  mono: {
    fontFamily: 'Menlo',
    fontSize: 11,
    letterSpacing: 0.3,
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
  xs: 4,
  sm: 6,
  md: 10,
  lg: 12,
  xl: 14,
  xxl: 16,
  hero: 14,
  pill: 999,
} as const;

export const adminShadow = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 2,
  } satisfies ViewStyle,
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 4,
  } satisfies ViewStyle,
  deep: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 8,
  } satisfies ViewStyle,
  glow: (tokens: AdminThemeTokens = ADMIN_TOKENS): ViewStyle => ({
    shadowColor: tokens.signal,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 3,
  }),
  champagne: (tokens: AdminThemeTokens = ADMIN_TOKENS): ViewStyle => ({
    shadowColor: tokens.champagne,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  }),
};

export const adminChrome = {
  wideBreakpoint: 920,
  tabletBreakpoint: 700,
  /** Menu riche : largeur confortable pour labels. */
  sidebarExpanded: 228,
  sidebarCollapsed: 72,
  topBarHeight: 56,
  dockRailHeight: 0,
  tabBarIcon: 20,
  contentMax: 1320,
  brandMark: 'ESPACE ADMIN',
} as const;

export const adminLayout = {
  pageGutter: adminSpace.lg,
  cardPad: adminSpace.lg,
  heroPad: adminSpace.xl,
  sectionGap: adminSpace.lg,
  stackGap: adminSpace.md,
  gridGap: adminSpace.md,
  dockClearance: adminSpace.xxl,
  contentTop: adminSpace.md,
  statusBarMin: 48,
  headerPadX: adminSpace.lg,
  listRowMinHeight: 52,
  hitTarget: 44,
} as const;

export const adminMotion = {
  press: 80,
  enter: 280,
  settle: 420,
  stagger: 36,
} as const;

export function adminPanelStyle(tokens: AdminThemeTokens = ADMIN_TOKENS): ViewStyle {
  return {
    backgroundColor: tokens.surface,
    borderColor: tokens.borderStrong,
    borderWidth: 1,
    borderRadius: adminRadius.md,
  };
}

export function adminSurfaceHero(tokens: AdminThemeTokens = ADMIN_TOKENS): ViewStyle {
  return {
    backgroundColor: tokens.surfaceRaised,
    borderRadius: adminRadius.hero,
    borderWidth: 1,
    borderColor: tokens.borderLuxury,
    overflow: 'hidden',
  };
}

export function adminSurfaceCard(tokens: AdminThemeTokens = ADMIN_TOKENS): ViewStyle {
  return {
    backgroundColor: tokens.surface,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: tokens.border,
  };
}
