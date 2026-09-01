import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { spacing } from '../../theme/designTokens';
import { useSignupFlowTheme } from '../../screens/signup/SignupFlowContext';
import type { AppColors } from '../../theme/universeTheme';

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
  const { colors: c } = useSignupFlowTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {options.map((opt) => {
          const active = value === opt;
          return (
            <Pressable
              key={opt}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onChange(opt)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: { marginBottom: spacing.lg },
    label: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: '#F5D04A',
      marginBottom: spacing.sm,
    },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.12)',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    chipActive: {
      backgroundColor: '#F5D04A',
      borderColor: '#F5D04A',
      shadowColor: '#F5D04A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 4,
    },
    chipText: {
      fontSize: 14,
      fontWeight: '700',
      color: 'rgba(255, 255, 255, 0.85)',
    },
    chipTextActive: {
      color: '#07100C',
      fontWeight: '900',
    },
    error: {
      fontSize: 12,
      color: c.error,
      marginTop: spacing.xs,
      fontWeight: '600',
    },
  });
}
