import React, { useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import { ProDayText } from '../../../components/ui/ProDayText';
import { PressableSpring } from '../../../components/motion';
import { AUTH_XP } from './tokens';

type AuthButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'ghost' | 'secondary';
};

/**
 * CTA minimaliste épuré — format pilule pleine or/noir avec gestion anti double-clic.
 */
export const AuthButton: React.FC<AuthButtonProps> = ({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
}) => {
  const lock = useRef(false);
  const isDisabled = disabled || loading;
  const styles = useMemo(() => createStyles(variant), [variant]);
  const primary = variant === 'primary';

  const handlePress = () => {
    if (isDisabled || lock.current) return;
    lock.current = true;
    try {
      onPress();
    } finally {
      requestAnimationFrame(() => {
        lock.current = false;
      });
    }
  };

  return (
    <PressableSpring
      style={[styles.btn, isDisabled && styles.disabled]}
      onPress={handlePress}
      disabled={isDisabled}
      scaleTo={0.97}
      haptic
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityLabel={label}
    >
      {loading ? (
        <ActivityIndicator
          color={primary ? '#000000' : '#FFFFFF'}
          size="small"
        />
      ) : (
        <ProDayText
          variant="section"
          style={styles.label}
        >
          {label}
        </ProDayText>
      )}
    </PressableSpring>
  );
};

function createStyles(variant: AuthButtonProps['variant']) {
  const primary = variant === 'primary';
  const ghost = variant === 'ghost';
  return StyleSheet.create({
    btn: {
      minHeight: 52,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 26,
      paddingHorizontal: 24,
      backgroundColor: primary
        ? '#F5D04A'
        : ghost
          ? 'transparent'
          : 'rgba(255, 255, 255, 0.08)',
      borderWidth: ghost ? 1 : 0,
      borderColor: ghost ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
      marginTop: 10,
    },
    label: {
      color: primary ? '#000000' : '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
    disabled: {
      opacity: 0.45,
    },
  });
}
