import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing, radius } from '../../theme/designTokens';

interface SignupFooterButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export const SignupFooterButton: React.FC<SignupFooterButtonProps> = ({
  label,
  onPress,
  loading,
  variant = 'primary',
  disabled,
}) => (
  <TouchableOpacity
    style={[
      styles.btn,
      variant === 'secondary' ? styles.secondary : styles.primary,
      (disabled || loading) && styles.disabled,
    ]}
    onPress={onPress}
    disabled={disabled || loading}
    activeOpacity={0.85}
  >
    {loading ? (
      <ActivityIndicator color={variant === 'secondary' ? colors.text : colors.brandInverse} />
    ) : (
      <Text style={[styles.text, variant === 'secondary' && styles.textSecondary]}>{label}</Text>
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  btn: {
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
  },
  primary: {
    backgroundColor: colors.ink,
    borderColor: colors.border,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  disabled: { opacity: 0.55 },
  text: { color: colors.brandInverse, fontWeight: '900', fontSize: 16 },
  textSecondary: { color: colors.text, fontWeight: '800' },
});
