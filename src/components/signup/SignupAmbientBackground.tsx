import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '../../theme/designTokens';

/** Fond statique discret — pas d’animation */
export const SignupAmbientBackground: React.FC = () => (
  <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <View style={styles.topBand} />
    <View style={styles.gridLineA} />
    <View style={styles.gridLineB} />
  </View>
);

const styles = StyleSheet.create({
  topBand: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  gridLineA: {
    position: 'absolute',
    top: 80,
    right: spacing.xl,
    width: 1,
    height: 160,
    backgroundColor: colors.border,
    opacity: 0.6,
  },
  gridLineB: {
    position: 'absolute',
    top: 140,
    left: spacing.xl + 8,
    width: 48,
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.5,
  },
});
