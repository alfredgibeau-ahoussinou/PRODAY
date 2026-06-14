import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { spacing, radius } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';
import type { AppColors } from '../../theme/universeTheme';

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
  colors: AppColors;
  onPress: () => void;
}> = ({ on, label, hint, colors, onPress }) => (
  <PressableSpring
    style={[
      chipStyles.chip,
      {
        backgroundColor: on ? colors.accentSoft : colors.surface,
        borderColor: on ? colors.accentMuted : colors.border,
      },
    ]}
    onPress={onPress}
    scaleTo={0.97}
  >
    <View
      style={[
        chipStyles.dot,
        { borderColor: on ? colors.accent : colors.border, backgroundColor: on ? colors.accent : 'transparent' },
      ]}
    >
      {on ? <Icon name="checkmark-circle" size={12} color={colors.brandInverse} /> : null}
    </View>
    <View style={chipStyles.copy}>
      <Text style={[chipStyles.label, { color: colors.text }]}>{label}</Text>
      {hint ? <Text style={[chipStyles.hint, { color: colors.textMuted }]}>{hint}</Text> : null}
    </View>
  </PressableSpring>
);

const chipStyles = StyleSheet.create({
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    minWidth: 0,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, minWidth: 0 },
  label: { fontSize: 12, fontWeight: '800' },
  hint: { fontSize: 10, marginTop: 1, lineHeight: 13, fontWeight: '500' },
});

/** Options connexion rapide — chips côte à côte. */
export const AuthRememberRow: React.FC<AuthRememberRowProps> = ({
  rememberMe,
  onRememberMeChange,
  biometricEnabled = false,
  onBiometricChange,
  biometricLabel = 'Biométrie',
  biometricAvailable = false,
}) => {
  const { colors } = useAppTheme();
  const local = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={local.wrap}>
      <View style={local.row}>
        <ToggleChip
          on={rememberMe}
          label="Mémoriser"
          colors={colors}
          onPress={() => onRememberMeChange(!rememberMe)}
        />
        {biometricAvailable && onBiometricChange ? (
          <ToggleChip
            on={biometricEnabled}
            label={biometricLabel}
            hint="Sécurisé"
            colors={colors}
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
};

function createStyles(_c: AppColors) {
  return StyleSheet.create({
    wrap: {
      marginTop: spacing.xs,
      marginBottom: spacing.xs,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
  });
}
