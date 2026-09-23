import React from 'react';
import { ProDayText } from '../ui/ProDayText';
import { useCoachTheme } from '../../features/coach/shell/CoachThemeContext';

/** Texte coach — couleurs thème Pôle Coach (fallback COACH_SITE hors shell). */
export function CoachText({
  muted,
  accent,
  inverse,
  style,
  ...rest
}: React.ComponentProps<typeof ProDayText>) {
  const { tokens } = useCoachTheme();
  const color = inverse
    ? tokens.onAccent
    : accent
      ? tokens.accent
      : muted
        ? tokens.muted
        : tokens.foreground;
  return <ProDayText {...rest} style={[{ color }, style]} />;
}
