import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableSpring } from '../motion';
import { ProDayGradient } from '../ui/ProDayGradient';
import { Icon } from '../ui/Icon';
import { maskEmail } from '../../services/authCredentialVault.service';
import { spacing, radius, shadows } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';
import type { AppColors } from '../../theme/universeTheme';

interface AuthBiometricButtonProps {
  email: string;
  biometricLabel: string;
  onPress: () => void;
  loading?: boolean;
}

/** Connexion rapide biométrique. */
export const AuthBiometricButton: React.FC<AuthBiometricButtonProps> = ({
  email,
  biometricLabel,
  onPress,
  loading = false,
}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <PressableSpring
      onPress={onPress}
      disabled={loading}
      scaleTo={0.98}
      haptic
      style={[styles.wrap, loading && styles.disabled]}
      accessibilityLabel={`Connexion avec ${biometricLabel}`}
    >
      <View style={styles.inner}>
        <ProDayGradient kind="cta" style={styles.iconRing}>
          <Icon name="shield" size={20} color={c.brandInverse} />
        </ProDayGradient>
        <View style={styles.copy}>
          <Text style={styles.title}>{biometricLabel}</Text>
          <Text style={styles.sub} numberOfLines={1}>
            {maskEmail(email)}
          </Text>
        </View>
        <Icon name="chevron-forward" size={16} color={c.textMuted} />
      </View>
    </PressableSpring>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      marginBottom: spacing.md,
    },
    disabled: { opacity: 0.65 },
    inner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.xl,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      ...shadows.soft,
    },
    iconRing: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    copy: { flex: 1, minWidth: 0 },
    title: {
      fontSize: 15,
      fontWeight: '800',
      color: c.text,
    },
    sub: {
      fontSize: 12,
      color: c.textMuted,
      marginTop: 2,
      fontWeight: '600',
    },
  });
}
