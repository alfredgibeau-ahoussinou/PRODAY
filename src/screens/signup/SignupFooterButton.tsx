import React from 'react';
import { Text, StyleSheet, ActivityIndicator, View, Pressable } from 'react-native';
import { Icon } from '../../components/ui/Icon';
import { authStyles } from '../../components/auth/authStyles';
import { useSignupFlowTheme } from './SignupFlowContext';
import { colors as defaultColors, spacing } from '../../theme/designTokens';

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
  const { colors, isWomanSignup } = useSignupFlowTheme();

  return (
  <Pressable
    style={({ pressed }) => [
      variant === 'secondary' ? styles.secondary : authStyles.primaryBtn,
      isWomanSignup && variant === 'primary' && { backgroundColor: colors.accent },
      styles.btnBase,
      (disabled || loading) && authStyles.primaryDisabled,
      pressed && !disabled && !loading && styles.pressed,
    ]}
    onPress={onPress}
    disabled={disabled || loading}
  >
    {loading ? (
      <ActivityIndicator color={variant === 'secondary' ? colors.text : colors.brandInverse} />
    ) : (
      <View style={styles.row}>
        <Text
          style={[
            variant === 'secondary' ? styles.textSecondary : authStyles.primaryBtnText,
          ]}
        >
          {label}
        </Text>
        {showArrow ? (
          <Icon
            name="chevron-forward"
            size={18}
            color={variant === 'secondary' ? colors.text : colors.brandInverse}
          />
        ) : null}
      </View>
    )}
  </Pressable>
  );
};

const styles = StyleSheet.create({
  btnBase: {
    marginTop: 0,
    minHeight: 52,
    justifyContent: 'center',
  },
  secondary: {
    backgroundColor: defaultColors.surface,
    borderWidth: 1.5,
    borderColor: defaultColors.border,
    borderRadius: 999,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  pressed: { opacity: 0.88 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  textSecondary: {
    color: defaultColors.text,
    fontWeight: '800',
  },
});
