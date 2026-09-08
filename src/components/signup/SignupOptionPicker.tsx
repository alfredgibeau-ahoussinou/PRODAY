import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { spacing } from '../../theme/designTokens';
import { ProDayText } from '../ui/ProDayText';
import { AUTH_XP } from '../../features/auth/experience/tokens';
import { fontFamily } from '../../theme/typography';

interface SignupOptionPickerProps {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const SignupOptionPicker: React.FC<SignupOptionPickerProps> = ({
  label,
  options,
  value,
  onChange,
  error,
}) => {
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.wrap}>
      <ProDayText variant="caption" style={styles.label}>{label}</ProDayText>
      <View style={styles.row}>
        {options.map((opt) => {
          const active = value === opt;
          return (
            <Pressable
              key={opt}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onChange(opt)}
            >
              <ProDayText style={[styles.chipText, active && styles.chipTextActive]}>
                {opt}
              </ProDayText>
            </Pressable>
          );
        })}
      </View>
      {error ? <ProDayText style={styles.error}>{error}</ProDayText> : null}
    </View>
  );
};

function createStyles() {
  return StyleSheet.create({
    wrap: { marginBottom: spacing.md },
    label: {
      fontSize: 12,
      fontFamily: fontFamily.bold,
      color: AUTH_XP.textMuted,
      marginBottom: spacing.xs,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      paddingVertical: 9,
      paddingHorizontal: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: AUTH_XP.border,
      backgroundColor: AUTH_XP.inputBg,
    },
    chipActive: {
      backgroundColor: AUTH_XP.goldBright,
      borderColor: AUTH_XP.goldBright,
    },
    chipText: {
      fontSize: 14,
      fontFamily: fontFamily.semibold,
      color: AUTH_XP.text,
    },
    chipTextActive: {
      color: '#000000',
      fontFamily: fontFamily.bold,
    },
    error: {
      fontSize: 12,
      color: AUTH_XP.error,
      marginTop: spacing.xs,
      fontFamily: fontFamily.semibold,
    },
  });
}

