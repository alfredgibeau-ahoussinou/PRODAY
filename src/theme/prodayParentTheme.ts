import { PRODAY_POLE_ACCENTS, poleAccentSoft } from './prodayBrand';

const A = PRODAY_POLE_ACCENTS.parent;

/** Palette Parent — orange officiel #F97316. */
export const parentColorOverrides = {
  accent: A,
  accentLight: '#FB923C',
  accentSoft: poleAccentSoft('parent', 0.14),
  accentMuted: poleAccentSoft('parent', 0.32),
  brand: A,
  brandLight: '#FB923C',
  brandSoft: poleAccentSoft('parent', 0.12),
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
  borderStrong: poleAccentSoft('parent', 0.55),
  borderMedium: poleAccentSoft('parent', 0.28),
  text: '#FAFAFA',
  textSecondary: '#D4D4D4',
  textMuted: '#A3A3A3',
  tone1: '#C2410C',
  tone2: A,
  tone3: '#FB923C',
  tone4: '#FDBA74',
  navy: '#0A0A0A',
  navySoft: '#171717',
  blueBright: '#FB923C',
  bluePrimary: A,
  blueCyan: '#FB923C',
  gradientStart: '#000000',
  gradientEnd: '#C2410C',
  success: '#059669',
  successBg: 'rgba(5, 150, 105, 0.15)',
} as const;

export const parentGradients = {
  hero: ['#000000', '#431407'] as const,
  heroDark: ['#000000', '#1c0a02'] as const,
  card: ['#1A1A1A', '#0A0A0A'] as const,
  cta: ['#C2410C', A] as const,
} as const;
