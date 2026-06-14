import { colors as baseColors } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';
import type { ProductLineId } from '../../models/ProductLine';
import { nextThemeForLine } from './themes';

/** Mappe la palette Next (cockpit sombre) vers AppColors legacy. */
export function nextLegacyAppColors(line: ProductLineId): AppColors {
  const next = nextThemeForLine(line);
  const accent = next.accent;
  const accentAlt = next.gradientSignal[1];

  return {
    ...baseColors,
    background: next.canvas,
    backgroundAlt: next.void,
    surface: next.surface,
    surfaceMuted: next.surfaceRaised,
    surfaceInverse: next.text,
    border: next.border,
    borderStrong: next.borderStrong,
    borderMedium: next.border,
    text: next.text,
    textSecondary: next.textSecondary,
    textMuted: next.textMuted,
    ink: next.text,
    inkSecondary: next.textSecondary,
    inkMuted: next.textMuted,
    inkFaint: next.textMuted,
    accent,
    accentLight: accentAlt,
    accentSoft: next.accentSoft,
    accentMuted: next.accentGlow,
    brand: accent,
    brandLight: accentAlt,
    brandSoft: next.accentSoft,
    brandInverse: next.void,
    heroMuted: next.textSecondary,
    success: accent,
    successBg: next.accentSoft,
    warning: next.warning,
    warningBg: 'rgba(255, 176, 32, 0.12)',
    error: next.danger,
    errorBg: 'rgba(255, 77, 106, 0.12)',
    pending: next.textMuted,
    pendingBg: next.surfaceRaised,
    tone1: next.gradientSignal[0],
    tone2: next.gradientSignal[1],
    tone3: accent,
    tone4: next.accentSoft,
    navy: next.void,
    navySoft: next.surface,
    blueBright: next.info,
    bluePrimary: accent,
    blueCyan: next.info,
    gradientStart: next.gradientSignal[0],
    gradientEnd: next.gradientSignal[1],
  };
}
