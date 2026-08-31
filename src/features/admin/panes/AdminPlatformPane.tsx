import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useAdminData } from '../data/AdminDataContext';
import {
  AdminBadge,
  AdminCard,
  AdminLoading,
  AdminMetric,
  AdminPaneHeader,
  AdminText,
} from '../ui/adminUi';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminLayout, adminRadius, adminSpace } from '../theme/adminDesignSystem';

export function AdminPlatformPane() {
  const data = useAdminData();
  const t = ADMIN_TOKENS;

  if (data.loading) return <AdminLoading />;

  const healthTone =
    data.health.score >= 75 ? 'success' : data.health.score >= 55 ? 'warn' : 'danger';

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={data.refreshing}
          onRefresh={() => void data.refresh()}
          tintColor={t.accent}
        />
      }
    >
      <AdminPaneHeader title="Plateforme" subtitle="Santé système, activité, trafic" />

      <AdminCard>
        <View style={styles.health}>
          <AdminText variant="stat" color={
            healthTone === 'success' ? t.healthGood : healthTone === 'warn' ? t.healthMid : t.healthBad
          }>
            {data.health.score}%
          </AdminText>
          <View style={{ flex: 1, gap: 4 }}>
            <AdminText variant="h2">ProDay Health</AdminText>
            <AdminText variant="body" color={t.muted}>
              {data.health.label}. Score heuristique basé sur vérifs, signalements, paiements et file d’actions.
            </AdminText>
            <AdminBadge label={`Charge modération ${data.moderationScore}`} tone={healthTone} />
          </View>
        </View>
      </AdminCard>

      <View style={styles.metrics}>
        <AdminMetric label="Visites site" value={data.trafficTotals.site_visits} />
        <AdminMetric label="Ouvertures app" value={data.trafficTotals.app_opens} />
        <AdminMetric label="Matchs" value={data.stats?.friendlyMatches ?? 0} />
        <AdminMetric label="Événements" value={data.stats?.teamEvents ?? 0} />
        <AdminMetric label="Caméras" value={data.cameras.length} />
        <AdminMetric label="Tournois" value={data.tournaments.length} />
      </View>

      <AdminCard>
        <AdminText variant="h2">Alertes actives</AdminText>
        <AdminText variant="body" color={t.muted}>
          {data.workQueue.length} éléments dans la file · {data.stats?.pendingVerifications ?? 0} vérifs ·{' '}
          {data.stats?.reelReports ?? 0} signalements · {data.stats?.pendingPayments ?? 0} paiements
        </AdminText>
      </AdminCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: adminLayout.pageGutter, gap: adminLayout.sectionGap, paddingBottom: adminLayout.dockClearance },
  health: { flexDirection: 'row', gap: adminSpace.lg, alignItems: 'center' },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpace.sm },
});
