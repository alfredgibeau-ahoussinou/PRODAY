import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { formatShopPrice } from '../../content/prodayShop';
import type { ShopOrder } from '../../models/ShopOrder';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';

const STATUS_LABEL: Record<ShopOrder['status'], string> = {
  pending: 'En attente',
  paid: 'Payée',
  cancelled: 'Annulée',
};

interface ShopOrdersPanelProps {
  orders: ShopOrder[];
  loading?: boolean;
}

export const ShopOrdersPanel: React.FC<ShopOrdersPanelProps> = ({ orders, loading }) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(), []);

  if (loading) {
    return (
      <View style={styles.wrap}>
        <ProDayText variant="section">Mes commandes</ProDayText>
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      </View>
    );
  }

  if (orders.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <ProDayText variant="section">Mes commandes</ProDayText>
      <ProDayText variant="caption" muted>
        Historique de vos achats ProDay Store.
      </ProDayText>
      {orders.map((order) => {
        const summary = order.lines.map((l) => `${l.name} ×${l.qty}`).join(' · ');
        const dateLabel = order.created_at
          ? order.created_at.toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
          : 'Date inconnue';
        const paid = order.status === 'paid';

        return (
          <ProDaySurface
            key={order.id}
            variant="module"
            style={[styles.card, { borderColor: colors.border }]}
          >
            <View style={styles.cardHead}>
              <View style={[styles.badge, { backgroundColor: paid ? colors.accentSoft : colors.surfaceMuted }]}>
                <Icon
                  name={paid ? 'checkmark-circle' : 'time'}
                  size={16}
                  color={paid ? colors.accent : colors.textMuted}
                  variant={paid ? 'filled' : undefined}
                />
              </View>
              <View style={styles.cardCopy}>
                <ProDayText variant="section" numberOfLines={1}>
                  {formatShopPrice(order.total_eur)}
                </ProDayText>
                <ProDayText variant="caption" muted>
                  {dateLabel} · {STATUS_LABEL[order.status]}
                </ProDayText>
              </View>
            </View>
            <ProDayText variant="body" muted numberOfLines={2}>
              {summary}
            </ProDayText>
          </ProDaySurface>
        );
      })}
    </View>
  );
};

function createStyles() {
  return StyleSheet.create({
    wrap: { gap: spacing.sm },
    loader: { marginVertical: spacing.md },
    card: {
      borderWidth: 1,
      gap: spacing.xs,
    },
    cardHead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    badge: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardCopy: { flex: 1, gap: 2 },
  });
}
