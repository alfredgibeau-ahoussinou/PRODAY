import React, { useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { ProDayText } from '../../../components/ui/ProDayText';
import { PressableSpring } from '../../../components/motion';
import { PRODAY_MASTER } from '../../../theme/prodayBrand';

type AuthButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'ghost' | 'secondary';
  /** Accent du pôle (joueur / coach / club…). */
  accent?: string;
  /** Encre sur fond accent. */
  onAccent?: string;
};

/**
 * CTA auth — couleurs du pôle actif (pas d’émeraude Club forcée).
 */
export const AuthButton: React.FC<AuthButtonProps> = ({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  accent = PRODAY_MASTER.gold,
  onAccent = PRODAY_MASTER.black,
}) => {
  const lock = useRef(false);
  const isDisabled = disabled || loading;
  const styles = useMemo(
    () => createStyles(variant, accent, onAccent),
    [variant, accent, onAccent],
  );
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
          color={primary ? onAccent : '#FFFFFF'}
          size="small"
        />
      ) : (
        <ProDayText variant="section" style={styles.label}>
          {label}
        </ProDayText>
      )}
    </PressableSpring>
  );
};

function createStyles(
  variant: AuthButtonProps['variant'],
  accent: string,
  onAccent: string,
) {
  const primary = variant === 'primary';
  const ghost = variant === 'ghost';
  return StyleSheet.create({
    btn: {
      minHeight: 54,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 999,
      paddingHorizontal: 24,
      backgroundColor: primary
        ? accent
        : ghost
          ? 'transparent'
          : 'rgba(255, 255, 255, 0.08)',
      borderWidth: primary ? 0 : 1,
      borderColor: primary ? 'transparent' : accent,
      marginTop: 8,
      shadowColor: primary ? accent : '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: primary ? 0.35 : 0.1,
      shadowRadius: 12,
      elevation: 4,
    },
    label: {
      color: primary ? onAccent : '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
    disabled: {
      opacity: 0.45,
    },
  });
}
