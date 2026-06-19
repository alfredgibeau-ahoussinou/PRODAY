import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { PlatformDailySnapshot } from '../../services/admin.service';
import { useAdminStyles } from './adminStyles';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

type TrendMetric = keyof Pick<
  PlatformDailySnapshot,
  'users' | 'teamEvents' | 'applications' | 'recruitmentPosts'
>;

interface AdminTrendChartProps {
  snapshots: PlatformDailySnapshot[];
  metric: TrendMetric;
  title: string;
  color?: string;
}

export const AdminTrendChart: React.FC<AdminTrendChartProps> = ({
  snapshots,
  metric,
  title,
  color,
}) => {
  const { colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c), [c]);
  const barColor = color ?? c.brand;

  const series = useMemo(() => {
    const ordered = [...snapshots].sort((a, b) => a.day_key.localeCompare(b.day_key));
    return ordered.slice(-14);
  }, [snapshots]);

  const max = Math.max(1, ...series.map((s) => s[metric]));

  if (series.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.empty}>Pas encore de snapshots quotidiens.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chart}>
        {series.map((point) => {
          const h = Math.max(4, (point[metric] / max) * 72);
          return (
            <View key={point.day_key} style={styles.barCol}>
              <View style={[styles.bar, { height: h, backgroundColor: barColor }]} />
              <Text style={styles.barLabel}>{point.day_key.slice(5)}</Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.footer}>
        Max {max} · {series.length} jour{series.length > 1 ? 's' : ''}
      </Text>
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    title: { fontSize: 13, fontWeight: '900', color: c.text, marginBottom: spacing.md },
    chart: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      height: 88,
      gap: 4,
    },
    barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
    bar: { width: '80%', borderRadius: 4, minHeight: 4 },
    barLabel: { fontSize: 8, fontWeight: '700', color: c.textMuted },
    footer: { fontSize: 10, color: c.textMuted, marginTop: spacing.sm, fontWeight: '600' },
    empty: { fontSize: 12, color: c.textMuted, lineHeight: 18 },
  });
}
