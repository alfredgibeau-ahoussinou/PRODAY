import type { ProductLineId } from '../models/ProductLine';
import { colors as baseColors } from './designTokens';
import { amateurColorOverrides } from './prodayAmateurTheme';
import { proColorOverrides } from './proThemeColors';
import { womanColorOverrides } from './prodayWomanTheme';
import type { PlayerSegment } from '../utils/playerSegment';
import type { AppColors } from './universeTheme';

/** Pro joueur masculin — bleu performance (aligné logo Pro Joueur). */
export const proPlayerMaleOverrides = {
  accent: '#1D4ED8',
  accentLight: '#2563EB',
  accentSoft: '#DBEAFE',
  accentMuted: '#BFDBFE',
  brand: '#1E3A8A',
  brandLight: '#2563EB',
  brandSoft: '#EFF6FF',
  ink: '#1E3A8A',
  inkSecondary: '#1D4ED8',
  border: '#BFDBFE',
  borderStrong: '#2563EB',
  background: '#F8FAFC',
  backgroundAlt: '#EFF6FF',
  gradientStart: '#1E3A8A',
  gradientEnd: '#2563EB',
} as const;

/** Pro joueuse — violet/rose pro (distinct du pôle Woman amateur). */
export const proPlayerFemaleOverrides = {
  accent: '#7C3AED',
  accentLight: '#8B5CF6',
  accentSoft: '#EDE9FE',
  accentMuted: '#DDD6FE',
  brand: '#5B21B6',
  brandLight: '#7C3AED',
  brandSoft: '#F5F3FF',
  ink: '#5B21B6',
  inkSecondary: '#6D28D9',
  border: '#DDD6FE',
  borderStrong: '#7C3AED',
  background: '#FAF5FF',
  backgroundAlt: '#F5F3FF',
  gradientStart: '#5B21B6',
  gradientEnd: '#7C3AED',
} as const;

/** Amateur masculin — orange terrain (palette logo Amateur). */
export const amateurMaleOverrides = amateurColorOverrides;

/** Amateur féminin — corail/rose chaud. */
export const amateurFemaleOverrides = {
  accent: '#DB2777',
  accentLight: '#EC4899',
  accentSoft: '#FCE7F3',
  accentMuted: '#FBCFE8',
  brand: '#9D174D',
  brandLight: '#DB2777',
  brandSoft: '#FFF1F2',
  ink: '#9D174D',
  inkSecondary: '#BE185D',
  border: '#FBCFE8',
  borderStrong: '#DB2777',
  background: '#FFF5F7',
  backgroundAlt: '#FFF1F2',
  gradientStart: '#9D174D',
  gradientEnd: '#DB2777',
} as const;

/** Amateur mineur — ambre jeunesse. */
export const amateurMinorOverrides = {
  accent: '#D97706',
  accentLight: '#F59E0B',
  accentSoft: '#FEF3C7',
  accentMuted: '#FDE68A',
  brand: '#B45309',
  brandLight: '#D97706',
  brandSoft: '#FFFBEB',
  ink: '#92400E',
  inkSecondary: '#B45309',
  border: '#FDE68A',
  borderStrong: '#D97706',
  background: '#FFFBEB',
  backgroundAlt: '#FEF3C7',
  gradientStart: '#B45309',
  gradientEnd: '#D97706',
} as const;

function mergeColors(overrides: Record<string, string>): AppColors {
  return { ...baseColors, ...overrides };
}

export function getSegmentColorOverrides(
  line: ProductLineId,
  segment: PlayerSegment,
): Partial<AppColors> {
  if (line === 'pro_player') {
    return segment === 'female' ? proPlayerFemaleOverrides : proPlayerMaleOverrides;
  }
  if (line === 'amateur') {
    if (segment === 'female') return amateurFemaleOverrides;
    if (segment === 'minor') return amateurMinorOverrides;
    return amateurMaleOverrides;
  }
  if (line === 'woman') return womanColorOverrides;
  if (line === 'pro' || line === 'pro_club' || line === 'pro_staff') {
    return proColorOverrides;
  }
  return {};
}

export function getThemedColorsForSegment(
  line: ProductLineId,
  segment: PlayerSegment | null,
): AppColors {
  if (segment && lineUsesSegmentLine(line)) {
    return mergeColors(getSegmentColorOverrides(line, segment));
  }
  return mergeColors(getSegmentColorOverrides(line, 'male'));
}

function lineUsesSegmentLine(line: ProductLineId): boolean {
  return line === 'amateur' || line === 'pro_player';
}
