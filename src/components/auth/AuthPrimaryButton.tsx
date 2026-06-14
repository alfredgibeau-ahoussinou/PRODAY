import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { PressableSpring } from '../motion';
import { ProDayGradient } from '../ui/ProDayGradient';
import { spacing, radius, shadows } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';
import type { AppColors } from '../../theme/universeTheme';
import type { GradientStops } from '../../theme/universeGradients';

interface AuthPrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'gradient' | 'solid';
  gradientColors?: GradientStops;
}

export const AuthPrimaryButton: React.FC<AuthPrimaryButtonProps> = ({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'gradient',
  gradientColors,
}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const isDisabled = disabled || loading;

  const content = loading ? (
    <ActivityIndicator color={c.brandInverse} />
  ) : (
    <Text style={styles.label}>{label}</Text>
  );

  if (variant === 'solid') {
    return (
      <PressableSpring
        style={[styles.btn, styles.solid, isDisabled && styles.disabled]}
        onPress={onPress}
        disabled={isDisabled}
        scaleTo={0.97}
        haptic
      >
        {content}
      </PressableSpring>
    );
  }

  return (
    <PressableSpring
      onPress={onPress}
      disabled={isDisabled}
      scaleTo={0.97}
      haptic
      style={[styles.wrap, isDisabled && styles.disabled]}
    >
      <ProDayGradient kind="cta" colors={gradientColors} style={styles.btn}>
        {content}
      </ProDayGradient>
    </PressableSpring>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      marginTop: spacing.sm,
      borderRadius: radius.pill,
      overflow: 'hidden',
      ...shadows.fab,
    },
    btn: {
      minHeight: 52,
      paddingVertical: spacing.md + 2,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.pill,
    },
    solid: {
      backgroundColor: c.ink,
      marginTop: spacing.md,
      minHeight: 52,
      paddingVertical: spacing.md + 2,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.pill,
      ...shadows.fab,
    },
    disabled: { opacity: 0.65 },
    label: {
      color: c.brandInverse,
      fontWeight: '800',
      fontSize: 16,
      textAlign: 'center',
    },
  });
}
