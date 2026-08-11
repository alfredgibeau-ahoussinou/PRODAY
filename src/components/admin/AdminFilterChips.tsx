import React, { useMemo } from 'react';
import { ScrollView, Text, StyleSheet, View } from 'react-native';
import { PressableSpring } from '../motion';
import { useAdminStyles, adminChrome } from './adminStyles';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

export type AdminFilterOption<T extends string> = { id: T; label: string; count?: number };

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
    <View style={styles.trackWrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {options.map((opt) => {
          const active = opt.id === value;
          return (
            <PressableSpring
              key={opt.id}
              onPress={() => onChange(opt.id)}
              style={[styles.chip, active && styles.chipActive]}
              scaleTo={0.96}
              haptic
            >
              <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
              {opt.count != null && opt.count > 0 ? (
                <View style={[styles.countPill, active && styles.countPillActive]}>
                  <Text style={[styles.count, active && styles.countActive]}>{opt.count}</Text>
                </View>
              ) : null}
            </PressableSpring>
          );
        })}
      </ScrollView>
    </View>
  );
}

function createStyles(c: AppColors, compact: boolean) {
  return StyleSheet.create({
    trackWrap: {
      backgroundColor: c.surfaceMuted,
      borderRadius: radius.xl,
      padding: 4,
      marginBottom: compact ? spacing.sm : spacing.md,
      borderWidth: 1,
      borderColor: c.border,
    },
    row: {
      gap: 4,
      alignItems: 'center',
      paddingRight: spacing.xs,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: compact ? 12 : 14,
      paddingVertical: compact ? 8 : 10,
      borderRadius: radius.lg,
    },
    chipActive: {
      backgroundColor: adminChrome.accent,
      shadowColor: adminChrome.accentHot,
      shadowOpacity: 0.25,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    label: { fontSize: compact ? 12 : 13, fontWeight: '700', color: c.textMuted },
    labelActive: { color: '#FFFFFF' },
    countPill: {
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: c.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 5,
    },
    countPillActive: {
      backgroundColor: 'rgba(255,255,255,0.25)',
    },
    count: {
      fontSize: 10,
      fontWeight: '800',
      color: c.brand,
    },
    countActive: {
      color: '#FFFFFF',
    },
  });
}
