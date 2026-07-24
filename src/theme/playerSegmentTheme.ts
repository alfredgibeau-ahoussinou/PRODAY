import type { ProductLineId } from '../models/ProductLine';
import { colors as baseColors } from './designTokens';
import { amateurColorOverrides } from './prodayAmateurTheme';
import { proColorOverrides } from './proThemeColors';
import type { PlayerSegment } from '../utils/playerSegment';
import type { AppColors } from './universeTheme';

/** Pro joueur masculin — bleu sur FLASH. */
export const proPlayerMaleOverrides = {
  accent: '#60A5FA',
  accentLight: '#93C5FD',
  accentSoft: 'rgba(96, 165, 250, 0.14)',
  accentMuted: 'rgba(96, 165, 250, 0.32)',
  brand: '#60A5FA',
  brandLight: '#93C5FD',
  brandSoft: 'rgba(96, 165, 250, 0.1)',
  ink: '#FAFAFA',
  inkSecondary: '#D4D4D4',
  border: 'rgba(255, 255, 255, 0.1)',
  borderStrong: 'rgba(96, 165, 250, 0.55)',
  background: '#000000',
  backgroundAlt: '#0A0A0A',
  gradientStart: '#000000',
  gradientEnd: '#2563EB',
} as const;

/** Pro joueuse — violet sur FLASH. */
export const proPlayerFemaleOverrides = {
  accent: '#A78BFA',
  accentLight: '#C4B5FD',
  accentSoft: 'rgba(167, 139, 250, 0.14)',
  accentMuted: 'rgba(167, 139, 250, 0.32)',
  brand: '#A78BFA',
  brandLight: '#C4B5FD',
  brandSoft: 'rgba(167, 139, 250, 0.1)',
  ink: '#FAFAFA',
  inkSecondary: '#D4D4D4',
  border: 'rgba(255, 255, 255, 0.1)',
  borderStrong: 'rgba(167, 139, 250, 0.55)',
  background: '#000000',
  backgroundAlt: '#0A0A0A',
  gradientStart: '#000000',
  gradientEnd: '#7C3AED',
} as const;

/** Amateur masculin — orange terrain (palette logo Amateur). */
export const amateurMaleOverrides = amateurColorOverrides;

/** Amateur féminin — corail sur FLASH. */
export const amateurFemaleOverrides = {
  ...amateurColorOverrides,
  accent: '#F472B6',
  accentLight: '#F9A8D4',
  accentSoft: 'rgba(244, 114, 182, 0.14)',
  accentMuted: 'rgba(244, 114, 182, 0.32)',
  brand: '#F472B6',
  brandLight: '#F9A8D4',
  brandSoft: 'rgba(244, 114, 182, 0.1)',
  borderStrong: 'rgba(244, 114, 182, 0.55)',
  borderMedium: 'rgba(244, 114, 182, 0.28)',
  tone1: '#BE185D',
  tone2: '#DB2777',
  tone3: '#F472B6',
  tone4: '#F9A8D4',
  gradientEnd: '#DB2777',
} as const;

/** Amateur mineur — ambre sur FLASH. */
export const amateurMinorOverrides = {
  ...amateurColorOverrides,
  accent: '#FBBF24',
  accentLight: '#FCD34D',
  accentSoft: 'rgba(251, 191, 36, 0.14)',
  accentMuted: 'rgba(251, 191, 36, 0.32)',
  brand: '#FBBF24',
  brandLight: '#FCD34D',
  brandSoft: 'rgba(251, 191, 36, 0.1)',
  borderStrong: 'rgba(251, 191, 36, 0.55)',
  borderMedium: 'rgba(251, 191, 36, 0.28)',
  tone1: '#B45309',
  tone2: '#D97706',
  tone3: '#FBBF24',
  tone4: '#FCD34D',
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
  if (line === 'amateur' || line === 'homme') {
    if (segment === 'female') return amateurFemaleOverrides;
    if (segment === 'minor') return amateurMinorOverrides;
    return amateurMaleOverrides;
  }
  if (line === 'woman') return amateurFemaleOverrides;
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
