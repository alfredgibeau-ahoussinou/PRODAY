import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../../theme/designTokens';

interface SignupProgressRingProps {
  stepIndex: number;
  stepTotal: number;
  accentColor?: string;
}

/** Indicateur d’étape compact (sans animation). */
export const SignupProgressRing: React.FC<SignupProgressRingProps> = ({
  stepIndex,
  stepTotal,
  accentColor,
}) => (
  <View style={[styles.badge, accentColor ? { borderColor: accentColor } : null]}>
    <Text style={[styles.badgeText, accentColor ? { color: accentColor } : null]}>
      {stepIndex + 1}/{stepTotal}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    minWidth: 44,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.2,
  },
});
