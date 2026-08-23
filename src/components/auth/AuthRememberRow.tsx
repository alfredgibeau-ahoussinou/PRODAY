import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { AUTH_XP } from '../../features/auth/experience/tokens';

interface AuthRememberRowProps {
  rememberMe: boolean;
  onRememberMeChange: (value: boolean) => void;
  biometricEnabled?: boolean;
  onBiometricChange?: (value: boolean) => void;
  biometricLabel?: string;
  biometricAvailable?: boolean;
}

const ToggleChip: React.FC<{
  on: boolean;
  label: string;
  hint?: string;
  onPress: () => void;
}> = ({ on, label, hint, onPress }) => (
  <PressableSpring
    style={[styles.chip, on && styles.chipOn]}
    onPress={onPress}
    scaleTo={0.97}
  >
    <View style={[styles.dot, on && styles.dotOn]}>
      {on ? <Icon name="checkmark-circle" size={12} color={AUTH_XP.black} /> : null}
    </View>
    <View style={styles.copy}>
      <ProDayText variant="caption" style={styles.label}>
        {label}
      </ProDayText>
      {hint ? (
        <ProDayText variant="caption" style={styles.hint}>
          {hint}
        </ProDayText>
      ) : null}
    </View>
  </PressableSpring>
);

/** Options connexion rapide — dark experience. */
export const AuthRememberRow: React.FC<AuthRememberRowProps> = ({
  rememberMe,
  onRememberMeChange,
  biometricEnabled = false,
  onBiometricChange,
  biometricLabel = 'Biométrie',
  biometricAvailable = false,
}) => (
  <View style={styles.wrap}>
    <View style={styles.row}>
      <ToggleChip
        on={rememberMe}
        label="Mémoriser"
        onPress={() => onRememberMeChange(!rememberMe)}
      />
      {biometricAvailable && onBiometricChange ? (
        <ToggleChip
          on={biometricEnabled}
          label={biometricLabel}
          hint="Sécurisé"
          onPress={() => {
            const next = !biometricEnabled;
            if (next && !rememberMe) onRememberMeChange(true);
            onBiometricChange(next);
          }}
        />
      ) : null}
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    marginTop: 4,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: AUTH_XP.border,
    backgroundColor: AUTH_XP.inputBg,
    minWidth: 0,
  },
  chipOn: {
    borderColor: AUTH_XP.borderFocus,
    backgroundColor: 'rgba(197,160,89,0.12)',
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: AUTH_XP.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotOn: {
    borderColor: AUTH_XP.gold,
    backgroundColor: AUTH_XP.gold,
  },
  copy: { flex: 1, minWidth: 0 },
  label: {
    color: AUTH_XP.white,
    fontSize: 12,
    fontWeight: '700',
  },
  hint: {
    color: AUTH_XP.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
});
