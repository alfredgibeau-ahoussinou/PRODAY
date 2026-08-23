import React from 'react';
import { AuthButton } from '../../features/auth/experience';

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
}) => (
  <AuthButton
    label={label}
    onPress={onPress}
    loading={loading}
    disabled={disabled}
    variant={variant === 'secondary' ? 'secondary' : 'primary'}
  />
);
