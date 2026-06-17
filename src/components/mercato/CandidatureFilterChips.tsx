import React, { useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet, Platform } from 'react-native';
import { PressableSpring } from '../motion';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';
import { fontFamily } from '../../theme/typography';

export type CandidatureChipOption<T extends string> = {
  id: T;
  label: string;
};

interface CandidatureFilterChipsProps<T extends string> {
  label: string;
  options: CandidatureChipOption<T>[];
  value: T;
  onChange: (id: T) => void;
}

export function CandidatureFilterChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: CandidatureFilterChipsProps<T>) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.block}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}
      >
        {options.map((opt) => {
          const on = opt.id === value;
          return (
            <PressableSpring
              key={opt.id}
              style={[
                styles.chip,
                {
                  backgroundColor: on ? colors.accent : colors.surface,
                  borderColor: on ? colors.accent : colors.border,
                },
              ]}
              onPress={() => onChange(opt.id)}
              scaleTo={0.97}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: on ? colors.brandInverse : colors.textSecondary },
                ]}
              >
                {opt.label}
              </Text>
            </PressableSpring>
          );
        })}
      </ScrollView>
    </View>
  );
}

function createStyles(c: { textMuted: string }) {
  return StyleSheet.create({
    block: { gap: spacing.xs },
    label: {
      fontFamily: fontFamily.bold,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: c.textMuted,
      paddingHorizontal: 2,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    rail: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: 2,
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      minHeight: 36,
      justifyContent: 'center',
    },
    chipText: {
      fontFamily: fontFamily.semibold,
      fontSize: 13,
      fontWeight: '600',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
  });
}
