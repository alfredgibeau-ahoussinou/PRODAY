import { colors as baseColors } from './designTokens';

/** Palette Woman — rose sur fond FLASH noir. */
export const womanColorOverrides = {
  accent: '#F472B6',
  accentLight: '#F9A8D4',
  accentSoft: 'rgba(244, 114, 182, 0.14)',
  accentMuted: 'rgba(244, 114, 182, 0.32)',
  brand: '#F472B6',
  brandLight: '#F9A8D4',
  brandSoft: 'rgba(244, 114, 182, 0.1)',
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
  borderStrong: 'rgba(244, 114, 182, 0.55)',
  borderMedium: 'rgba(244, 114, 182, 0.28)',
  text: '#FAFAFA',
  textSecondary: '#D4D4D4',
  textMuted: '#A3A3A3',
  tone1: '#BE185D',
  tone2: '#DB2777',
  tone3: '#F472B6',
  tone4: '#F9A8D4',
  navy: '#0A0A0F',
  navySoft: '#121218',
  blueBright: '#F472B6',
  bluePrimary: '#DB2777',
  blueCyan: '#F9A8D4',
  gradientStart: '#000000',
  gradientEnd: '#BE185D',
  success: '#059669',
  successBg: 'rgba(5, 150, 105, 0.15)',
} as const;

export type AppColors = { [K in keyof typeof baseColors]: string };

export function getThemedColors(isWoman: boolean): AppColors {
  if (!isWoman) return { ...baseColors };
  return { ...baseColors, ...womanColorOverrides };
}

export const womanGradients = {
  hero: ['#000000', '#831843'] as const,
  heroDark: ['#000000', '#4a0d28'] as const,
  card: ['#1A1A24', '#0A0A0F'] as const,
  cta: ['#BE185D', '#DB2777'] as const,
};
