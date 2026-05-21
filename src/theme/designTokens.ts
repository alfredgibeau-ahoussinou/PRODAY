/**
 * ProDay — tokens alignés maquette (#003399, fond clair, cartes blanches)
 */

export const BRAND = {
  name: 'ProDay',
  tagline: 'CONNECTER • PROGRESSER • RÉUSSIR',
} as const;

export const colors = {
  /** Bleu principal maquette */
  brand: '#003399',
  brandLight: '#1A4FBF',
  brandSoft: '#E8EEF8',

  blueBright: '#2563EB',
  bluePrimary: '#003399',
  blueCyan: '#38BDF8',
  navy: '#0F172A',
  navySoft: '#1E3A5F',

  background: '#F4F6FA',
  surface: '#FFFFFF',
  surfaceMuted: '#E8ECF2',
  border: '#DDE3ED',

  text: '#1A1F36',
  textSecondary: '#5C6478',
  textMuted: '#8B93A8',

  success: '#16A34A',
  successBg: '#DCFCE7',
  warning: '#EA580C',
  warningBg: '#FFEDD5',
  pending: '#64748B',
  pendingBg: '#F1F5F9',
  error: '#DC2626',
  errorBg: '#FEE2E2',

  gradientStart: '#38BDF8',
  gradientEnd: '#003399',
} as const;

export const typography = {
  fontFamily: 'Inter',
  brandSlant: '-4deg',
  sizes: {
    hero: 26,
    title: 22,
    section: 16,
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
  xl: 20,
  pill: 999,
} as const;

export const shadows = {
  card: {
    shadowColor: '#003399',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  fab: {
    shadowColor: '#003399',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
  },
} as const;
