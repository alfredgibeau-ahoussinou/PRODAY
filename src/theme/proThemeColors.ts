import { PRODAY_POLE_ACCENTS, poleAccentSoft } from './prodayBrand';

const A = PRODAY_POLE_ACCENTS.coach;

/** Palette Coach / Pro staff — or officiel #C5A059. */
export const proColorOverrides = {
  accent: A,
  accentLight: '#E8D5A3',
  accentSoft: poleAccentSoft('coach', 0.14),
  accentMuted: poleAccentSoft('coach', 0.32),
  brand: A,
  brandLight: '#E8D5A3',
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
  tone1: '#9A7B2F',
  tone2: A,
  tone3: '#E8D5A3',
  tone4: '#F5E6C8',
  navy: '#0A0A0A',
  navySoft: '#171717',
  blueBright: '#E8D5A3',
  bluePrimary: A,
  blueCyan: '#E8D5A3',
  gradientStart: '#000000',
  gradientEnd: '#9A7B2F',
  success: '#059669',
  successBg: 'rgba(5, 150, 105, 0.15)',
} as const;

export const proGradients = {
  hero: ['#000000', '#1A1408'] as const,
  heroDark: ['#000000', '#0A0A0A'] as const,
  card: ['#1A1A1A', '#0A0A0A'] as const,
  cta: ['#9A7B2F', A] as const,
};
