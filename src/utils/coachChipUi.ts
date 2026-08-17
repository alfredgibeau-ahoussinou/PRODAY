import type { ViewStyle } from 'react-native';
import type { CoachThemeTokens } from './coachTeamTheme';

/** Contraste texte pastille coach — fond accent (dark) ou soft (light). */
export function coachChipTextProps(
  active: boolean,
  tokens: CoachThemeTokens,
): { inverse?: boolean; accent?: boolean; muted?: boolean } {
  return {
    inverse: active && !tokens.isLight,
    accent: active && tokens.isLight,
    muted: !active,
  };
}

export function coachChipContainerStyle(
  active: boolean,
  tokens: CoachThemeTokens,
): ViewStyle {
  if (!active) {
    return {
      borderColor: tokens.border,
      backgroundColor: tokens.elevated,
    };
  }
  return tokens.isLight
    ? { borderColor: tokens.accent, backgroundColor: tokens.soft }
    : { borderColor: tokens.accent, backgroundColor: tokens.accent };
}
