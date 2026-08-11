import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { UserRole } from '../../models/User';
import { getRoleLabel } from '../../screens/signup/signupFlowConfig';
import { useAdminStyles } from './adminStyles';
import { spacing, radius, shadows } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

interface AdminRoleBreakdownProps {
  rows: { role: UserRole; count: number }[];
  total: number;
}

export const AdminRoleBreakdown: React.FC<AdminRoleBreakdownProps> = ({ rows, total }) => {
  const { colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c), [c]);
  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Répartition par rôle</Text>
      {rows.map((row) => {
        const pct = total > 0 ? Math.round((row.count / total) * 100) : 0;
        const w = Math.max(6, (row.count / max) * 100);
        return (
          <View key={row.role} style={styles.row}>
            <View style={styles.rowHead}>
              <Text style={styles.role}>{getRoleLabel(row.role)}</Text>
              <Text style={styles.count}>
                {row.count} · {pct}%
              </Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${w}%`, backgroundColor: c.brand }]} />
            </View>
          </View>
        );
      })}
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
      gap: spacing.sm,
      ...shadows.card,
    },
    title: { fontSize: 14, fontWeight: '800', color: c.text, marginBottom: spacing.xs },
    row: { gap: 4 },
    rowHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    role: { fontSize: 12, fontWeight: '800', color: c.text },
    count: { fontSize: 11, fontWeight: '700', color: c.textMuted },
    track: {
      height: 7,
      borderRadius: radius.pill,
      backgroundColor: c.surfaceMuted,
      overflow: 'hidden',
    },
    fill: { height: '100%', borderRadius: radius.pill },
  });
}
