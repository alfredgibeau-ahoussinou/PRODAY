import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { ProDayText } from '../ui/ProDayText';
import { maskEmail } from '../../services/authCredentialVault.service';
import { AUTH_XP } from '../../features/auth/experience/tokens';

interface AuthBiometricButtonProps {
  email: string;
  biometricLabel: string;
  onPress: () => void;
  loading?: boolean;
}

/** Connexion rapide biométrique — Auth Experience. */
export const AuthBiometricButton: React.FC<AuthBiometricButtonProps> = ({
  email,
  biometricLabel,
  onPress,
  loading = false,
}) => (
  <PressableSpring
    onPress={onPress}
    disabled={loading}
    scaleTo={0.98}
    haptic
    style={[styles.wrap, loading && styles.disabled]}
    accessibilityLabel={`Connexion avec ${biometricLabel}`}
  >
    <View style={styles.inner}>
      <View style={styles.iconRing}>
        <Icon name="shield" size={20} color={AUTH_XP.black} />
      </View>
      <View style={styles.copy}>
        <ProDayText variant="section" style={styles.title}>
          {biometricLabel}
        </ProDayText>
        <ProDayText variant="caption" style={styles.sub} numberOfLines={1}>
          {maskEmail(email)}
        </ProDayText>
      </View>
      <Icon name="chevron-forward" size={16} color={AUTH_XP.textMuted} />
    </View>
  </PressableSpring>
);

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
  },
  disabled: { opacity: 0.65 },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: AUTH_XP.radiusMd,
    backgroundColor: AUTH_XP.surfaceRaised,
    borderWidth: 1,
    borderColor: AUTH_XP.border,
  },
  iconRing: {
    width: 40,
    height: 40,
    borderRadius: AUTH_XP.radiusSm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AUTH_XP.gold,
  },
  copy: { flex: 1, minWidth: 0 },
  title: {
    color: AUTH_XP.white,
    fontSize: 15,
    fontWeight: '700',
  },
  sub: {
    color: AUTH_XP.textMuted,
    marginTop: 2,
  },
});
