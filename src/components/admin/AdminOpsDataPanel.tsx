import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { adminService, type SubscriptionPurchase } from '../../services/admin.service';
import type { ShopOrder } from '../../models/ShopOrder';
import { AdminSectionHeader } from './AdminSectionHeader';
import { AdminEntityCard } from './AdminEntityCard';
import { AdminEmptyState } from './AdminEmptyState';
import { AdminFilterChips } from './AdminFilterChips';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import { useAdminStyles } from './adminStyles';
import { spacing } from '../../theme/designTokens';

type OpsSegment = 'subscriptions' | 'shop';

const SEGMENTS: { id: OpsSegment; label: string }[] = [
  { id: 'subscriptions', label: 'Abonnements' },
  { id: 'shop', label: 'Commandes shop' },
];

export const AdminOpsDataPanel: React.FC = () => {
  const { colors: c } = useAdminStyles();
  const [segment, setSegment] = useState<OpsSegment>('subscriptions');
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<SubscriptionPurchase[]>([]);
  const [shopOrders, setShopOrders] = useState<ShopOrder[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, o] = await Promise.all([
        adminService.listSubscriptionPurchases(100),
        adminService.listShopOrders(100),
      ]);
      setSubscriptions(s);
      setShopOrders(o);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(
    () => ({ subscriptions: subscriptions.length, shop: shopOrders.length }),
    [subscriptions.length, shopOrders.length],
  );

  return (
    <>
      <AdminFilterChips options={SEGMENTS} value={segment} onChange={setSegment} />

      {loading ? (
        <ActivityIndicator color={c.brand} style={{ marginVertical: spacing.lg }} />
      ) : null}

      {!loading && segment === 'subscriptions' ? (
        <>
          <AdminSectionHeader title="Achats abonnements" count={counts.subscriptions} />
          {subscriptions.length === 0 ? (
            <AdminEmptyState
              icon="bag"
              title="Aucun achat"
              subtitle="Historique App Store / Play (écriture serveur uniquement)."
            />
          ) : (
            subscriptions.map((purchase) => (
              <AdminEntityCard
                key={purchase.id}
                icon="bag"
                title={purchase.product_id}
                subtitle={`Utilisateur ${purchase.user_uid.slice(0, 10)}…`}
                meta={`${purchase.status}${purchase.amount_eur != null ? ` · ${purchase.amount_eur} €` : ''} · ${formatCalendarDate(purchase.created_at)}`}
              />
            ))
          )}
        </>
      ) : null}

      {!loading && segment === 'shop' ? (
        <>
          <AdminSectionHeader title="Commandes boutique" count={counts.shop} />
          {shopOrders.length === 0 ? (
            <AdminEmptyState icon="bag" title="Aucune commande" subtitle="Commandes ProDay Shop." />
          ) : (
            shopOrders.map((order) => (
              <AdminEntityCard
                key={order.id}
                icon="bag"
                title={`${order.total_eur} € · ${order.status}`}
                subtitle={`${order.product_line} · ${order.lines.length} article(s)`}
                meta={`Acheteur ${order.buyer_uid.slice(0, 10)}… · ${
                  order.created_at ? formatCalendarDate(order.created_at) : '…'
                }`}
              />
            ))
          )}
        </>
      ) : null}
    </>
  );
};
