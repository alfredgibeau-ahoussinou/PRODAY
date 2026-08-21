import React, { useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useAdminData } from '../data/AdminDataContext';
import {
  AdminBadge,
  AdminCard,
  AdminLoading,
  AdminMetric,
  AdminText,
} from '../ui/adminUi';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminSpace } from '../theme/adminDesignSystem';

export function AdminFinancePane() {
  const data = useAdminData();
  const t = ADMIN_TOKENS;

  const finance = useMemo(() => {
    const pending = data.payments.filter((p) => p.status === 'pending');
    const paid = data.payments.filter((p) => p.status === 'paid');
    const pendingSum = pending.reduce((s, p) => s + (p.amount_eur || 0), 0);
    const paidSum = paid.reduce((s, p) => s + (p.amount_eur || 0), 0);
    const paidUsers = data.users.filter(
      (u) => u.subscription_tier && u.subscription_tier !== 'free',
    );
    const mrrEstimate = paidUsers.length * 3.99;
    return {
      pendingCount: pending.length,
      pendingSum,
      paidSum,
      paidUsers: paidUsers.length,
      mrrEstimate,
      arrEstimate: mrrEstimate * 12,
      upgradeReqs: data.subscriptionUpgradeRequests.length,
    };
  }, [data.payments, data.users, data.subscriptionUpgradeRequests]);

  if (data.loading) return <AdminLoading />;

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
      <AdminText variant="h1">Finances</AdminText>
      <AdminText variant="caption" color={t.muted}>
        Revenus, paiements équipe, abonnements — données Firestore réelles
      </AdminText>

      <View style={styles.metrics}>
        <AdminMetric label="MRR estimé" value={`${finance.mrrEstimate.toFixed(0)} €`} hint={`${finance.paidUsers} abonnés`} />
        <AdminMetric label="ARR estimé" value={`${finance.arrEstimate.toFixed(0)} €`} />
        <AdminMetric label="Encaissé (sample)" value={`${finance.paidSum.toFixed(0)} €`} tone="success" />
        <AdminMetric
          label="Impayés / pending"
          value={`${finance.pendingSum.toFixed(0)} €`}
          hint={`${finance.pendingCount} demandes`}
          tone={finance.pendingCount ? 'warn' : 'default'}
        />
      </View>

      <AdminCard>
        <AdminText variant="h2">Demandes d’abonnement</AdminText>
        {finance.upgradeReqs === 0 ? (
          <AdminText variant="body" color={t.muted}>
            Aucune demande en attente.
          </AdminText>
        ) : (
          data.subscriptionUpgradeRequests.slice(0, 12).map((r) => (
            <View key={r.id} style={[styles.row, { borderColor: t.hairline }]}>
              <View style={{ flex: 1 }}>
                <AdminText variant="h3">{r.display_name}</AdminText>
                <AdminText variant="caption" color={t.muted}>
                  {r.plan_id} · {r.billing}
                </AdminText>
              </View>
              <AdminBadge label={r.status} tone="warn" />
            </View>
          ))
        )}
      </AdminCard>

      <AdminCard>
        <AdminText variant="h2">Paiements équipes (récents)</AdminText>
        {data.payments.slice(0, 15).map((p) => (
          <View key={p.id} style={[styles.row, { borderColor: t.hairline }]}>
            <View style={{ flex: 1 }}>
              <AdminText variant="h3">{p.label}</AdminText>
              <AdminText variant="caption" color={t.muted}>
                {p.member_name} · {p.amount_eur} €
              </AdminText>
            </View>
            <AdminBadge
              label={p.status}
              tone={p.status === 'paid' ? 'success' : p.status === 'pending' ? 'warn' : 'info'}
            />
          </View>
        ))}
      </AdminCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: adminSpace.lg, gap: adminSpace.lg, paddingBottom: 48 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpace.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
