import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useAdminData } from '../../../context/AdminDataContext';
import { AdminPageScaffold } from '../../../components/admin/AdminPageScaffold';
import { AdminTrendChart } from '../../../components/admin/AdminTrendChart';
import { AdminRoleBreakdown } from '../../../components/admin/AdminRoleBreakdown';
import { AdminStatGrid } from '../../../components/admin/AdminStatGrid';
import { useAdminStyles } from '../../../components/admin/adminStyles';
import { spacing, radius, shadows } from '../../../theme/designTokens';
import type { AppColors } from '../../../theme/universeTheme';
import type { TrafficDailyRow } from '../../../services/admin.service';

type TrafficPeriod = 'today' | '7d' | '30d' | 'all';

const TRAFFIC_PERIODS: { id: TrafficPeriod; label: string }[] = [
  { id: 'today', label: 'Aujourd’hui' },
  { id: '7d', label: '7 j' },
  { id: '30d', label: '30 j' },
  { id: 'all', label: 'Tout' },
];

function dayKeyUtc(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function sumTraffic(
  days: TrafficDailyRow[],
  period: TrafficPeriod,
): { site: number; app: number; rows: TrafficDailyRow[] } {
  if (period === 'all') {
    return {
      site: days.reduce((a, d) => a + d.site_visits, 0),
      app: days.reduce((a, d) => a + d.app_opens, 0),
      rows: days,
    };
  }
  const today = dayKeyUtc();
  const cutoff = new Date();
  if (period === '7d') cutoff.setUTCDate(cutoff.getUTCDate() - 6);
  if (period === '30d') cutoff.setUTCDate(cutoff.getUTCDate() - 29);
  const minKey = period === 'today' ? today : dayKeyUtc(cutoff);
  const rows = days.filter((d) => d.day_key >= minKey);
  return {
    site: rows.reduce((a, d) => a + d.site_visits, 0),
    app: rows.reduce((a, d) => a + d.app_opens, 0),
    rows,
  };
}

function formatStartedAt(value?: Date | null): string {
  if (!value) return 'depuis le déploiement du tracking';
  return value.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export const AdminAnalyticsPage: React.FC = () => {
  const {
    loading,
    stats,
    dailySnapshots,
    trafficTotals,
    trafficDaily,
    roleBreakdown,
    users,
    moderationScore,
  } = useAdminData();
  const { colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c), [c]);
  const [trafficPeriod, setTrafficPeriod] = useState<TrafficPeriod>('7d');

  const activeUsers = users.filter((u) => u.is_active !== false).length;
  const trafficAgg = useMemo(
    () => sumTraffic(trafficDaily, trafficPeriod),
    [trafficDaily, trafficPeriod],
  );
  const displaySite =
    trafficPeriod === 'all' ? trafficTotals.site_visits : trafficAgg.site;
  const displayApp =
    trafficPeriod === 'all' ? trafficTotals.app_opens : trafficAgg.app;
  const trafficRows = trafficPeriod === 'all' ? trafficDaily : trafficAgg.rows;

  return (
    <AdminPageScaffold loading={loading}>
      <Text style={styles.section}>Visites site & app</Text>
      <Text style={styles.trafficHint}>
        Compteurs réels · {formatStartedAt(trafficTotals.tracking_started_at)}
      </Text>

      <View style={styles.periodRow}>
        {TRAFFIC_PERIODS.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => setTrafficPeriod(p.id)}
            style={[styles.periodChip, trafficPeriod === p.id && styles.periodChipActive]}
          >
            <Text
              style={[
                styles.periodChipText,
                trafficPeriod === p.id && styles.periodChipTextActive,
              ]}
            >
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.scoreRow}>
        <ScoreCard
          label="Visites site"
          value={displaySite}
          hint="Sessions navigateur"
          styles={styles}
        />
        <ScoreCard
          label="Ouvertures app"
          value={displayApp}
          hint="Cold start / lancement"
          styles={styles}
        />
      </View>

      <View style={styles.snapCard}>
        <Text style={styles.snapTitle}>Détail journalier</Text>
        {trafficRows.length === 0 ? (
          <Text style={styles.snapLine}>
            Aucune visite sur cette période (0 depuis le déploiement).
          </Text>
        ) : (
          trafficRows.slice(0, 14).map((row) => (
            <Text key={row.day_key} style={styles.snapLine}>
              {row.day_key} · site {row.site_visits} · app {row.app_opens}
            </Text>
          ))
        )}
      </View>

      {stats ? (
        <>
          <Text style={styles.section}>Plateforme</Text>
          <View style={styles.scoreRow}>
            <ScoreCard
              label="Charge modération"
              value={moderationScore}
              hint="Score pondéré files ouvertes"
              styles={styles}
            />
            <ScoreCard
              label="Comptes actifs"
              value={activeUsers}
              hint={`sur ${stats.users} inscrits`}
              styles={styles}
            />
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
    trafficHint: {
      marginTop: -4,
      marginBottom: spacing.sm,
      fontSize: 11,
      color: c.textMuted,
      fontWeight: '600',
    },
    periodRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginBottom: spacing.sm,
    },
    periodChip: {
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      backgroundColor: c.surface,
    },
    periodChipActive: {
      backgroundColor: c.text,
      borderColor: c.text,
    },
    periodChipText: {
      fontSize: 11,
      fontWeight: '700',
      color: c.textSecondary,
      textTransform: 'uppercase',
    },
    periodChipTextActive: { color: c.surface },
    snapCard: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: 4,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: spacing.md,
      ...shadows.card,
    },
    snapTitle: { fontSize: 13, fontWeight: '800', color: c.text, marginBottom: spacing.xs },
    snapLine: { fontSize: 11, color: c.textSecondary, fontWeight: '600' },
  });
}
