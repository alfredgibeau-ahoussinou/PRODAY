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
    wrap: { marginBottom: spacing.md },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: 'rgba(255, 255, 255, 0.55)',
      marginBottom: spacing.xs,
    },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      paddingVertical: 9,
      paddingHorizontal: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.12)',
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
    },
    chipActive: {
      backgroundColor: '#F5D04A',
      borderColor: '#F5D04A',
    },
    chipText: {
      fontSize: 14,
      fontWeight: '500',
      color: 'rgba(255, 255, 255, 0.8)',
    },
    chipTextActive: {
      color: '#000000',
      fontWeight: '700',
    },
    error: {
      fontSize: 12,
      color: c.error,
      marginTop: spacing.xs,
      fontWeight: '500',
    },
  });
}
