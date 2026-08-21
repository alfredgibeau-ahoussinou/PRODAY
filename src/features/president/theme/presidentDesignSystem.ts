/**
 * Design system Pôle Président — typographie executive, surfaces, chrome.
 */

import type { TextStyle, ViewStyle } from 'react-native';
import { PRESIDENT_TOKENS, type PresidentThemeTokens } from './presidentTokens';

export const presidentType = {
  display: {
    fontSize: 34,
    fontWeight: '800' as const,
    letterSpacing: -1.1,
    lineHeight: 40,
  },
  h1: { fontSize: 26, fontWeight: '800' as const, letterSpacing: -0.7, lineHeight: 32 },
  h2: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.4, lineHeight: 26 },
  h3: { fontSize: 16, fontWeight: '700' as const, letterSpacing: -0.2, lineHeight: 22 },
  body: { fontSize: 15, fontWeight: '500' as const, letterSpacing: 0.1, lineHeight: 22 },
  caption: { fontSize: 12, fontWeight: '500' as const, letterSpacing: 0.15, lineHeight: 16 },
  label: {
    fontSize: 10,
    fontWeight: '800' as const,
    letterSpacing: 1.4,
    lineHeight: 13,
    textTransform: 'uppercase' as const,
  },
  stat: { fontSize: 30, fontWeight: '800' as const, letterSpacing: -1, lineHeight: 34 },
  nav: { fontSize: 13, fontWeight: '600' as const, letterSpacing: 0.1, lineHeight: 18 },
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
  xxxl: 44,
} as const;

export const presidentRadius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  pill: 999,
} as const;

export const presidentShadow = {
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 4,
  } satisfies ViewStyle,
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
    elevation: 8,
  } satisfies ViewStyle,
  glow: (tokens: PresidentThemeTokens = PRESIDENT_TOKENS): ViewStyle => ({
    shadowColor: tokens.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 6,
  }),
};

export const presidentMotion = {
  press: 110,
  enter: 320,
  settle: 480,
} as const;

export const presidentChrome = {
  sidebarExpanded: 268,
  sidebarCollapsed: 78,
  wideBreakpoint: 920,
  tabletBreakpoint: 700,
  headerHeight: 58,
  tabBarIcon: 22,
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

export function presidentHairline(tokens: PresidentThemeTokens): ViewStyle {
  return {
    height: StyleSheetHairline,
    backgroundColor: tokens.hairline,
  };
}

const StyleSheetHairline = 1;
