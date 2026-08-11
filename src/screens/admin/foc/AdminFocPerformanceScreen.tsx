import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAdminData } from '../../../context/AdminDataContext';
import { ADMIN_FOC_TABS } from '../../../navigation/adminFocConfig';
import { AdminFocTabs, AdminFocPageHeader } from '../../../components/admin/foc/AdminFocTabs';
import { AdminFocKpiCard } from '../../../components/admin/foc';
import { adminChrome } from '../../../theme/adminTheme';
import { spacing } from '../../../theme/designTokens';

const TABS = ADMIN_FOC_TABS.performance;
type TabId = (typeof TABS)[number]['id'];

/* ─── KPI Card mini ─────────────────────────────────────────────────── */

function StatRow({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <View style={s.statRow}>
      <View style={s.statMain}>
        <Text style={s.statLabel}>{label}</Text>
        {sub ? <Text style={s.statSub}>{sub}</Text> : null}
      </View>
      <Text style={s.statValue}>{value}</Text>
    </View>
  );
}

/* ─── Screen ─────────────────────────────────────────────────────────── */

export function AdminFocPerformanceScreen() {
  const insets = useSafeAreaInsets();
  const { stats, trafficTotals, trafficDaily, roleBreakdown, users, clubs, workQueue, refresh, refreshing } =
    useAdminData();
  const [tab, setTab] = useState<TabId>('stats');

  const pending = useMemo(() => workQueue.length, [workQueue]);

  const traffic7d = useMemo(() => {
    const slice = trafficDaily.slice(-7);
    return slice.reduce(
      (acc, d) => ({
        visits: acc.visits + (d.site_visits ?? 0),
        opens: acc.opens + (d.app_opens ?? 0),
      }),
      { visits: 0, opens: 0 },
    );
  }, [trafficDaily]);

  const playerCount = useMemo(
    () => roleBreakdown.find((r) => r.role === 'player')?.count ?? 0,
    [roleBreakdown],
  );
  const coachCount = useMemo(
    () => roleBreakdown.find((r) => r.role === 'coach')?.count ?? 0,
    [roleBreakdown],
  );
  const clubCount = useMemo(
    () => roleBreakdown.find((r) => r.role === 'club')?.count ?? 0,
    [roleBreakdown],
  );

  return (
    <View style={s.root}>
      <AdminFocPageHeader title="Performance" />
      <AdminFocTabs tabs={TABS} value={tab} onChange={(id) => setTab(id as TabId)} />

      {tab === 'stats' ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.content, { paddingBottom: insets.bottom + spacing.xl }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={adminChrome.accent} />
          }
        >
          {/* KPI grid */}
          <View style={s.kpiGrid}>
            <View style={s.kpiCell}>
              <AdminFocKpiCard
                label="Adhérents totaux"
                value={stats?.users ?? users.length}
                icon="people"
              />
            </View>
            <View style={s.kpiCell}>
              <AdminFocKpiCard
                label="Clubs actifs"
                value={stats?.clubs ?? clubs.length}
                icon="business"
              />
            </View>
            <View style={s.kpiCell}>
              <AdminFocKpiCard
                label="Vérifications en attente"
                value={stats?.pendingVerifications ?? pending}
                icon="alert-circle"
                hot={(stats?.pendingVerifications ?? pending) > 0}
              />
            </View>
            <View style={s.kpiCell}>
              <AdminFocKpiCard
                label="Matchs enregistrés"
                value={stats?.friendlyMatches ?? 0}
                icon="football"
              />
            </View>
          </View>

          {/* Role breakdown */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Répartition des rôles</Text>
            <View style={s.card}>
              <StatRow label="Joueurs" value={playerCount} />
              <View style={s.divider} />
              <StatRow label="Coachs" value={coachCount} />
              <View style={s.divider} />
              <StatRow label="Dirigeants" value={clubCount} />
              {roleBreakdown
                .filter((r) => !['player', 'coach', 'club'].includes(r.role))
                .map((r) => (
                  <React.Fragment key={r.role}>
                    <View style={s.divider} />
                    <StatRow label={r.role} value={r.count} />
                  </React.Fragment>
                ))}
            </View>
          </View>
        </ScrollView>
      ) : tab === 'traffic' ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.content, { paddingBottom: insets.bottom + spacing.xl }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={adminChrome.accent} />
          }
        >
          <View style={s.kpiGrid}>
            <View style={s.kpiCell}>
              <AdminFocKpiCard
                label="Visites site (total)"
                value={trafficTotals.site_visits}
                icon="globe"
              />
            </View>
            <View style={s.kpiCell}>
              <AdminFocKpiCard
                label="Ouvertures app (total)"
                value={trafficTotals.app_opens}
                icon="star-four-points"
              />
            </View>
            <View style={s.kpiCell}>
              <AdminFocKpiCard
                label="Visites site (7j)"
                value={traffic7d.visits}
                icon="star"
              />
            </View>
            <View style={s.kpiCell}>
              <AdminFocKpiCard
                label="Ouvertures app (7j)"
                value={traffic7d.opens}
                icon="star-outline"
              />
            </View>
          </View>

          {trafficDaily.length > 0 ? (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Historique quotidien</Text>
              <View style={s.card}>
                {[...trafficDaily].reverse().slice(0, 14).map((row, i) => (
                  <React.Fragment key={row.day_key}>
                    {i > 0 ? <View style={s.divider} /> : null}
                    <StatRow
                      label={row.day_key}
                      value={`${row.site_visits ?? 0} visites`}
                      sub={`${row.app_opens ?? 0} ouvertures app`}
                    />
                  </React.Fragment>
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminChrome.band },
  content: { padding: spacing.md, gap: spacing.md },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  kpiCell: { width: '47%', flexGrow: 1 },
  section: { gap: spacing.sm },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: adminChrome.textMuted,
  },
  card: {
    backgroundColor: adminChrome.shell,
    borderRadius: adminChrome.radius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: adminChrome.shellBorder,
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    gap: spacing.sm,
  },
  statMain: { flex: 1, minWidth: 0, gap: 2 },
  statLabel: { fontSize: 14, fontWeight: '600', color: adminChrome.text },
  statSub: { fontSize: 11, color: adminChrome.textMuted },
  statValue: { fontSize: 18, fontWeight: '800', color: adminChrome.accent },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: adminChrome.shellBorder,
  },
});
