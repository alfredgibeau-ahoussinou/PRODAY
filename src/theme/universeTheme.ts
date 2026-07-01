import { colors as baseColors } from './designTokens';
import type { ProductLineId } from '../models/ProductLine';
import { womanColorOverrides } from './prodayWomanTheme';
import { amateurColorOverrides } from './prodayAmateurTheme';
import { supporterColorOverrides } from './prodaySupporterTheme';
import { santeColorOverrides } from './prodaySanteTheme';
import type { PlayerSegment } from '../utils/playerSegment';
import { getThemedColorsForSegment } from './playerSegmentTheme';

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

/** Homme — monochrome + touche terrain (vert discret). */
export const hommeColorOverrides = {
  accentSoft: '#F0FDF4',
  accentMuted: '#BBF7D0',
  brandSoft: '#F0FDF4',
  background: '#F6F8F6',
  backgroundAlt: '#ECFDF5',
  surfaceMuted: '#F4FAF6',
  border: '#D8E8DE',
  borderStrong: '#15803D',
  borderMedium: '#BBF7D0',
  tone4: '#15803D',
  gradientEnd: '#15803D',
} as const;

export function getThemedColorsForLine(
  line: ProductLineId,
  segment?: PlayerSegment | null,
): AppColors {
  if (segment && (line === 'amateur' || line === 'pro_player')) {
    return getThemedColorsForSegment(line, segment);
  }
  if (line === 'woman') return { ...baseColors, ...womanColorOverrides };
  if (line === 'amateur') return { ...baseColors, ...amateurColorOverrides };
  if (line === 'supporter') return { ...baseColors, ...supporterColorOverrides };
  if (line === 'pro' || line === 'pro_player' || line === 'pro_club' || line === 'pro_staff') {
    return { ...baseColors, ...proColorOverrides };
  }
  if (line === 'sante') return { ...baseColors, ...santeColorOverrides };
  return { ...baseColors, ...hommeColorOverrides };
}

/** @deprecated Préférer getThemedColorsForLine */
export function getThemedColors(isWoman: boolean): AppColors {
  return getThemedColorsForLine(isWoman ? 'woman' : 'homme');
}

export { womanColorOverrides, womanGradients } from './prodayWomanTheme';
export { amateurColorOverrides, amateurGradients } from './prodayAmateurTheme';
export { supporterColorOverrides, supporterGradients } from './prodaySupporterTheme';
export { santeColorOverrides, santeGradients } from './prodaySanteTheme';

export const proGradients = {
  hero: ['#1E3A8A', '#1D4ED8'] as const,
  heroDark: ['#0F172A', '#1E3A8A'] as const,
  card: ['#EFF6FF', '#FFFFFF'] as const,
  cta: ['#1D4ED8', '#2563EB'] as const,
};
