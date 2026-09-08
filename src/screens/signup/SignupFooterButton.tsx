import React from 'react';
import { AuthButton } from '../../features/auth/experience';

interface SignupFooterButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  showArrow?: boolean;
  /** Accent pôle (évite l’or master forcé partout). */
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
}) => (
  <AuthButton
    label={label}
    onPress={onPress}
    loading={loading}
    disabled={disabled}
    variant={variant === 'secondary' ? 'secondary' : 'primary'}
    accent={accent}
    onAccent={onAccent}
  />
);
