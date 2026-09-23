import { PRODAY_POLE_ACCENTS, poleAccentSoft } from './prodayBrand';

const A = PRODAY_POLE_ACCENTS.parent;

/** Palette Parent — vert lime officiel #8CC63F. */
export const parentColorOverrides = {
  accent: A,
  accentLight: '#B6E06A',
  accentSoft: poleAccentSoft('parent', 0.14),
  accentMuted: poleAccentSoft('parent', 0.32),
  brand: A,
  brandLight: '#B6E06A',
  brandSoft: poleAccentSoft('parent', 0.12),
  brandInverse: '#FFFFFF',
  ink: '#FAFAFA',
  inkSecondary: '#D4D4D4',
  inkMuted: '#A3A3A3',
  inkFaint: '#737373',
  background: '#000000',
  backgroundAlt: '#0A0A0F',
  surface: '#121218',
  surfaceMuted: '#1A1A24',
  surfaceInverse: '#FAFAFA',
  heroMuted: 'rgba(255, 255, 255, 0.72)',
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: poleAccentSoft('parent', 0.55),
  borderMedium: poleAccentSoft('parent', 0.28),
  text: '#FAFAFA',
  textSecondary: '#D4D4D4',
  textMuted: '#A3A3A3',
  tone1: '#6B9A2E',
  tone2: A,
  tone3: '#B6E06A',
  tone4: '#D4F08A',
  navy: '#0A0A0F',
  navySoft: '#121218',
  blueBright: '#B6E06A',
  bluePrimary: A,
  blueCyan: '#B6E06A',
  gradientStart: '#000000',
  gradientEnd: '#6B9A2E',
  success: '#059669',
  successBg: 'rgba(5, 150, 105, 0.15)',
} as const;

export const parentGradients = {
  hero: ['#000000', '#141A06'] as const,
  heroDark: ['#000000', '#0A0C04'] as const,
  card: ['#1A1A24', '#0A0A0F'] as const,
  cta: ['#6B9A2E', A] as const,
} as const;
