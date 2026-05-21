/**
 * ProDay — design tokens (maquettes officielles)
 * Logo : dégradé bleu vif → navy, typo inclinée, tagline CONNECTER • PROGRESSER • RÉUSSIR
 */

export const BRAND = {
  name: 'ProDay',
  tagline: 'CONNECTER • PROGRESSER • RÉUSSIR',
} as const;

/** Couleurs extraites des maquettes (fond clair, accents bleu / navy) */
export const colors = {
  // Logo & primaire
  blueBright: '#2563EB',
  bluePrimary: '#1D4ED8',
  blueCyan: '#38BDF8',
  navy: '#0F172A',
  navySoft: '#1E3A5F',

  // Fonds (UI claire comme les mockups)
  background: '#F1F5F9',
  surface: '#FFFFFF',
  surfaceMuted: '#E2E8F0',
  border: '#CBD5E1',

  // Texte
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',

  // États
  success: '#16A34A',
  successBg: '#DCFCE7',
  warning: '#EA580C',
  warningBg: '#FFEDD5',
  error: '#DC2626',
  errorBg: '#FEE2E2',

  // Dégradé logo (gauche → droite)
  gradientStart: '#38BDF8',
  gradientEnd: '#1E3A8A',
} as const;

export const typography = {
  fontFamily: 'Inter',
  /** Wordmark légèrement incliné comme le logo */
  brandSlant: '-4deg',
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
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const shadows = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  fab: {
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;
