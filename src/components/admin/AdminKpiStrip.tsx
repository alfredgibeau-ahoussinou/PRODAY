import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from '../ui/Icon';
import { useAdminStyles } from './adminStyles';
import { spacing, radius, shadows } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';
import { computeStatDelta } from '../../utils/adminInsights';

export type AdminKpiItem = {
  key: string;
  label: string;
  value: number;
  previous?: number;
  icon: 'people' | 'calendar' | 'document' | 'warning' | 'mail' | 'time' | 'briefcase' | 'bag';
  alert?: boolean;
};

export const AdminKpiStrip: React.FC<{ items: AdminKpiItem[] }> = ({ items }) => {
  const { colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={styles.row}>
      {items.map((item) => {
        const delta = computeStatDelta(item.value, item.previous);
        const isAlert = item.alert && item.value > 0;
        return (
          <View key={item.key} style={[styles.card, isAlert && styles.cardAlert]}>
            <View style={styles.top}>
              <View style={[styles.iconWrap, isAlert && styles.iconWrapAlert]}>
                <Icon name={item.icon} size={15} color={isAlert ? c.brandInverse : c.brand} />
              </View>
              {delta != null && delta !== 0 ? (
                <Text style={[styles.delta, delta > 0 ? styles.deltaUp : styles.deltaDown]}>
                  {delta > 0 ? `+${delta}` : delta}
                </Text>
              ) : null}
            </View>
            <Text style={styles.value}>{item.value}</Text>
            <Text style={styles.label} numberOfLines={2}>
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
    card: {
      width: '47%',
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      gap: 4,
      ...shadows.card,
    },
    cardAlert: {
      borderColor: c.brand,
      backgroundColor: c.brandSoft,
    },
    top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    iconWrap: {
      width: 28,
      height: 28,
      borderRadius: radius.sm,
      backgroundColor: c.brandSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrapAlert: { backgroundColor: c.brand },
    value: { fontSize: 26, fontWeight: '800', color: c.text, letterSpacing: -0.5 },
    label: { fontSize: 11, fontWeight: '600', color: c.textMuted, lineHeight: 14 },
    delta: { fontSize: 10, fontWeight: '800' },
    deltaUp: { color: c.success },
    deltaDown: { color: c.error },
  });
}
