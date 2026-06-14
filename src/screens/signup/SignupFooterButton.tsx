import React, { useMemo } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { AuthPrimaryButton } from '../../components/auth/AuthPrimaryButton';
import { PressableSpring } from '../../components/motion';
import { useSignupFlowTheme } from './SignupFlowContext';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

interface SignupFooterButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  showArrow?: boolean;
}

export const SignupFooterButton: React.FC<SignupFooterButtonProps> = ({
  label,
  onPress,
  loading,
  variant = 'primary',
  disabled,
  showArrow = variant === 'primary',
}) => {
  const { colors } = useSignupFlowTheme();
  const local = useMemo(() => createLocalStyles(colors), [colors]);

  if (variant === 'primary') {
    return (
      <AuthPrimaryButton
        label={label}
        onPress={onPress}
        loading={loading}
        disabled={disabled}
      />
    );
  }

  return (
    <PressableSpring
      style={[local.secondary, (disabled || loading) && local.disabled]}
      onPress={onPress}
      disabled={disabled || loading}
      scaleTo={0.97}
      haptic
    >
      <View style={local.row}>
        <Text style={local.textSecondary}>{label}</Text>
      </View>
    </PressableSpring>
  );
};

function createLocalStyles(c: AppColors) {
  return StyleSheet.create({
    secondary: {
      backgroundColor: c.surfaceMuted,
      borderWidth: 1.5,
      borderColor: c.borderStrong,
      borderRadius: radius.pill,
      paddingVertical: spacing.md + 2,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      minHeight: 52,
      justifyContent: 'center',
    },
    disabled: { opacity: 0.6 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
    },
    textSecondary: {
      color: c.text,
      fontWeight: '800',
      fontSize: 16,
    },
  });
}
