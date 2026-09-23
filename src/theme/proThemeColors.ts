import { PRODAY_POLE_ACCENTS, poleAccentSoft } from './prodayBrand';

const A = PRODAY_POLE_ACCENTS.coach;

/**
 * Palette Coach / Pro staff — or officiel #C5A059.
 * Surfaces & texte alignés DESIGN.md §2 (Dark Premium).
 */
export const proColorOverrides = {
  accent: A,
  accentLight: '#E8B923',
  accentSoft: poleAccentSoft('coach', 0.14),
  accentMuted: poleAccentSoft('coach', 0.32),
  brand: A,
  brandLight: '#E8B923',
  brandSoft: poleAccentSoft('coach', 0.1),
  brandInverse: '#FFFFFF',
  ink: '#FFFFFF',
  inkSecondary: '#D4D4D4',
  inkMuted: '#8B8B9A',
  inkFaint: '#737373',
  background: '#000000',
  backgroundAlt: '#0A0A0F',
  surface: '#121218',
  surfaceMuted: '#1A1A24',
  surfaceInverse: '#FAFAFA',
  heroMuted: 'rgba(255, 255, 255, 0.72)',
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.14)',
  borderMedium: 'rgba(255, 255, 255, 0.14)',
  borderActive: poleAccentSoft('coach', 0.45),
  text: '#FFFFFF',
  textSecondary: '#D4D4D4',
  textMuted: '#8B8B9A',
  tone1: '#9A7B2F',
  tone2: A,
  tone3: '#E8B923',
  tone4: '#F5E6C8',
  navy: '#0A0A0F',
  navySoft: '#121218',
  blueBright: '#E8B923',
  bluePrimary: A,
  blueCyan: '#E8B923',
  gradientStart: '#000000',
  gradientEnd: '#9A7B2F',
  success: '#059669',
  successBg: 'rgba(5, 150, 105, 0.15)',
} as const;

export const proGradients = {
  hero: ['#000000', '#1A1408'] as const,
  heroDark: ['#000000', '#0A0A0F'] as const,
  card: ['#1A1A24', '#0A0A0F'] as const,
  cta: ['#9A7B2F', A] as const,
};
