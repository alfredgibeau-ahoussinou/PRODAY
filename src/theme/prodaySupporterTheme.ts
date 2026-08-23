import { PRODAY_POLE_ACCENTS, poleAccentSoft } from './prodayBrand';

const A = PRODAY_POLE_ACCENTS.supporter;

/** Palette Supporter — cyan officiel #06B6D4. */
export const supporterColorOverrides = {
  accent: A,
  accentLight: '#22D3EE',
  accentSoft: poleAccentSoft('supporter', 0.14),
  accentMuted: poleAccentSoft('supporter', 0.32),
  brand: A,
  brandLight: '#22D3EE',
  brandSoft: poleAccentSoft('supporter', 0.1),
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
  borderStrong: poleAccentSoft('supporter', 0.55),
  borderMedium: poleAccentSoft('supporter', 0.28),
  text: '#FAFAFA',
  textSecondary: '#D4D4D4',
  textMuted: '#A3A3A3',
  tone1: '#0E7490',
  tone2: A,
  tone3: '#22D3EE',
  tone4: '#67E8F9',
  navy: '#0A0A0A',
  navySoft: '#171717',
  blueBright: '#22D3EE',
  bluePrimary: A,
  blueCyan: '#22D3EE',
  gradientStart: '#000000',
  gradientEnd: '#0E7490',
  success: '#16A34A',
  successBg: 'rgba(22, 163, 74, 0.15)',
} as const;

export const supporterGradients = {
  hero: ['#000000', '#083344'] as const,
  heroDark: ['#000000', '#0A0A0A'] as const,
  card: ['#1A1A1A', '#0A0A0A'] as const,
  cta: ['#0E7490', A] as const,
};

export const SUPPORTER_SITE = {
  accent: supporterColorOverrides.accent,
  soft: supporterColorOverrides.accentSoft,
  glow: poleAccentSoft('supporter', 0.22),
  border: supporterColorOverrides.border,
  foreground: supporterColorOverrides.text,
  muted: supporterColorOverrides.textMuted,
  live: PRODAY_POLE_ACCENTS.coach,
} as const;
