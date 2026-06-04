import { colors as baseColors, type colors as BaseColorsType } from './designTokens';

/** Palette rose — univers ProDay Girl */
export const girlColorOverrides = {
  accent: '#BE185D',
  accentLight: '#DB2777',
  accentSoft: '#FCE7F3',
  accentMuted: '#F9A8D4',
  brand: '#9D174D',
  brandLight: '#BE185D',
  brandSoft: '#FDF2F8',
  brandInverse: '#FFFFFF',
  ink: '#831843',
  inkSecondary: '#9D174D',
  inkMuted: '#BE185D',
  inkFaint: '#F472B6',
  background: '#FFF5F8',
  backgroundAlt: '#FCE7F3',
  surface: '#FFFFFF',
  surfaceMuted: '#FDF2F8',
  surfaceInverse: '#831843',
  heroMuted: 'rgba(255, 255, 255, 0.78)',
  border: '#FBCFE8',
  borderStrong: '#BE185D',
  borderMedium: '#F9A8D4',
  text: '#831843',
  textSecondary: '#9D174D',
  textMuted: '#BE185D',
  tone1: '#831843',
  tone2: '#9D174D',
  tone3: '#BE185D',
  tone4: '#DB2777',
  navy: '#831843',
  navySoft: '#9D174D',
  blueBright: '#BE185D',
  bluePrimary: '#9D174D',
  blueCyan: '#DB2777',
  gradientStart: '#9D174D',
  gradientEnd: '#BE185D',
  success: '#059669',
  successBg: '#D1FAE5',
} as const;

export type AppColors = { [K in keyof typeof baseColors]: string };

export function getThemedColors(isGirl: boolean): AppColors {
  if (!isGirl) return { ...baseColors };
  return { ...baseColors, ...girlColorOverrides };
}

export const girlGradients = {
  hero: ['#9D174D', '#BE185D'] as const,
  heroDark: ['#831843', '#9D174D'] as const,
  card: ['#FCE7F3', '#FFFFFF'] as const,
  cta: ['#BE185D', '#DB2777'] as const,
};
