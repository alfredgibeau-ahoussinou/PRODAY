import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, radius } from '../../theme/designTokens';
import { useSignupFlowTheme } from '../../screens/signup/SignupFlowContext';
import type { AppColors } from '../../theme/universeTheme';

interface SignupProgressRingProps {
  stepIndex: number;
  stepTotal: number;
  accentColor?: string;
}

/** Indicateur d'étape compact (sans animation). */
export const SignupProgressRing: React.FC<SignupProgressRingProps> = ({
  stepIndex,
  stepTotal,
  accentColor,
}) => {
  const { colors: c } = useSignupFlowTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={[styles.badge, accentColor ? { borderColor: accentColor } : null]}>
      <Text style={[styles.badgeText, accentColor ? { color: accentColor } : null]}>
        {stepIndex + 1}/{stepTotal}
      </Text>
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    badge: {
      minWidth: 44,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.pill,
      backgroundColor: c.surfaceMuted,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '800',
      color: c.text,
      letterSpacing: 0.2,
    },
  });
}
