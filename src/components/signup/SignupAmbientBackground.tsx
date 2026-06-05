import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '../../theme/designTokens';
import { useSignupFlowTheme } from '../../screens/signup/SignupFlowContext';
import type { AppColors } from '../../theme/universeTheme';

/** Fond statique discret — pas d'animation */
export const SignupAmbientBackground: React.FC = () => {
  const { colors: c } = useSignupFlowTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.topBand} />
      <View style={styles.gridLineA} />
      <View style={styles.gridLineB} />
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    topBand: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 120,
      backgroundColor: c.surface,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    gridLineA: {
      position: 'absolute',
      top: 80,
      right: spacing.xl,
      width: 1,
      height: 160,
      backgroundColor: c.border,
      opacity: 0.6,
    },
    gridLineB: {
      position: 'absolute',
      top: 140,
      left: spacing.xl + 8,
      width: 48,
      height: 1,
      backgroundColor: c.border,
      opacity: 0.5,
    },
  });
}
