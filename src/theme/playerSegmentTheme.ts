import type { ProductLineId } from '../models/ProductLine';
import { colors as baseColors } from './designTokens';
import { amateurColorOverrides } from './prodayAmateurTheme';
import { proColorOverrides } from './proThemeColors';
import type { PlayerSegment } from '../utils/playerSegment';
import type { AppColors } from './universeTheme';

import { PRODAY_POLE_ACCENTS, poleAccentSoft } from './prodayBrand';

/** Pro joueur masculin — blanc pôle Joueur. */
export const proPlayerMaleOverrides = {
  accent: PRODAY_POLE_ACCENTS.player,
  accentLight: '#F5F5F5',
  accentSoft: poleAccentSoft('player', 0.14),
  accentMuted: poleAccentSoft('player', 0.32),
  brand: PRODAY_POLE_ACCENTS.player,
  brandLight: '#F5F5F5',
  brandSoft: poleAccentSoft('player', 0.1),
  ink: '#FAFAFA',
  inkSecondary: '#D4D4D4',
  border: 'rgba(255, 255, 255, 0.1)',
  borderStrong: poleAccentSoft('player', 0.55),
  background: '#000000',
  backgroundAlt: '#0A0A0A',
  gradientStart: '#000000',
  gradientEnd: '#E5E5E5',
} as const;

/** Pro joueuse — même pôle Joueur, nuance un peu plus claire. */
export const proPlayerFemaleOverrides = {
  accent: '#5B73FF',
  accentLight: '#93A4FF',
  accentSoft: 'rgba(91, 115, 255, 0.14)',
  accentMuted: 'rgba(91, 115, 255, 0.32)',
  brand: '#5B73FF',
  brandLight: '#93A4FF',
  brandSoft: 'rgba(91, 115, 255, 0.1)',
  ink: '#FAFAFA',
  inkSecondary: '#D4D4D4',
  border: 'rgba(255, 255, 255, 0.1)',
  borderStrong: 'rgba(91, 115, 255, 0.55)',
  background: '#000000',
  backgroundAlt: '#0A0A0A',
  gradientStart: '#000000',
  gradientEnd: '#1E3AFF',
} as const;

/** Amateur masculin — orange terrain (palette logo Amateur). */
export const amateurMaleOverrides = amateurColorOverrides;

/** Amateur féminin — pôle Joueur, nuance claire. */
export const amateurFemaleOverrides = {
  ...amateurColorOverrides,
  accent: '#5B73FF',
  accentLight: '#93A4FF',
  accentSoft: 'rgba(91, 115, 255, 0.14)',
  accentMuted: 'rgba(91, 115, 255, 0.32)',
  brand: '#5B73FF',
  brandLight: '#93A4FF',
  brandSoft: 'rgba(91, 115, 255, 0.1)',
  borderStrong: 'rgba(91, 115, 255, 0.55)',
  borderMedium: 'rgba(91, 115, 255, 0.28)',
  tone1: '#1529CC',
  tone2: '#1E3AFF',
  tone3: '#5B73FF',
  tone4: '#93A4FF',
  gradientEnd: '#1E3AFF',
} as const;

/** Amateur mineur — même pôle Joueur, monochrome dark/white. */
export const amateurMinorOverrides = {
  ...amateurColorOverrides,
  accent: '#FFFFFF',
  accentLight: '#F5F5F5',
  accentSoft: 'rgba(255, 255, 255, 0.14)',
  accentMuted: 'rgba(255, 255, 255, 0.32)',
  brand: '#FFFFFF',
  brandLight: '#F5F5F5',
  brandSoft: 'rgba(255, 255, 255, 0.1)',
  borderStrong: 'rgba(255, 255, 255, 0.35)',
  borderMedium: 'rgba(255, 255, 255, 0.18)',
  tone1: '#1529CC',
  tone2: '#5B73FF',
  tone3: '#FFFFFF',
  tone4: '#D4D4D4',
  gradientEnd: '#0A0A0A',
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
