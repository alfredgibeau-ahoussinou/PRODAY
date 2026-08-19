import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
  RefreshControl,
  Platform,
  TextInput,
} from 'react-native';
import { useAdminData } from '../../../context/AdminDataContext';
import { adminService } from '../../../services/admin.service';
import { adminAuditService } from '../../../services/adminAudit.service';
import { subscriptionUpgradeRequestService } from '../../../services/subscriptionUpgradeRequest.service';
import { AdminFocAbonnementsScreen } from './AdminFocAbonnementsScreen';
import { AdminSponsorQuotePanel } from '../../../components/admin/AdminSponsorQuotePanel';
import { AdminActionRow, AdminButton } from '../../../components/admin/AdminButton';
import { ADMIN_ABONNEMENTS_TABS } from '../../../navigation/adminNavConfig';
import { AdminFocTabs, AdminFocPageHeader } from '../../../components/admin/foc/AdminFocTabs';
import { Icon } from '../../../components/ui/Icon';
import { adminChrome, adminType } from '../../../theme/adminTheme';
import { spacing, radius } from '../../../theme/designTokens';
import type { TeamPaymentRequest } from '../../../models/TeamFinance';
import type { ShopOrder } from '../../../models/ShopOrder';
import type { SubscriptionUpgradeRequest } from '../../../models/SubscriptionUpgradeRequest';
import { SUBSCRIPTION_PLANS, type SubscriptionPlanId } from '../../../content/subscriptionPlans';
import { isSubscriptionAccessActive } from '../../../utils/subscriptionLogic';
import { weeklyDeltaSentence, computeWeeklyDeltaPct } from '../../../utils/adminCopilot';
import {
  canAdminWorkInlineAction,
  confirmAdminWorkApprove,
  confirmAdminWorkReject,
  runAdminWorkApprove,
  runAdminWorkReject,
} from '../../../utils/adminWorkQueueActions';
import { useAuth } from '../../../context/AuthContext';

const TABS = ADMIN_ABONNEMENTS_TABS;
type TabId = (typeof TABS)[number]['id'];

const LEGACY_TAB: Record<string, TabId> = {
  abonnements: 'abonnements',
  paiements: 'paiements',
  sponsors: 'sponsors',
  boutique: 'boutique',
  vue: 'vue',
  demandes: 'abonnements',
  comptes: 'abonnements',
};

function formatDate(d: Date | null | undefined): string {
  if (!d) return '—';
  try {
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
  } catch {
    return '—';
  }
}

function PaymentRow({
  payment,
  onAction,
}: {
  payment: TeamPaymentRequest;
  onAction: (p: TeamPaymentRequest) => void;
}) {
  const isPaid = payment.status === 'paid';
  return (
    <Pressable
      style={({ pressed }) => [s.row, pressed && s.rowPressed]}
      onPress={() => onAction(payment)}
    >
      <View style={s.rowMain}>
        <Text style={s.rowTitle} numberOfLines={1}>
          {payment.label || payment.member_name}
        </Text>
        <Text style={s.rowSub} numberOfLines={1}>
          {payment.amount_eur != null ? `${payment.amount_eur} €` : '—'} · {formatDate(payment.due_at)}
        </Text>
      </View>
      <View style={[s.badge, isPaid ? s.badgePaid : s.badgePending]}>
        <Text style={[s.badgeText, isPaid ? s.badgePaidText : s.badgePendingText]}>
          {isPaid ? 'Payé' : 'En attente'}
        </Text>
      </View>
      <Icon name="chevron-forward" size={14} color={adminChrome.textMuted} />
    </Pressable>
  );
}

function ShopOrderRow({
  order,
  onAction,
}: {
  order: ShopOrder;
  onAction: (o: ShopOrder) => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [s.row, pressed && s.rowPressed]}
      onPress={() => onAction(order)}
    >
      <View style={s.rowMain}>
        <Text style={s.rowTitle} numberOfLines={1}>
          {order.lines?.[0]?.name || `Commande #${order.id.slice(0, 8)}`}
        </Text>
        <Text style={s.rowSub} numberOfLines={1}>
          {order.total_eur != null ? `${order.total_eur} €` : '—'} · {formatDate(order.created_at)}
        </Text>
      </View>
      <View style={[s.badge, order.status === 'paid' ? s.badgePaid : s.badgePending]}>
        <Text style={[s.badgeText, order.status === 'paid' ? s.badgePaidText : s.badgePendingText]}>
          {order.status === 'paid' ? 'Payé' : order.status === 'cancelled' ? 'Annulé' : 'En attente'}
        </Text>
      </View>
      <Icon name="chevron-forward" size={14} color={adminChrome.textMuted} />
    </Pressable>
  );
}

export function AdminFocFinancesScreen({
  initialTab,
  onOpenUser,
}: {
  initialTab?: string;
  onOpenUser?: (uid: string) => void;
} = {}) {
  const {
    payments,
    users,
    workQueue,
    subscriptionUpgradeRequests,
    sponsorQuoteRequests,
    refresh,
    refreshing,
    dailySnapshots,
  } = useAdminData();
  const { profile, firebaseUser } = useAuth();
  const [tab, setTab] = useState<TabId>('vue');
  const [shopOrders, setShopOrders] = useState<ShopOrder[]>([]);
  const [loadingShop, setLoadingShop] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  useEffect(() => {
    if (!initialTab) return;
    const mapped = LEGACY_TAB[initialTab] ?? (TABS.some((t) => t.id === initialTab) ? (initialTab as TabId) : null);
    if (mapped) setTab(mapped);
  }, [initialTab]);

  const loadShop = useCallback(async () => {
    setLoadingShop(true);
    try {
      const orders = await adminService.listShopOrders(100);
      setShopOrders(orders);
    } finally {
      setLoadingShop(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'boutique') void loadShop();
  }, [tab, loadShop]);

  const handleRefresh = useCallback(async () => {
    await refresh();
    if (tab === 'boutique') await loadShop();
  }, [refresh, tab, loadShop]);

  const stats = useMemo(() => {
    let pro = 0;
    let free = 0;
    let canceled = 0;
    let pastDue = 0;
    for (const u of users) {
      if (isSubscriptionAccessActive(u)) pro += 1;
      else free += 1;
      if (u.subscription_status === 'canceled') canceled += 1;
      if (u.subscription_status === 'past_due') pastDue += 1;
    }
    const pendingClubPay = payments.filter((p) => p.status !== 'paid').length;
    const pendingQuotes = sponsorQuoteRequests.filter((q) => q.status === 'pending').length;
    return {
      pro,
      free,
      canceled,
      pastDue,
      pendingRequests: subscriptionUpgradeRequests.length,
      pendingClubPay,
      pendingQuotes,
    };
  }, [users, payments, subscriptionUpgradeRequests, sponsorQuoteRequests]);

  const queueItems = useMemo(
    () =>
      workQueue.filter((w) =>
        ['subscription_request', 'payment', 'quote', 'membership'].includes(w.kind),
      ),
    [workQueue],
  );

  const handlePaymentAction = useCallback(
    (p: TeamPaymentRequest) => {
      const isPaid = p.status === 'paid';
      Alert.alert(
        p.label || 'Paiement',
        `Montant : ${p.amount_eur != null ? `${p.amount_eur} €` : '—'}\nStatut : ${isPaid ? 'Payé' : 'En attente'}`,
        [
          ...(!isPaid
            ? [
                {
                  text: 'Marquer payé',
                  onPress: async () => {
                    try {
                      await adminService.updatePaymentStatus(p.id, 'paid');
                      void refresh();
                    } catch {
                      Alert.alert('Erreur', 'Impossible de mettre à jour ce paiement.');
                    }
                  },
                },
              ]
            : []),
          {
            text: 'Supprimer',
            style: 'destructive' as const,
            onPress: () => {
              Alert.alert('Supprimer ?', 'Cette action est irréversible.', [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Supprimer',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await adminService.deletePaymentRequest(p.id);
                      void refresh();
                    } catch {
                      Alert.alert('Erreur', 'Impossible de supprimer ce paiement.');
                    }
                  },
                },
              ]);
            },
          },
          { text: 'Fermer', style: 'cancel' },
        ],
        { cancelable: true },
      );
    },
    [refresh],
  );

  const handleShopAction = useCallback(
    (order: ShopOrder) => {
      const buttons: Parameters<typeof Alert.alert>[2] = [];
      if (order.status !== 'paid') {
        buttons.push({
          text: 'Marquer payé',
          onPress: async () => {
            try {
              await adminService.updateShopOrderStatus(order.id, 'paid');
              await loadShop();
              Alert.alert('Boutique', 'Commande marquée payée.');
            } catch {
              Alert.alert('Erreur', 'Impossible de mettre à jour cette commande.');
            }
          },
        });
      }
      if (order.status !== 'cancelled') {
        buttons.push({
          text: 'Annuler la commande',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.updateShopOrderStatus(order.id, 'cancelled');
              await loadShop();
              Alert.alert('Boutique', 'Commande annulée.');
            } catch {
              Alert.alert('Erreur', 'Impossible d’annuler cette commande.');
            }
          },
        });
      }
      buttons.push({ text: 'Fermer', style: 'cancel' });
      Alert.alert(
        order.lines?.[0]?.name || 'Commande',
        `Montant : ${order.total_eur != null ? `${order.total_eur} €` : '—'}\nStatut : ${order.status}`,
        buttons,
        { cancelable: true },
      );
    },
    [loadShop],
  );

  const approveRequest = async (req: SubscriptionUpgradeRequest) => {
    setBusyId(req.id);
    try {
      const work = workQueue.find((w) => w.id === `subreq-${req.id}`);
      if (work && canAdminWorkInlineAction(work, 'approve')) {
        await runAdminWorkApprove(work, refresh);
      } else {
        const result = await subscriptionUpgradeRequestService.updateRequestStatus(req.id, 'approved');
        if (!result.ok) throw new Error('Impossible d’approuver.');
        await adminService.grantProSubscription(
          req.user_uid,
          req.plan_id,
          req.billing === 'yearly' ? 12 : 1,
          'Demande d’abonnement approuvée',
          false,
        );
        await adminAuditService.log({
          action: 'subscription_granted',
          actor_uid: profile?.uid ?? '',
          actor_email: firebaseUser?.email ?? profile?.email,
          target_type: 'user_subscription',
          target_id: req.user_uid,
          summary: `Demande approuvée · ${req.plan_id}`,
        });
        await refresh();
        Alert.alert('Abonnement', 'Formule accordée automatiquement.');
      }
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Action impossible');
    } finally {
      setBusyId(null);
    }
  };

  const rejectRequest = async (req: SubscriptionUpgradeRequest, note: string) => {
    setBusyId(req.id);
    try {
      const result = await subscriptionUpgradeRequestService.updateRequestStatus(
        req.id,
        'rejected',
        note.trim() || 'Refus admin',
      );
      if (!result.ok) throw new Error('Impossible de refuser.');
      await adminAuditService.log({
        action: 'subscription_revoked',
        actor_uid: profile?.uid ?? '',
        actor_email: firebaseUser?.email ?? profile?.email,
        target_type: 'user_subscription',
        target_id: req.user_uid,
        summary: `Demande refusée · ${note.trim() || 'Refus admin'}`,
      });
      await refresh();
      Alert.alert('Demande', 'Refus enregistré.');
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Action impossible');
    } finally {
      setBusyId(null);
    }
  };

  const askReject = (req: SubscriptionUpgradeRequest) => {
    const submit = (note: string) => void rejectRequest(req, note);
    if (Platform.OS === 'ios') {
      Alert.prompt('Refuser la demande', 'Note admin (optionnel)', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Refuser', style: 'destructive', onPress: (v?: string) => submit(v ?? rejectNote) },
      ]);
      return;
    }
    Alert.alert('Refuser la demande', rejectNote.trim() ? `Note : ${rejectNote}` : 'Confirmer le refus ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Refuser', style: 'destructive', onPress: () => submit(rejectNote) },
    ]);
  };

  return (
    <View style={s.root}>
      <AdminFocPageHeader
        title="Business"
        subtitle="Revenus et abos réels — grants toujours ici. Aucun KPI inventé."
      />
      <AdminFocTabs tabs={[...TABS]} value={tab} onChange={(id) => setTab(id as TabId)} />

      {tab === 'vue' ? (
        <FlatList
          data={queueItems}
          keyExtractor={(i) => i.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={adminChrome.accent} />
          }
          ListHeaderComponent={
            <View style={s.vueHead}>
              <View style={s.kpiRow}>
                <Kpi label="Pro actifs" value={stats.pro} hot />
                <Kpi label="Gratuit" value={stats.free} />
                <Kpi label="Demandes" value={stats.pendingRequests} warn={stats.pendingRequests > 0} />
                <Kpi label="Résiliés" value={stats.canceled} />
                <Kpi label="Impayés" value={stats.pastDue} warn={stats.pastDue > 0} />
                <Kpi label="Paiements club" value={stats.pendingClubPay} warn={stats.pendingClubPay > 0} />
              </View>
              <Text style={s.deltaLine}>
                {weeklyDeltaSentence(computeWeeklyDeltaPct(dailySnapshots, 'users'), 'Users')}
              </Text>
              <Text style={s.sectionTitle}>À traiter</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={s.queueCard}>
              <Text style={s.kind}>{item.kind === 'subscription_request' ? 'Abonnement' : item.kind}</Text>
              <Text style={s.rowTitle}>{item.title}</Text>
              {item.subtitle ? <Text style={s.rowSub}>{item.subtitle}</Text> : null}
              <AdminActionRow
                showApprove={canAdminWorkInlineAction(item, 'approve')}
                showReject={canAdminWorkInlineAction(item, 'reject')}
                onApprove={() =>
                  confirmAdminWorkApprove(item, async () => {
                    setBusyId(item.id);
                    try {
                      await runAdminWorkApprove(item, refresh);
                    } finally {
                      setBusyId(null);
                    }
                  })
                }
                onReject={() =>
                  confirmAdminWorkReject(item, async () => {
                    setBusyId(item.id);
                    try {
                      await runAdminWorkReject(item, refresh);
                    } finally {
                      setBusyId(null);
                    }
                  })
                }
                approveLoading={busyId === item.id}
                rejectLoading={busyId === item.id}
              />
              {item.kind === 'subscription_request' && onOpenUser && item.entityId ? (
                <AdminButton
                  label="Ouvrir la fiche"
                  variant="ghost"
                  size="sm"
                  onPress={() => onOpenUser(item.entityId!)}
                />
              ) : null}
            </View>
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Icon name="checkmark-circle" size={32} color={adminChrome.pitch} />
              <Text style={s.emptyTitle}>File vide</Text>
              <Text style={s.emptySub}>Aucune demande d’abonnement, paiement club ou devis en attente.</Text>
            </View>
          }
          contentContainerStyle={queueItems.length === 0 ? s.emptyContainer : s.list}
        />
      ) : tab === 'abonnements' ? (
        <AdminFocAbonnementsScreen onOpenUser={onOpenUser} embedded />
      ) : tab === 'paiements' ? (
        <FlatList
          data={payments}
          keyExtractor={(p) => p.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={adminChrome.accent} />
          }
          renderItem={({ item }) => <PaymentRow payment={item} onAction={handlePaymentAction} />}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Icon name="bag" size={32} color={adminChrome.textMuted} />
              <Text style={s.emptyTitle}>Aucun paiement</Text>
              <Text style={s.emptySub}>Aucune demande de paiement club.</Text>
            </View>
          }
          contentContainerStyle={payments.length === 0 ? s.emptyContainer : s.list}
        />
      ) : tab === 'sponsors' ? (
        <AdminSponsorQuotePanel />
      ) : tab === 'boutique' ? (
        <FlatList
          data={shopOrders}
          keyExtractor={(o) => o.id}
          refreshControl={
            <RefreshControl refreshing={loadingShop} onRefresh={loadShop} tintColor={adminChrome.accent} />
          }
          renderItem={({ item }) => <ShopOrderRow order={item} onAction={handleShopAction} />}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Icon name="bag" size={32} color={adminChrome.textMuted} />
              <Text style={s.emptyTitle}>Aucune commande</Text>
              <Text style={s.emptySub}>Aucune commande boutique enregistrée.</Text>
            </View>
          }
          contentContainerStyle={shopOrders.length === 0 ? s.emptyContainer : s.list}
        />
      ) : null}
    </View>
  );
}

function Kpi({
  label,
  value,
  hot,
  warn,
}: {
  label: string;
  value: number;
  hot?: boolean;
  warn?: boolean;
}) {
  return (
    <View style={s.kpi}>
      <Text style={s.kpiLabel}>{label}</Text>
      <Text style={[s.kpiValue, hot && s.kpiHot, warn && s.kpiWarn]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminChrome.band },
  list: { padding: spacing.md, paddingBottom: 80, gap: spacing.sm },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  empty: { alignItems: 'center', gap: spacing.md, paddingTop: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: adminChrome.text },
  emptySub: { fontSize: 13, color: adminChrome.textMuted, textAlign: 'center', lineHeight: 20 },
  sep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: adminChrome.shellBorder,
    marginLeft: spacing.md,
  },
  vueHead: { gap: spacing.md, marginBottom: spacing.sm },
  deltaLine: {
    fontSize: 13,
    lineHeight: 18,
    color: adminChrome.textSecondary,
    paddingHorizontal: spacing.xs,
  },
  kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kpi: {
    minWidth: 96,
    flexGrow: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: adminChrome.radiusSm,
    backgroundColor: adminChrome.shell,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: adminChrome.shellBorder,
  },
  kpiLabel: {
    fontFamily: adminType.bodyExtra,
    fontSize: 9,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: adminChrome.textMuted,
  },
  kpiValue: {
    fontFamily: adminType.bodyExtra,
    fontSize: 20,
    fontWeight: '800',
    color: adminChrome.text,
    marginTop: 2,
  },
  kpiHot: { color: adminChrome.accent },
  kpiWarn: { color: adminChrome.danger },
  sectionTitle: {
    fontFamily: adminType.bodyExtra,
    fontSize: 13,
    fontWeight: '800',
    color: adminChrome.text,
  },
  queueCard: {
    backgroundColor: adminChrome.shell,
    borderRadius: adminChrome.radius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: adminChrome.shellBorder,
    padding: spacing.md,
    gap: 4,
    marginBottom: spacing.sm,
  },
  kind: {
    fontFamily: adminType.bodyExtra,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: adminChrome.accent,
  },
  noteInput: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: adminChrome.shellBorder,
    backgroundColor: adminChrome.shell,
    color: adminChrome.text,
    borderRadius: adminChrome.radiusSm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    backgroundColor: adminChrome.shell,
  },
  rowPressed: { backgroundColor: adminChrome.rowHover },
  rowMain: { flex: 1, minWidth: 0, gap: 2 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: adminChrome.text },
  rowSub: { fontSize: 12, color: adminChrome.textMuted },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  badgePaid: {
    backgroundColor: adminChrome.pitchSoft,
    borderColor: 'rgba(22,163,74,0.25)',
  },
  badgePending: {
    backgroundColor: adminChrome.shellMid,
    borderColor: adminChrome.shellBorder,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  badgePaidText: { color: adminChrome.pitch },
  badgePendingText: { color: adminChrome.textMuted },
});
