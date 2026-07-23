import { colors as baseColors } from './designTokens';
import type { ProductLineId } from '../models/ProductLine';
import { womanColorOverrides } from './prodayWomanTheme';
import { amateurColorOverrides } from './prodayAmateurTheme';
import { supporterColorOverrides } from './prodaySupporterTheme';
import { santeColorOverrides } from './prodaySanteTheme';
import type { PlayerSegment } from '../utils/playerSegment';
import { getThemedColorsForSegment } from './playerSegmentTheme';
import { proColorOverrides } from './proThemeColors';

export { proColorOverrides, proGradients } from './proThemeColors';

export type AppColors = { [K in keyof typeof baseColors]: string };

/** Homme — FLASH noir + touche terrain (vert discret). */
export const hommeColorOverrides = {
  accent: '#4ADE80',
  accentLight: '#86EFAC',
  accentSoft: 'rgba(74, 222, 128, 0.14)',
  accentMuted: 'rgba(74, 222, 128, 0.32)',
  brand: '#4ADE80',
  brandLight: '#86EFAC',
  brandSoft: 'rgba(74, 222, 128, 0.1)',
  borderStrong: 'rgba(74, 222, 128, 0.55)',
  borderMedium: 'rgba(74, 222, 128, 0.28)',
  tone4: '#4ADE80',
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
