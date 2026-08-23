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
 * CTA premium — anti double-submit (guard + disabled pendant loading).
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

  const handlePress = () => {
    if (isDisabled || lock.current) return;
    lock.current = true;
    try {
      onPress();
    } finally {
      // Relâche après le tick — le parent garde `loading` pour bloquer.
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
      scaleTo={0.98}
      haptic
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityLabel={label}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? AUTH_XP.black : AUTH_XP.gold}
        />
      ) : (
        <ProDayText
          variant="section"
          style={styles.label}
        >
          {label}
        </ProDayText>
      )}
      {variant === 'primary' ? <View style={styles.shine} pointerEvents="none" /> : null}
    </PressableSpring>
  );
};

function createStyles(variant: AuthButtonProps['variant']) {
  const primary = variant === 'primary';
  const ghost = variant === 'ghost';
  return StyleSheet.create({
    btn: {
      minHeight: 54,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 2,
      paddingHorizontal: 20,
      overflow: 'hidden',
      backgroundColor: primary
        ? AUTH_XP.gold
        : ghost
          ? 'transparent'
          : AUTH_XP.surfaceRaised,
      borderWidth: primary ? 0 : 1,
      borderColor: ghost ? AUTH_XP.border : AUTH_XP.border,
      marginTop: 8,
    },
    label: {
      color: primary ? AUTH_XP.black : AUTH_XP.white,
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
    disabled: {
      opacity: 0.55,
    },
    shine: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 1,
      backgroundColor: 'rgba(255,255,255,0.35)',
    },
  });
}
