import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';

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
      {on ? <Icon name="checkmark-circle" size={14} color="#000000" /> : null}
    </View>
    <View style={styles.copy}>
      <ProDayText variant="caption" style={[styles.label, on && styles.labelOn]}>
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

/** Options connexion rapide épurées et arrondies. */
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
    marginTop: 6,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    minWidth: 0,
  },
  chipOn: {
    borderColor: '#F5D04A',
    backgroundColor: 'rgba(245, 208, 74, 0.10)',
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  dotOn: {
    borderColor: '#F5D04A',
    backgroundColor: '#F5D04A',
  },
  copy: {
    flex: 1,
  },
  label: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    fontWeight: '600',
  },
  labelOn: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  hint: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 11,
  },
});
