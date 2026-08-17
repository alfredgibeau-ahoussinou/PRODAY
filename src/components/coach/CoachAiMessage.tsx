import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { COACH_SITE } from '../../content/coachPageIdentity';
import { spacing } from '../../theme/designTokens';
import { CoachText } from './coachPortalUi';

type Props = {
  message: string;
  secondary?: string;
  footnote?: string;
  style?: StyleProp<ViewStyle>;
};

/** Bulle assistant IA — paragraphe naturel, sans listes à puces. */
export function CoachAiMessage({ message, secondary, footnote, style }: Props) {
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: COACH_SITE.surface,
    borderRadius: 18,
    padding: spacing.md,
    gap: spacing.sm,
  },
  message: { lineHeight: 22 },
  secondary: { lineHeight: 18 },
  footnote: { lineHeight: 16, marginTop: 2 },
});
