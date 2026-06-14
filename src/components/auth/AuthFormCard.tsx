import React, { useMemo } from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius, shadows } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

interface AuthFormCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Carte formulaire auth — surface élevée, sans double accent. */
export const AuthFormCard: React.FC<AuthFormCardProps> = ({ children, style }) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  return <View style={[styles.card, style]}>{children}</View>;
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.xl,
      padding: spacing.lg,
      gap: spacing.xs,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      ...shadows.interactive,
    },
  });
}
