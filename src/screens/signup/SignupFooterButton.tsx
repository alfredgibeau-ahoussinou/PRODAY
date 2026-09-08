import React from 'react';
import { AuthButton } from '../../features/auth/experience';
import { useSignupFlowTheme } from './SignupFlowContext';

interface SignupFooterButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  showArrow?: boolean;
  accent?: string;
  onAccent?: string;
}

export const SignupFooterButton: React.FC<SignupFooterButtonProps> = ({
  label,
  onPress,
  loading,
  variant = 'primary',
  disabled,
  accent,
  onAccent,
}) => {
  const { visual } = useSignupFlowTheme();
  return (
    <AuthButton
      label={label}
      onPress={onPress}
      loading={loading}
      disabled={disabled}
      variant={variant === 'secondary' ? 'secondary' : 'primary'}
      accent={accent ?? visual.accent}
      onAccent={onAccent ?? visual.onAccent}
    />
  );
};
