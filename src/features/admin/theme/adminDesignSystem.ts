/**
 * Design system — ProDay Bureau Ops.
 * Typo densifiée type instrument · Inter UI · angles nets (pas soft-bubble).
 */

import type { TextStyle, ViewStyle } from 'react-native';
import { fontFamily } from '../../../theme/typography';
import { ADMIN_TOKENS, type AdminThemeTokens } from './adminTokens';

export const adminType = {
  display: {
    fontFamily: fontFamily.black,
    fontSize: 34,
    letterSpacing: -1.1,
    lineHeight: 38,
  },
  displaySm: {
    fontFamily: fontFamily.extrabold,
    fontSize: 24,
    letterSpacing: -0.6,
    lineHeight: 28,
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
    letterSpacing: 1.8,
    lineHeight: 12,
    textTransform: 'uppercase' as const,
  },
  brand: {
    fontFamily: fontFamily.brand,
    fontSize: 10,
    letterSpacing: 2.8,
    lineHeight: 13,
    textTransform: 'uppercase' as const,
  },
  stat: {
    fontFamily: fontFamily.black,
    fontSize: 42,
    letterSpacing: -1.4,
    lineHeight: 44,
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
    letterSpacing: 0.2,
    lineHeight: 16,
  },
  mono: {
    fontFamily: 'Menlo',
    fontSize: 11,
    letterSpacing: 0.35,
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

/** Angles instrument — presque rectangulaires. */
export const adminRadius = {
  xs: 2,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 10,
  xxl: 12,
  hero: 8,
  pill: 999,
} as const;

export const adminShadow = {
  soft: {
    shadowColor: '#071525',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  } satisfies ViewStyle,
  card: {
    shadowColor: '#071525',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  } satisfies ViewStyle,
  deep: {
    shadowColor: '#071525',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  } satisfies ViewStyle,
  glow: (tokens: AdminThemeTokens = ADMIN_TOKENS): ViewStyle => ({
    shadowColor: tokens.signal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 2,
  }),
  champagne: (_tokens: AdminThemeTokens = ADMIN_TOKENS): ViewStyle => ({
    shadowColor: '#071525',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  }),
};

export const adminChrome = {
  wideBreakpoint: 920,
  tabletBreakpoint: 700,
  /** Rail permanent (toujours visible, y compris mobile). */
  sidebarExpanded: 196,
  sidebarCollapsed: 64,
  topBarHeight: 52,
  /** Plus de dock bas — clearance minimale. */
  dockRailHeight: 0,
  tabBarIcon: 20,
  contentMax: 1280,
  brandMark: 'BUREAU OPS',
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
  listRowMinHeight: 48,
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
    borderWidth: 1.5,
    borderRadius: adminRadius.md,
  };
}

export function adminSurfaceHero(tokens: AdminThemeTokens = ADMIN_TOKENS): ViewStyle {
  return {
    backgroundColor: tokens.surface,
    borderRadius: adminRadius.hero,
    borderWidth: 2,
    borderColor: tokens.ink,
    overflow: 'hidden',
  };
}

export function adminSurfaceCard(tokens: AdminThemeTokens = ADMIN_TOKENS): ViewStyle {
  return {
    backgroundColor: tokens.surface,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: tokens.borderStrong,
  };
}
