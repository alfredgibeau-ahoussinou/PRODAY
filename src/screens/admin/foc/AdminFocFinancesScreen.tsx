import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { useAdminData } from '../../../context/AdminDataContext';
import { adminService } from '../../../services/admin.service';
import { AdminFocAbonnementsScreen } from './AdminFocAbonnementsScreen';
import { AdminSponsorQuotePanel } from '../../../components/admin/AdminSponsorQuotePanel';
import { ADMIN_FOC_TABS } from '../../../navigation/adminFocConfig';
import { AdminFocTabs, AdminFocPageHeader } from '../../../components/admin/foc/AdminFocTabs';
import { Icon } from '../../../components/ui/Icon';
import { adminChrome } from '../../../theme/adminTheme';
import { spacing, radius } from '../../../theme/designTokens';
import type { TeamPaymentRequest } from '../../../models/TeamFinance';
import type { ShopOrder } from '../../../models/ShopOrder';

const TABS = ADMIN_FOC_TABS.finances;
type TabId = (typeof TABS)[number]['id'];

function formatDate(d: Date | null | undefined): string {
  if (!d) return '—';
  try {
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
  } catch {
    return '—';
  }
}

/* ─── Payment row ───────────────────────────────────────────────────── */

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
          {payment.amount_eur != null ? `${payment.amount_eur} €` : '—'} ·{' '}
          {formatDate(payment.due_at)}
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

/* ─── Shop order row ─────────────────────────────────────────────────── */

function ShopOrderRow({ order }: { order: ShopOrder }) {
  return (
    <View style={s.row}>
      <View style={s.rowMain}>
        <Text style={s.rowTitle} numberOfLines={1}>
          {order.lines?.[0]?.name || `Commande #${order.id.slice(0, 8)}`}
        </Text>
        <Text style={s.rowSub} numberOfLines={1}>
          {order.total_eur != null ? `${order.total_eur} €` : '—'} ·{' '}
          {formatDate(order.created_at)}
        </Text>
      </View>
      <View style={[s.badge, order.status === 'paid' ? s.badgePaid : s.badgePending]}>
        <Text style={[s.badgeText, order.status === 'paid' ? s.badgePaidText : s.badgePendingText]}>
          {order.status === 'paid' ? 'Payé' : order.status === 'cancelled' ? 'Annulé' : 'En attente'}
        </Text>
      </View>
    </View>
  );
}

/* ─── Screen ─────────────────────────────────────────────────────────── */

export function AdminFocFinancesScreen({ initialTab }: { initialTab?: string } = {}) {
  const { payments, refresh, refreshing } = useAdminData();
  const [tab, setTab] = useState<TabId>(
    TABS.some((t) => t.id === initialTab) ? (initialTab as TabId) : 'abonnements',
  );
  const [shopOrders, setShopOrders] = useState<ShopOrder[]>([]);
  const [loadingShop, setLoadingShop] = useState(false);

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
            style: 'destructive',
            onPress: async () => {
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


  return (
    <View style={s.root}>
      <AdminFocPageHeader title="Finances" />
      <AdminFocTabs tabs={TABS} value={tab} onChange={(id) => setTab(id as TabId)} />

      {tab === 'abonnements' ? (
        <AdminFocAbonnementsScreen />
      ) : tab === 'paiements' ? (
        <FlatList
          data={payments}
          keyExtractor={(p) => p.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={adminChrome.accent} />
          }
          renderItem={({ item }) => (
            <PaymentRow payment={item} onAction={handlePaymentAction} />
          )}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Icon name="bag" size={32} color={adminChrome.textMuted} />
              <Text style={s.emptyTitle}>Aucun paiement</Text>
              <Text style={s.emptySub}>Aucune demande de paiement club.</Text>
            </View>
          }
          contentContainerStyle={payments.length === 0 ? s.emptyContainer : s.list}
          showsVerticalScrollIndicator={false}
        />
      ) : tab === 'sponsors' ? (
        <AdminSponsorQuotePanel />
      ) : tab === 'boutique' ? (
        <FlatList
          data={shopOrders}
          keyExtractor={(o) => o.id}
          refreshControl={
            <RefreshControl
              refreshing={loadingShop}
              onRefresh={loadShop}
              tintColor={adminChrome.accent}
            />
          }
          renderItem={({ item }) => <ShopOrderRow order={item} />}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Icon name="bag" size={32} color={adminChrome.textMuted} />
              <Text style={s.emptyTitle}>Aucune commande</Text>
              <Text style={s.emptySub}>Aucune commande boutique enregistrée.</Text>
            </View>
          }
          contentContainerStyle={shopOrders.length === 0 ? s.emptyContainer : s.list}
          showsVerticalScrollIndicator={false}
        />
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminChrome.band },
  list: { paddingBottom: 80 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  empty: { alignItems: 'center', gap: spacing.md, paddingTop: 64 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: adminChrome.text },
  emptySub: { fontSize: 13, color: adminChrome.textMuted, textAlign: 'center', lineHeight: 20 },
  sep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: adminChrome.shellBorder,
    marginLeft: spacing.md,
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
    backgroundColor: 'rgba(22,101,52,0.08)',
    borderColor: 'rgba(22,101,52,0.25)',
  },
  badgePending: {
    backgroundColor: adminChrome.shellMid,
    borderColor: adminChrome.shellBorder,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  badgePaidText: { color: adminChrome.pitch },
  badgePendingText: { color: adminChrome.textMuted },
});
