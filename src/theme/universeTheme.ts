import { colors as baseColors } from './designTokens';
import type { ProductLineId } from '../models/ProductLine';
import { womanColorOverrides } from './prodayWomanTheme';

/** Palette ProDay Pro — bleu pro, distinct Homme (noir) et Woman (rose). */
export const proColorOverrides = {
  accent: '#1D4ED8',
  accentLight: '#2563EB',
  accentSoft: '#EFF6FF',
  accentMuted: '#BFDBFE',
  brand: '#1E3A8A',
  brandLight: '#1D4ED8',
  brandSoft: '#F0F9FF',
  brandInverse: '#FFFFFF',
  ink: '#1E3A8A',
  inkSecondary: '#1D4ED8',
  inkMuted: '#3B82F6',
  inkFaint: '#93C5FD',
  background: '#F8FAFC',
  backgroundAlt: '#EFF6FF',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F5F9',
  surfaceInverse: '#1E3A8A',
  heroMuted: 'rgba(255, 255, 255, 0.78)',
  border: '#DBEAFE',
  borderStrong: '#1D4ED8',
  borderMedium: '#BFDBFE',
  text: '#0F172A',
  textSecondary: '#334155',
  textMuted: '#64748B',
  tone1: '#1E3A8A',
  tone2: '#1D4ED8',
  tone3: '#2563EB',
  tone4: '#3B82F6',
  navy: '#1E3A8A',
  navySoft: '#1D4ED8',
  blueBright: '#2563EB',
  bluePrimary: '#1D4ED8',
  blueCyan: '#3B82F6',
  gradientStart: '#1E3A8A',
  gradientEnd: '#1D4ED8',
  success: '#059669',
  successBg: '#D1FAE5',
} as const;

export type AppColors = { [K in keyof typeof baseColors]: string };

export function getThemedColorsForLine(line: ProductLineId): AppColors {
  if (line === 'woman') return { ...baseColors, ...womanColorOverrides };
  if (line === 'pro') return { ...baseColors, ...proColorOverrides };
  return { ...baseColors };
}

/** @deprecated Préférer getThemedColorsForLine */
export function getThemedColors(isWoman: boolean): AppColors {
  return getThemedColorsForLine(isWoman ? 'woman' : 'homme');
}

export { womanColorOverrides, womanGradients } from './prodayWomanTheme';

export const proGradients = {
  hero: ['#1E3A8A', '#1D4ED8'] as const,
  heroDark: ['#0F172A', '#1E3A8A'] as const,
  card: ['#EFF6FF', '#FFFFFF'] as const,
  cta: ['#1D4ED8', '#2563EB'] as const,
};
