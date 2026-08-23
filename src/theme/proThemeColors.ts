import { PRODAY_POLE_ACCENTS, poleAccentSoft } from './prodayBrand';

const A = PRODAY_POLE_ACCENTS.coach;

/** Palette Coach / Pro staff — vert officiel #22C55E. */
export const proColorOverrides = {
  accent: A,
  accentLight: '#4ADE80',
  accentSoft: poleAccentSoft('coach', 0.14),
  accentMuted: poleAccentSoft('coach', 0.32),
  brand: A,
  brandLight: '#4ADE80',
  brandSoft: poleAccentSoft('coach', 0.1),
  brandInverse: '#FFFFFF',
  ink: '#FAFAFA',
  inkSecondary: '#D4D4D4',
  inkMuted: '#A3A3A3',
  inkFaint: '#737373',
  background: '#000000',
  backgroundAlt: '#0A0A0A',
  surface: '#141414',
  surfaceMuted: '#1A1A1A',
  surfaceInverse: '#FAFAFA',
  heroMuted: 'rgba(255, 255, 255, 0.72)',
  border: 'rgba(255, 255, 255, 0.1)',
  borderStrong: poleAccentSoft('coach', 0.55),
  borderMedium: poleAccentSoft('coach', 0.28),
  text: '#FAFAFA',
  textSecondary: '#D4D4D4',
  textMuted: '#A3A3A3',
  tone1: '#15803D',
  tone2: A,
  tone3: '#4ADE80',
  tone4: '#86EFAC',
  navy: '#0A0A0A',
  navySoft: '#171717',
  blueBright: '#4ADE80',
  bluePrimary: A,
  blueCyan: '#4ADE80',
  gradientStart: '#000000',
  gradientEnd: '#15803D',
  success: '#059669',
  successBg: 'rgba(5, 150, 105, 0.15)',
} as const;

export const proGradients = {
  hero: ['#000000', '#052e16'] as const,
  heroDark: ['#000000', '#0A0A0A'] as const,
  card: ['#1A1A1A', '#0A0A0A'] as const,
  cta: ['#15803D', A] as const,
};
