/**
 * Design system — ProDay Admin Control Center.
 */

import type { TextStyle, ViewStyle } from 'react-native';
import { fontFamily } from '../../../theme/typography';
import { ADMIN_TOKENS, type AdminThemeTokens } from './adminTokens';

export const adminType = {
  display: {
    fontFamily: fontFamily.displayBold,
    fontSize: 34,
    fontWeight: '800' as const,
    letterSpacing: -1.2,
    lineHeight: 40,
  },
  h1: {
    fontFamily: fontFamily.extrabold,
    fontSize: 22,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  h2: {
    fontFamily: fontFamily.bold,
    fontSize: 17,
    fontWeight: '700' as const,
    letterSpacing: -0.25,
    lineHeight: 23,
  },
  h3: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    fontWeight: '700' as const,
    letterSpacing: -0.1,
    lineHeight: 19,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    fontWeight: '400' as const,
    letterSpacing: 0.05,
    lineHeight: 20,
  },
  caption: {
    fontFamily: fontFamily.semibold,
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 0.1,
    lineHeight: 16,
  },
  label: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 1.6,
    lineHeight: 13,
    textTransform: 'uppercase' as const,
  },
  brand: {
    fontFamily: fontFamily.displayBold,
    fontSize: 11,
    fontWeight: '800' as const,
    letterSpacing: 2,
    lineHeight: 14,
    textTransform: 'uppercase' as const,
  },
  stat: {
    fontFamily: fontFamily.displayBold,
    fontSize: 36,
    fontWeight: '800' as const,
    letterSpacing: -1.4,
    lineHeight: 40,
  },
  statSm: {
    fontFamily: fontFamily.displayBold,
    fontSize: 20,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
    lineHeight: 24,
  },
  nav: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
    fontWeight: '600' as const,
    letterSpacing: 0.05,
    lineHeight: 18,
  },
  mono: {
    fontFamily: 'Menlo',
    fontSize: 12,
    fontWeight: '500' as const,
    letterSpacing: 0,
    lineHeight: 16,
  },
} satisfies Record<string, TextStyle>;

export type AdminTypeVariant = keyof typeof adminType;

export const adminSpace = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const adminRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

export const adminChrome = {
  wideBreakpoint: 900,
  tabletBreakpoint: 700,
  sidebarExpanded: 248,
  sidebarCollapsed: 72,
  topBarHeight: 56,
  contentMax: 1280,
} as const;

export const adminMotion = {
  enter: 220,
  exit: 160,
} as const;

export function adminPanelStyle(tokens: AdminThemeTokens = ADMIN_TOKENS): ViewStyle {
  return {
    backgroundColor: tokens.surface,
    borderColor: tokens.border,
    borderWidth: 1,
    borderRadius: adminRadius.lg,
  };
}
