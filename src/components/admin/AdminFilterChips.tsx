import React, { useMemo } from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAdminStyles } from './adminStyles';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

export type AdminFilterOption<T extends string> = { id: T; label: string };

interface AdminFilterChipsProps<T extends string> {
  options: AdminFilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  compact?: boolean;
}

export function AdminFilterChips<T extends string>({
  options,
  value,
  onChange,
  compact = false,
}: AdminFilterChipsProps<T>) {
  const { colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c, compact), [c, compact]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={compact ? styles.scrollCompact : styles.scroll}
    >
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <TouchableOpacity
            key={opt.id}
            onPress={() => onChange(opt.id)}
            style={[styles.chip, active && styles.chipActive]}
            activeOpacity={0.85}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function createStyles(c: AppColors, compact: boolean) {
  return StyleSheet.create({
    scroll: { maxHeight: 44, marginBottom: spacing.md },
    scrollCompact: { maxHeight: 40, marginBottom: spacing.sm },
    row: { gap: spacing.xs, paddingRight: spacing.lg },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: compact ? 7 : 9,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    chipActive: {
      backgroundColor: c.brand,
      borderColor: c.brand,
    },
    label: { fontSize: 12, fontWeight: '700', color: c.textSecondary },
    labelActive: { color: c.brandInverse },
  });
}
