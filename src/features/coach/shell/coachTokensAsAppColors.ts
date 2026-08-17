import { colors as baseColors } from '../../../theme/designTokens';
import type { AppColors } from '../../../theme/universeTheme';
import type { CoachThemeTokens } from '../../../utils/coachTeamTheme';

/** Mappe les tokens coach vers la palette attendue par les écrans partagés (ex. Gestion équipe). */
export function coachTokensAsAppColors(tokens: CoachThemeTokens): AppColors {
  return {
    ...baseColors,
    background: tokens.bg,
    backgroundAlt: tokens.surface,
    surface: tokens.surface,
    surfaceMuted: tokens.elevated,
    border: tokens.border,
    borderStrong: tokens.border,
    borderMedium: tokens.border,
    text: tokens.foreground,
    textSecondary: tokens.muted,
    textMuted: tokens.muted,
    ink: tokens.foreground,
    inkSecondary: tokens.muted,
    inkMuted: tokens.muted,
    accent: tokens.accent,
    accentLight: tokens.accent,
    accentSoft: tokens.soft,
    accentMuted: tokens.soft,
    brand: tokens.accent,
    brandLight: tokens.accent,
    brandSoft: tokens.soft,
    brandInverse: tokens.onAccent,
    tone4: tokens.accent,
  };
}
