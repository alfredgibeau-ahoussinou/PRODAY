import React, { useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import { ProDayText } from '../../../components/ui/ProDayText';
import { PressableSpring } from '../../../components/motion';
import {
  UNIVERSE_ENTRY_ACCENT,
  UNIVERSE_ENTRY_INK_ON_ACCENT,
} from '../../../components/branding/intro/universeEntryAuth';

type AuthButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'ghost' | 'secondary';
};

/**
 * CTA auth — look pôle Club (émeraude) pour cohérence d’entrée tous pôles.
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
          color={primary ? UNIVERSE_ENTRY_INK_ON_ACCENT : '#FFFFFF'}
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
        ? UNIVERSE_ENTRY_ACCENT
        : ghost
          ? 'transparent'
          : 'rgba(16, 185, 129, 0.12)',
      borderWidth: primary ? 0 : 1,
      borderColor: primary ? 'transparent' : UNIVERSE_ENTRY_ACCENT,
      marginTop: 10,
    },
    label: {
      color: primary ? UNIVERSE_ENTRY_INK_ON_ACCENT : '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
    disabled: {
      opacity: 0.45,
    },
  });
}
