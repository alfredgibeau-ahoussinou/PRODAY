/**
 * ProDay — design system v2
 * Monochrome · noir & neutres · accents discrets
 */

export const BRAND = {
  name: 'ProDay',
  tagline: 'CONNECTER • PROGRESSER • RÉUSSIR',
} as const;

/** RGB marque (#0A0A0A) — overlays photos */
export const BRAND_RGB = '10, 10, 10' as const;

export const colors = {
  /** Noir ProDay — accent principal */
  accent: '#0A0A0A',
  accentLight: '#262626',
  accentSoft: '#F0F0F0',
  accentMuted: '#D4D4D4',

  /** Texte & marque */
  brand: '#0A0A0A',
  brandLight: '#262626',
  brandSoft: '#F0F0F0',
  brandInverse: '#FFFFFF',

  ink: '#0A0A0A',
  inkSecondary: '#525252',
  inkMuted: '#737373',
  inkFaint: '#A3A3A3',

  /** Fonds neutres */
  background: '#F7F7F7',
  backgroundAlt: '#EEEEEE',
  surface: '#FFFFFF',
  surfaceMuted: '#F3F3F3',
  surfaceInverse: '#0A0A0A',
  heroMuted: 'rgba(255, 255, 255, 0.72)',

  /** Bordures */
  border: '#E5E5E5',
  borderStrong: '#0A0A0A',
  borderMedium: '#CCCCCC',

  text: '#0A0A0A',
  textSecondary: '#525252',
  textMuted: '#737373',

  /** États (sémantiques uniquement — pas la marque) */
  success: '#16A34A',
  successBg: '#DCFCE7',
  warning: '#EA580C',
  warningBg: '#FFEDD5',
  pending: '#737373',
  pendingBg: '#F3F3F3',
  error: '#DC2626',
  errorBg: '#FEE2E2',

  /** Modules — nuances de gris */
  tone1: '#0A0A0A',
  tone2: '#262626',
  tone3: '#525252',
  tone4: '#737373',

  /** Compat héritage → noir */
  navy: '#0A0A0A',
  navySoft: '#262626',
  blueBright: '#404040',
  bluePrimary: '#0A0A0A',
  blueCyan: '#525252',
  gradientStart: '#0A0A0A',
  gradientEnd: '#262626',
} as const;

export const gradients = {
  hero: ['#0A0A0A', '#262626'] as const,
  heroDark: ['#0A0A0A', '#171717'] as const,
  card: ['#F0F0F0', '#FFFFFF'] as const,
  cta: ['#0A0A0A', '#262626'] as const,
} as const;

export const typography = {
  fontFamily: 'Inter',
  brandSlant: '-3deg',
  sizes: {
    hero: 28,
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
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  interactive: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 5,
  },
  fab: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;

/** Overlay sombre sur photos */
export const brandOverlay = (opacity: number): string =>
  `rgba(${BRAND_RGB}, ${opacity})`;

/** Styles de surface réutilisables */
export const surfaces = {
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardFlat: {
    backgroundColor: colors.surface,
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
  hero: colors.surfaceInverse,
  heroText: colors.brandInverse,
  heroMuted: colors.heroMuted,
  heroLine: 'rgba(255, 255, 255, 0.28)',
  accent: colors.accent,
  accentText: colors.brandInverse,
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
    color: colors.textSecondary,
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
