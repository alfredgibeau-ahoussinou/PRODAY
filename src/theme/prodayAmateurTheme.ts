import { PRODAY_POLE_ACCENTS, poleAccentSoft } from './prodayBrand';

const A = PRODAY_POLE_ACCENTS.player;

/** Palette Joueur — blanc officiel #FFFFFF sur fond premium. */
export const amateurColorOverrides = {
  accent: A,
  accentLight: '#5B73FF',
  accentSoft: poleAccentSoft('player', 0.14),
  accentMuted: poleAccentSoft('player', 0.32),
  brand: A,
  brandLight: '#5B73FF',
  brandSoft: poleAccentSoft('player', 0.1),
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
  borderStrong: poleAccentSoft('player', 0.55),
  borderMedium: poleAccentSoft('player', 0.28),
  text: '#FAFAFA',
  textSecondary: '#D4D4D4',
  textMuted: '#A3A3A3',
  tone1: '#1529CC',
  tone2: A,
  tone3: '#5B73FF',
  tone4: '#93A4FF',
  navy: '#0A0A0F',
  navySoft: '#121218',
  blueBright: '#5B73FF',
  bluePrimary: A,
  blueCyan: '#5B73FF',
  gradientStart: '#000000',
  gradientEnd: '#1529CC',
  success: '#16A34A',
  successBg: 'rgba(22, 163, 74, 0.15)',
} as const;

export const amateurGradients = {
  hero: ['#000000', '#0A0A0F'] as const,
  heroDark: ['#000000', '#050505'] as const,
  card: ['#1A1A24', '#0A0A0F'] as const,
  cta: ['#E5E5E5', A] as const,
};
