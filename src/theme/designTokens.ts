/**
 * ProDay — design system identité officielle
 * Noir / blanc / gris premium · or master · accents de pôle
 */

import { PRODAY_MASTER, PRODAY_TAGLINE, poleAccentSoft } from './prodayBrand';

export const BRAND = {
  name: 'ProDay',
  tagline: PRODAY_TAGLINE,
} as const;

/** RGB fond (#000000) — overlays photos */
export const BRAND_RGB = '0, 0, 0' as const;

/** Or master — accent marque mère / CTA */
export const MASTER_GOLD = PRODAY_MASTER.gold;
export const MASTER_GOLD_BRIGHT = PRODAY_MASTER.goldBright;
export const MASTER_GOLD_DEEP = PRODAY_MASTER.goldDeep;

/** @deprecated Alias legacy — préférer MASTER_GOLD */
export const MASTER_BLUE = MASTER_GOLD;
/** @deprecated Alias legacy */
export const MASTER_BLUE_BRIGHT = MASTER_GOLD_BRIGHT;
/** @deprecated Alias legacy */
export const MASTER_BLUE_DEEP = MASTER_GOLD_DEEP;

/** @deprecated Alias — préférer MASTER_GOLD */
export const FLASH_CYAN = MASTER_GOLD;
/** @deprecated Alias — préférer MASTER_GOLD_DEEP */
export const FLASH_CYAN_DIM = MASTER_GOLD_DEEP;

export const colors = {
  /** Accent marque mère */
  accent: MASTER_GOLD,
  accentLight: MASTER_GOLD_BRIGHT,
  accentSoft: poleAccentSoft('master', 0.12),
  accentMuted: poleAccentSoft('master', 0.28),

  /** Texte & marque */
  brand: MASTER_GOLD,
  brandLight: MASTER_GOLD_BRIGHT,
  brandSoft: poleAccentSoft('master', 0.1),
  brandInverse: '#FFFFFF',

  ink: '#FAFAFA',
  inkSecondary: '#D4D4D4',
  inkMuted: '#A3A3A3',
  inkFaint: '#737373',

  /** Fonds FLASH */
  background: '#080B11',
  backgroundAlt: '#0D121D',
  surface: '#101522',
  surfaceMuted: '#171F32',
  surfaceInverse: '#FAFAFA',
  heroMuted: 'rgba(255, 255, 255, 0.72)',

  /** Bordures */
  border: 'rgba(255, 255, 255, 0.1)',
  borderStrong: 'rgba(255, 255, 255, 0.22)',
  borderMedium: 'rgba(255, 255, 255, 0.14)',

  text: '#FAFAFA',
  textSecondary: '#D4D4D4',
  textMuted: '#A3A3A3',

  /** États */
  success: '#16A34A',
  successBg: 'rgba(22, 163, 74, 0.15)',
  warning: '#EA580C',
  warningBg: 'rgba(234, 88, 12, 0.15)',
  warningText: '#9A3412',
  pending: '#A3A3A3',
  pendingBg: 'rgba(163, 163, 163, 0.12)',
  error: '#EF4444',
  errorBg: 'rgba(239, 68, 68, 0.15)',
  /** Favoris / bookmark */
  bookmark: '#F59E0B',
  /** Status admin / presence */
  statusOk: '#34D399',
  statusBusy: '#FBBF24',

  /** Modules */
  tone1: MASTER_BLUE,
  tone2: MASTER_BLUE_DEEP,
  tone3: MASTER_BLUE_BRIGHT,
  tone4: '#93C5FD',

  /** Compat héritage */
  navy: '#0A0A0A',
  navySoft: '#171717',
  blueBright: MASTER_BLUE_BRIGHT,
  bluePrimary: MASTER_BLUE,
  blueCyan: MASTER_BLUE_BRIGHT,
  gradientStart: '#000000',
  gradientEnd: MASTER_BLUE_DEEP,
} as const;

export const gradients = {
  hero: ['#000000', '#0A0A0A'] as const,
  heroDark: ['#000000', '#000000'] as const,
  card: ['#1A1A1A', '#0A0A0A'] as const,
  cta: [MASTER_BLUE, MASTER_BLUE_DEEP] as const,
} as const;

export const typography = {
  fontFamily: 'Inter_400Regular',
  displayFamily: 'Syne_700Bold',
  brandFamily: 'Sora_700Bold',
  brandSlant: '0deg',
  sizes: {
    hero: 30,
    title: 22,
    section: 17,
    body: 15,
    caption: 12,
    chip: 11,
  },
  weights: {
    regular: '400' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
    black: '900' as const,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  pill: 999,
} as const;

export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 3,
  },
  interactive: {
    shadowColor: MASTER_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  fab: {
    shadowColor: MASTER_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
} as const;

export const brandOverlay = (opacity: number): string =>
  `rgba(${BRAND_RGB}, ${opacity})`;

export const surfaces = {
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardFlat: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pill: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.accentMuted,
  },
} as const;

export const discover = {
  bg: colors.background,
  bgElevated: colors.surface,
  bgMuted: colors.surfaceMuted,
  bgInverse: colors.surfaceInverse,
  ink: colors.ink,
  inkSecondary: colors.inkSecondary,
  inkMuted: colors.inkMuted,
  inkFaint: colors.inkFaint,
  hero: colors.background,
  heroText: colors.brandInverse,
  heroMuted: colors.heroMuted,
  heroLine: 'rgba(255, 255, 255, 0.2)',
  accent: colors.accent,
  accentText: '#000000',
  tone1: colors.tone1,
  tone2: colors.tone2,
  tone3: colors.tone3,
  tone4: colors.tone4,
  border: colors.border,
  borderSoft: colors.border,
  borderMedium: colors.borderMedium,
  radius: {
    sm: radius.sm,
    md: radius.md,
    lg: radius.lg,
    xl: radius.xl,
  },
} as const;

export const discoverType = {
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1.8,
    color: colors.accent,
    textTransform: 'uppercase' as const,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: colors.text,
    letterSpacing: -0.4,
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.textSecondary,
  },
} as const;
