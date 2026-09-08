import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { spacing } from '../../theme/designTokens';
import { ProDayText } from '../ui/ProDayText';
import { fontFamily } from '../../theme/typography';
import { useSignupFlowTheme } from '../../screens/signup/SignupFlowContext';
import type { SignupVisualChrome } from '../../screens/signup/signupVisualSystem';

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
  const { visual } = useSignupFlowTheme();
  const styles = useMemo(() => createStyles(visual), [visual]);

  return (
    <View style={styles.wrap}>
      <ProDayText variant="caption" style={styles.label}>
        {label}
      </ProDayText>
      <View style={styles.row}>
        {options.map((opt) => {
          const active = value === opt;
          return (
            <Pressable
              key={opt}
              style={[
                styles.chip,
                active && {
                  backgroundColor: visual.accent,
                  borderColor: visual.accent,
                },
              ]}
              onPress={() => onChange(opt)}
            >
              <ProDayText
                style={[
                  styles.chipText,
                  active && { color: visual.onAccent, fontFamily: fontFamily.bold },
                ]}
              >
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

function createStyles(v: SignupVisualChrome) {
  return StyleSheet.create({
    wrap: { marginBottom: spacing.md },
    label: {
      fontSize: 12,
      fontFamily: fontFamily.bold,
      color: v.textMuted,
      marginBottom: spacing.xs,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: v.border,
      backgroundColor: v.surface,
    },
    chipText: {
      fontSize: 14,
      fontFamily: fontFamily.semibold,
      color: v.text,
    },
    error: {
      fontSize: 12,
      color: v.danger,
      marginTop: spacing.xs,
      fontFamily: fontFamily.semibold,
    },
  });
}
