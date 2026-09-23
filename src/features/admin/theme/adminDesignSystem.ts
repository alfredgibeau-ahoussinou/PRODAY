/**
 * Design system — ProDay Espace Admin (Ops Desk Apple Liquid Glass).
 * Typographie Apple San Francisco · surfaces Obsidian Glass · reflets spéculaires · fort contraste.
 */

import { Platform, type TextStyle, type ViewStyle } from 'react-native';
import { APPLE_FONT_STACK } from '../../../theme/appleTypography';
import { ADMIN_TOKENS, type AdminThemeTokens } from './adminTokens';

export const adminType = {
  display: {
    fontFamily: APPLE_FONT_STACK.display,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 38,
  } as TextStyle,
  displaySm: {
    fontFamily: APPLE_FONT_STACK.display,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
    lineHeight: 28,
  } as TextStyle,
  h1: {
    fontFamily: APPLE_FONT_STACK.display,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 26,
  } as TextStyle,
  h2: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.15,
    lineHeight: 20,
  } as TextStyle,
  h3: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.05,
    lineHeight: 18,
  } as TextStyle,
  body: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: -0.05,
    lineHeight: 20,
  } as TextStyle,
  caption: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.1,
    lineHeight: 15,
  } as TextStyle,
  label: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
    lineHeight: 12,
    textTransform: 'uppercase' as const,
  } as TextStyle,
  brand: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.2,
    lineHeight: 13,
    textTransform: 'uppercase' as const,
  } as TextStyle,
  stat: {
    fontFamily: APPLE_FONT_STACK.display,
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1.0,
    lineHeight: 42,
  } as TextStyle,
  statSm: {
    fontFamily: APPLE_FONT_STACK.display,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 26,
  } as TextStyle,
  nav: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.1,
    lineHeight: 16,
  } as TextStyle,
  mono: {
    fontFamily: APPLE_FONT_STACK.mono,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.2,
    lineHeight: 15,
  } as TextStyle,
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
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
  xxl: 18,
  hero: 16,
  pill: 999,
} as const;

export const adminShadow = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 2,
  } satisfies ViewStyle,
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 4,
  } satisfies ViewStyle,
  deep: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 8,
  } satisfies ViewStyle,
  glow: (tokens: AdminThemeTokens = ADMIN_TOKENS): ViewStyle => ({
    shadowColor: tokens.signal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.26,
    shadowRadius: 12,
    elevation: 3,
  }),
  champagne: (tokens: AdminThemeTokens = ADMIN_TOKENS): ViewStyle => ({
    shadowColor: tokens.champagne,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 2,
  }),
};

export const adminChrome = {
  wideBreakpoint: 920,
  tabletBreakpoint: 700,
  sidebarExpanded: 228,
  sidebarCollapsed: 0,
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
    overflow: 'hidden',
    ...(tokens.glassBackdrop as ViewStyle),
  };
}

export function adminSurfaceHero(tokens: AdminThemeTokens = ADMIN_TOKENS): ViewStyle {
  return {
    backgroundColor: tokens.surfaceRaised,
    borderRadius: adminRadius.hero,
    borderWidth: 1,
    borderColor: tokens.borderLuxury,
    borderTopColor: tokens.specularTop,
    overflow: 'hidden',
    ...(tokens.isGlass ? adminShadow.card : adminShadow.soft),
    ...(tokens.glassBackdrop as ViewStyle),
  };
}

export function adminSurfaceCard(tokens: AdminThemeTokens = ADMIN_TOKENS): ViewStyle {
  return {
    backgroundColor: tokens.surface,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: tokens.border,
    borderTopColor: tokens.specularTop,
    overflow: 'hidden',
    ...(tokens.isGlass ? adminShadow.card : adminShadow.soft),
    ...(tokens.glassBackdrop as ViewStyle),
  };
}

export function adminSurfaceRow(tokens: AdminThemeTokens = ADMIN_TOKENS): ViewStyle {
  return {
    backgroundColor: tokens.surface,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: tokens.border,
    borderTopColor: tokens.specularTop,
    paddingVertical: adminSpace.md,
    paddingHorizontal: adminSpace.lg,
    minHeight: adminLayout.listRowMinHeight,
    overflow: 'hidden',
    ...(tokens.glassBackdrop as ViewStyle),
  };
}
