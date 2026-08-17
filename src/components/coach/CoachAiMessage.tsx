import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { spacing } from '../../theme/designTokens';
import { CoachText } from './coachPortalUi';
import { useCoachThemedStyles } from '../../features/coach/shell/CoachThemeContext';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';

type Props = {
  message: string;
  secondary?: string;
  footnote?: string;
  style?: StyleProp<ViewStyle>;
};

/** Bulle assistant IA — paragraphe naturel, sans listes à puces. */
export function CoachAiMessage({ message, secondary, footnote, style }: Props) {
  const styles = useCoachThemedStyles(createStyles);

  return (
    <View style={[styles.card, style]}>
      <CoachText variant="body" style={styles.message}>
        {message}
      </CoachText>
      {secondary ? (
        <CoachText variant="caption" muted style={styles.secondary}>
          {secondary}
        </CoachText>
      ) : null}
      {footnote ? (
        <CoachText variant="caption" muted style={styles.footnote}>
          {footnote}
        </CoachText>
      ) : null}
    </View>
  );
}

function createStyles(tokens: CoachThemeTokens) {
  return StyleSheet.create({
    card: {
      backgroundColor: tokens.surface,
      borderRadius: 18,
      padding: spacing.md,
      gap: spacing.sm,
    },
    message: { lineHeight: 22 },
    secondary: { lineHeight: 18 },
    footnote: { lineHeight: 16, marginTop: 2 },
  });
}
