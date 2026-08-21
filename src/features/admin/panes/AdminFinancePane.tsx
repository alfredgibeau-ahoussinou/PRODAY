import React, { useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useAdminData } from '../data/AdminDataContext';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminLoading,
  AdminMetric,
  AdminText,
} from '../ui/adminUi';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminSpace } from '../theme/adminDesignSystem';
import { adminService } from '../../../services/admin.service';
import { subscriptionUpgradeRequestService } from '../../../services/subscriptionUpgradeRequest.service';
import { confirmAdminAction } from '../utils/confirmAdminAction';
import { useAuth } from '../../../context/AuthContext';
import { adminAuditService } from '../../../services/adminAudit.service';

export function AdminFinancePane() {
  const data = useAdminData();
  const { firebaseUser, profile } = useAuth();
  const t = ADMIN_TOKENS;
  const [busyId, setBusyId] = useState<string | null>(null);

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
      pending,
      paid,
      pendingCount: pending.length,
      pendingSum,
      paidSum,
      paidUsers: paidUsers.length,
      mrrEstimate,
      arrEstimate: mrrEstimate * 12,
      upgradeReqs: data.subscriptionUpgradeRequests,
    };
  }, [data.payments, data.users, data.subscriptionUpgradeRequests]);

  const run = async (id: string, fn: () => Promise<void>) => {
    setBusyId(id);
    try {
      await fn();
      await data.refresh();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
    } finally {
      setBusyId(null);
    }
  };

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
        Actions réelles : paiements, demandes d’abo, abonnés
      </AdminText>

      <View style={styles.metrics}>
        <AdminMetric
          label="MRR estimé"
          value={`${finance.mrrEstimate.toFixed(0)} €`}
          hint={`${finance.paidUsers} abonnés`}
        />
        <AdminMetric label="ARR estimé" value={`${finance.arrEstimate.toFixed(0)} €`} />
        <AdminMetric
          label="Encaissé (sample)"
          value={`${finance.paidSum.toFixed(0)} €`}
          tone="success"
        />
        <AdminMetric
          label="Impayés / pending"
          value={`${finance.pendingSum.toFixed(0)} €`}
          hint={`${finance.pendingCount} demandes`}
          tone={finance.pendingCount ? 'warn' : 'default'}
        />
      </View>

      <AdminCard>
        <AdminText variant="h2">Demandes d’abonnement</AdminText>
        {finance.upgradeReqs.length === 0 ? (
          <AdminText variant="body" color={t.muted}>
            Aucune demande en attente.
          </AdminText>
        ) : (
          finance.upgradeReqs.map((r) => (
            <View key={r.id} style={[styles.row, { borderColor: t.hairline }]}>
              <View style={{ flex: 1 }}>
                <AdminText variant="h3">{r.display_name}</AdminText>
                <AdminText variant="caption" color={t.muted}>
                  {r.plan_id} · {r.billing} · {r.email}
                </AdminText>
              </View>
              <View style={styles.actionsCol}>
                <AdminBadge label={r.status} tone="warn" />
                <AdminButton
                  label="Approuver"
                  disabled={busyId === r.id}
                  onPress={() =>
                    confirmAdminAction(
                      'Approuver la demande ?',
                      `Active ${r.plan_id} pour ${r.display_name}.`,
                      () =>
                        run(r.id, async () => {
                          const result =
                            await subscriptionUpgradeRequestService.updateRequestStatus(
                              r.id,
                              'approved',
                            );
                          if (!result.ok) throw new Error('Échec approbation');
                          await adminService.grantProSubscription(
                            r.user_uid,
                            r.plan_id,
                            r.billing === 'yearly' ? 12 : 1,
                            'Demande abo approuvée (admin)',
                            false,
                          );
                          await adminAuditService.log({
                            action: 'subscription_granted',
                            actor_uid: firebaseUser?.uid ?? 'admin',
                            actor_email: profile?.email ?? undefined,
                            target_type: 'subscription_upgrade_request',
                            target_id: r.id,
                            summary: `Abo ${r.plan_id} pour ${r.user_uid}`,
                          });
                        }),
                    )
                  }
                />
                <AdminButton
                  label="Refuser"
                  variant="danger"
                  disabled={busyId === r.id}
                  onPress={() =>
                    confirmAdminAction(
                      'Refuser la demande ?',
                      'Le statut passera à rejected.',
                      () =>
                        run(r.id, async () => {
                          const result =
                            await subscriptionUpgradeRequestService.updateRequestStatus(
                              r.id,
                              'rejected',
                              'Refus admin',
                            );
                          if (!result.ok) throw new Error('Échec refus');
                        }),
                      true,
                    )
                  }
                />
              </View>
            </View>
          ))
        )}
      </AdminCard>

      <AdminCard>
        <AdminText variant="h2">Paiements équipes</AdminText>
        {data.payments.slice(0, 25).map((p) => (
          <View key={p.id} style={[styles.row, { borderColor: t.hairline }]}>
            <View style={{ flex: 1 }}>
              <AdminText variant="h3">{p.label}</AdminText>
              <AdminText variant="caption" color={t.muted}>
                {p.member_name} · {p.amount_eur} €
              </AdminText>
            </View>
            <View style={styles.actionsCol}>
              <AdminBadge
                label={p.status}
                tone={
                  p.status === 'paid' ? 'success' : p.status === 'pending' ? 'warn' : 'info'
                }
              />
              {p.status === 'pending' ? (
                <>
                  <AdminButton
                    label="Marquer payé"
                    disabled={busyId === p.id}
                    onPress={() =>
                      confirmAdminAction('Marquer comme payé ?', `${p.amount_eur} €`, () =>
                        run(p.id, async () => {
                          await adminService.updatePaymentStatus(p.id, 'paid');
                          await adminAuditService.log({
                            action: 'payment_marked_paid',
                            actor_uid: firebaseUser?.uid ?? 'admin',
                            actor_email: profile?.email ?? undefined,
                            target_type: 'team_payment_request',
                            target_id: p.id,
                            summary: `Payé ${p.amount_eur} €`,
                          });
                        }),
                      )
                    }
                  />
                  <AdminButton
                    label="Supprimer"
                    variant="ghost"
                    disabled={busyId === p.id}
                    onPress={() =>
                      confirmAdminAction(
                        'Supprimer la demande de paiement ?',
                        'Suppression Firestore (pas un mock).',
                        () => run(p.id, () => adminService.deletePaymentRequest(p.id)),
                        true,
                      )
                    }
                  />
                </>
              ) : null}
            </View>
          </View>
        ))}
      </AdminCard>

      <AdminCard>
        <AdminText variant="h2">Abonnés payants (aperçu)</AdminText>
        {data.users
          .filter((u) => u.subscription_tier && u.subscription_tier !== 'free')
          .slice(0, 20)
          .map((u) => (
            <View key={u.uid} style={[styles.row, { borderColor: t.hairline }]}>
              <View style={{ flex: 1 }}>
                <AdminText variant="h3">{u.display_name}</AdminText>
                <AdminText variant="caption" color={t.muted}>
                  {u.subscription_plan_id ?? 'pro'} · {u.subscription_status}
                </AdminText>
              </View>
              <AdminButton
                label="Gratuit"
                variant="ghost"
                disabled={busyId === u.uid}
                onPress={() =>
                  confirmAdminAction(
                    'Repasser en gratuit ?',
                    u.display_name,
                    () =>
                      run(u.uid, async () => {
                        await adminService.revokeToFreeSubscription(
                          u.uid,
                          'Révocation finance admin',
                          true,
                        );
                      }),
                    true,
                  )
                }
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
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionsCol: { gap: 6, alignItems: 'flex-end', maxWidth: 140 },
});
