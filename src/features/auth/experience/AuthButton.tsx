import React, { useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
 * CTA premium — design luxury gold, anti double-submit (guard + disabled pendant loading).
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
      scaleTo={0.97}
      haptic
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityLabel={label}
    >
      {primary ? (
        <LinearGradient
          colors={['#FDE047', '#F5D04A', '#C5A059']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}

      {loading ? (
        <ActivityIndicator
          color={primary ? '#07100C' : AUTH_XP.gold}
          size="small"
        />
      ) : (
        <ProDayText
          variant="section"
          style={styles.label}
        >
          {label.toUpperCase()}
        </ProDayText>
      )}
      {primary ? <View style={styles.shine} pointerEvents="none" /> : null}
    </PressableSpring>
  );
};

function createStyles(variant: AuthButtonProps['variant']) {
  const primary = variant === 'primary';
  const ghost = variant === 'ghost';
  return StyleSheet.create({
    btn: {
      minHeight: 56,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      paddingHorizontal: 24,
      overflow: 'hidden',
      backgroundColor: primary
        ? AUTH_XP.gold
        : ghost
          ? 'transparent'
          : 'rgba(255, 255, 255, 0.06)',
      borderWidth: primary ? 0 : 1.5,
      borderColor: ghost ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.15)',
      marginTop: 12,
      shadowColor: primary ? '#F5D04A' : '#000',
      shadowOffset: { width: 0, height: primary ? 6 : 2 },
      shadowOpacity: primary ? 0.35 : 0.2,
      shadowRadius: 12,
      elevation: 6,
    },
    label: {
      color: primary ? '#07100C' : '#FFFFFF',
      fontSize: 15,
      fontWeight: '900',
      letterSpacing: 0.8,
    },
    disabled: {
      opacity: 0.5,
    },
    shine: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 1.5,
      backgroundColor: 'rgba(255, 255, 255, 0.55)',
    },
  });
}
