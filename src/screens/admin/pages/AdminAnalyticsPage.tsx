import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAdminData } from '../../../context/AdminDataContext';
import { AdminPageScaffold } from '../../../components/admin/AdminPageScaffold';
import { AdminTrendChart } from '../../../components/admin/AdminTrendChart';
import { AdminRoleBreakdown } from '../../../components/admin/AdminRoleBreakdown';
import { AdminStatGrid } from '../../../components/admin/AdminStatGrid';
import { useAdminStyles } from '../../../components/admin/adminStyles';
import { spacing, radius, shadows } from '../../../theme/designTokens';
import type { AppColors } from '../../../theme/universeTheme';

export const AdminAnalyticsPage: React.FC = () => {
  const { loading, stats, dailySnapshots, roleBreakdown, users, moderationScore } = useAdminData();
  const { colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c), [c]);

  const activeUsers = users.filter((u) => u.is_active !== false).length;

  return (
    <AdminPageScaffold loading={loading}>
      {stats ? (
        <>
          <View style={styles.scoreRow}>
            <ScoreCard label="Charge modération" value={moderationScore} hint="Score pondéré files ouvertes" styles={styles} />
            <ScoreCard label="Comptes actifs" value={activeUsers} hint={`sur ${stats.users} inscrits`} styles={styles} />
          </View>

          <AdminTrendChart snapshots={dailySnapshots} metric="users" title="Utilisateurs (14 jours)" />
          <AdminTrendChart snapshots={dailySnapshots} metric="teamEvents" title="Événements équipe" color={c.accent} />
          <AdminTrendChart snapshots={dailySnapshots} metric="applications" title="Candidatures Mercato" />
          <AdminTrendChart snapshots={dailySnapshots} metric="recruitmentPosts" title="Annonces Mercato" color={c.warning} />

          <AdminRoleBreakdown rows={roleBreakdown} total={stats.users} />

          <Text style={styles.section}>Inventaire complet</Text>
          <AdminStatGrid stats={stats} />

          {dailySnapshots.length > 0 ? (
            <View style={styles.snapCard}>
              <Text style={styles.snapTitle}>Derniers snapshots</Text>
              {dailySnapshots.slice(0, 7).map((s) => (
                <Text key={s.day_key} style={styles.snapLine}>
                  {s.day_key} · {s.users} users · {s.teamEvents} events · {s.pendingVerifications} vérif.
                </Text>
              ))}
            </View>
          ) : null}
        </>
      ) : null}
    </AdminPageScaffold>
  );
};

const ScoreCard: React.FC<{
  label: string;
  value: number;
  hint: string;
  styles: ReturnType<typeof createStyles>;
}> = ({ label, value, hint, styles }) => (
  <View style={styles.scoreCard}>
    <Text style={styles.scoreValue}>{value}</Text>
    <Text style={styles.scoreLabel}>{label}</Text>
    <Text style={styles.scoreHint}>{hint}</Text>
  </View>
);

function createStyles(c: AppColors) {
  return StyleSheet.create({
    scoreRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
    scoreCard: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.md,
      gap: 2,
      ...shadows.card,
    },
    scoreValue: { fontSize: 28, fontWeight: '800', color: c.text },
    scoreLabel: { fontSize: 12, fontWeight: '800', color: c.text },
    scoreHint: { fontSize: 10, color: c.textMuted, fontWeight: '600' },
    section: {
      marginTop: spacing.md,
      marginBottom: spacing.sm,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: c.brand,
    },
    snapCard: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: 4,
      borderWidth: 1,
      borderColor: c.border,
      ...shadows.card,
    },
    snapTitle: { fontSize: 13, fontWeight: '800', color: c.text, marginBottom: spacing.xs },
    snapLine: { fontSize: 11, color: c.textSecondary, fontWeight: '600' },
  });
}
