import { colors as baseColors } from './designTokens';
import type { ProductLineId } from '../models/ProductLine';
import { womanColorOverrides } from './prodayWomanTheme';
import { amateurColorOverrides } from './prodayAmateurTheme';
import { supporterColorOverrides } from './prodaySupporterTheme';
import { santeColorOverrides } from './prodaySanteTheme';
import { parentColorOverrides } from './prodayParentTheme';
import type { PlayerSegment } from '../utils/playerSegment';
import { getThemedColorsForSegment } from './playerSegmentTheme';
import { proColorOverrides } from './proThemeColors';
import { getSponsorAppColors } from '../content/sponsorExperience';

export { proColorOverrides, proGradients } from './proThemeColors';

export type AppColors = { [K in keyof typeof baseColors]: string };

/** Homme — FLASH noir + accent joueur blanc officiel. */
export const hommeColorOverrides = {
  accent: '#FFFFFF',
  accentLight: '#F5F5F5',
  accentSoft: 'rgba(255, 255, 255, 0.14)',
  accentMuted: 'rgba(255, 255, 255, 0.32)',
  brand: '#FFFFFF',
  brandLight: '#F5F5F5',
  brandSoft: 'rgba(255, 255, 255, 0.1)',
  borderStrong: 'rgba(255, 255, 255, 0.55)',
  borderMedium: 'rgba(255, 255, 255, 0.28)',
  tone4: '#FFFFFF',
  gradientEnd: '#E5E5E5',
} as const;

export function getThemedColorsForLine(
  line: ProductLineId,
  segment?: PlayerSegment | null,
): AppColors {
  if (segment && (line === 'amateur' || line === 'pro_player' || line === 'homme' || line === 'woman')) {
    const themeLine = line === 'homme' || line === 'woman' ? 'amateur' : line;
    return getThemedColorsForSegment(themeLine, segment);
  }
  if (line === 'woman') return getThemedColorsForSegment('amateur', 'female');
  if (line === 'homme') return getThemedColorsForSegment('amateur', 'male');
  if (line === 'amateur') return { ...baseColors, ...amateurColorOverrides };
  if (line === 'supporter') return { ...baseColors, ...supporterColorOverrides };
  if (line === 'sponsor') return getSponsorAppColors();
  if (line === 'pro' || line === 'pro_player' || line === 'pro_club' || line === 'pro_staff') {
    return { ...baseColors, ...proColorOverrides };
  }
  if (line === 'sante') return { ...baseColors, ...santeColorOverrides };
  if (line === 'parent') return { ...baseColors, ...parentColorOverrides };
  return { ...baseColors, ...amateurColorOverrides };
}

/** @deprecated Préférer getThemedColorsForLine */
export function getThemedColors(isWoman: boolean): AppColors {
  return getThemedColorsForLine(isWoman ? 'woman' : 'homme');
}

export { womanColorOverrides, womanGradients } from './prodayWomanTheme';
export { amateurColorOverrides, amateurGradients } from './prodayAmateurTheme';
export { supporterColorOverrides, supporterGradients } from './prodaySupporterTheme';
export { santeColorOverrides, santeGradients } from './prodaySanteTheme';
export { parentColorOverrides, parentGradients } from './prodayParentTheme';
