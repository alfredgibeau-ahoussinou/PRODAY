import React, { useMemo } from 'react';
import { Text, StyleSheet, ActivityIndicator, View, Pressable } from 'react-native';
import { Icon } from '../../components/ui/Icon';
import { useAuthStyles } from '../../components/auth/authStyles';
import { useSignupFlowTheme } from './SignupFlowContext';
import { spacing } from '../../theme/designTokens';
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
  const { colors, isWomanSignup } = useSignupFlowTheme();
  const authStyles = useAuthStyles();
  const local = useMemo(() => createLocalStyles(colors), [colors]);

  return (
    <Pressable
      style={({ pressed }) => [
        variant === 'secondary' ? local.secondary : authStyles.primaryBtn,
        isWomanSignup && variant === 'primary' && { backgroundColor: colors.brand },
        local.btnBase,
        (disabled || loading) && authStyles.primaryDisabled,
        pressed && !disabled && !loading && local.pressed,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? colors.text : colors.brandInverse} />
      ) : (
        <View style={local.row}>
          <Text
            style={[
              variant === 'secondary' ? local.textSecondary : authStyles.primaryBtnText,
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

function createLocalStyles(c: AppColors) {
  return StyleSheet.create({
    btnBase: {
      marginTop: 0,
      minHeight: 52,
      justifyContent: 'center',
    },
    secondary: {
      backgroundColor: c.surface,
      borderWidth: 1.5,
      borderColor: c.border,
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
      color: c.text,
      fontWeight: '800',
    },
  });
}
