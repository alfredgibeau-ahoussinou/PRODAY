import React, { useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useAppTheme } from '../../context/ProductLineContext';
import type { AppColors } from '../../theme/universeTheme';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { ProDayGradient } from '../ui/ProDayGradient';
import { Icon } from '../ui/Icon';
import { formatShopPrice } from '../../content/prodayShop';
import { spacing, radius } from '../../theme/designTokens';

/** Hauteur approximative de la zone sticky (hors safe area écran). */
export const SHOP_DETAIL_FOOTER_HEIGHT = 168;

interface ShopProductDetailFooterProps {
  priceEur: number;
  selectedSize?: string | null;
  sizeRequired?: boolean;
  preorderNote: string;
  onAddToCart?: () => void;
  onOrder: () => void;
}

export const ShopProductDetailFooter: React.FC<ShopProductDetailFooterProps> = ({
  priceEur,
  selectedSize,
  sizeRequired = false,
  preorderNote,
  onAddToCart,
  onOrder,
}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const canOrder = !sizeRequired || Boolean(selectedSize);

  return (
    <View
      style={[
        styles.shell,
        {
          backgroundColor: c.surface,
          borderTopColor: c.border,
          paddingBottom: spacing.lg,
        },
      ]}
    >
      <View style={styles.priceRow}>
        <View>
          <ProDayText variant="caption" muted>
            Prix
          </ProDayText>
          <ProDayText variant="hero" accent style={styles.price}>
            {formatShopPrice(priceEur)}
          </ProDayText>
        </View>
        {selectedSize ? (
          <View style={[styles.sizePill, { backgroundColor: c.surfaceMuted }]}>
            <ProDayText variant="caption" style={styles.sizeText}>
              Taille {selectedSize}
            </ProDayText>
          </View>
        ) : sizeRequired ? (
          <ProDayText variant="caption" muted style={styles.sizeHint}>
            Choisissez une taille
          </ProDayText>
        ) : null}
      </View>

      <View style={styles.actions}>
        {onAddToCart ? (
          <PressableSpring
            style={[styles.cartBtn, { borderColor: c.borderStrong, backgroundColor: c.surfaceMuted }]}
            onPress={onAddToCart}
            scaleTo={0.97}
            haptic
          >
            <Icon name="bag" size={20} color={c.ink} />
          </PressableSpring>
        ) : null}
        <PressableSpring
          style={[styles.orderWrap, !canOrder && styles.orderDisabled]}
          onPress={onOrder}
          disabled={!canOrder}
          scaleTo={0.98}
          haptic={canOrder}
        >
          <ProDayGradient kind="cta" style={styles.orderBtn}>
            <ProDayText variant="caption" inverse style={styles.orderText}>
              Précommander
            </ProDayText>
            <Icon name="chevron-forward" size={18} color={c.brandInverse} />
          </ProDayGradient>
        </PressableSpring>
      </View>

      <ProDayText variant="caption" muted style={styles.note} numberOfLines={2}>
        {preorderNote}
      </ProDayText>
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    shell: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      gap: spacing.sm,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
        },
        android: { elevation: 8 },
      }),
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    price: {
      fontWeight: '900',
      fontSize: 28,
      lineHeight: 32,
    },
    sizePill: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
    },
    sizeText: {
      fontWeight: '800',
      color: c.text,
    },
    sizeHint: {
      fontWeight: '600',
      textAlign: 'right',
      flex: 1,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    cartBtn: {
      width: 52,
      height: 52,
      borderRadius: radius.lg,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    orderWrap: {
      flex: 1,
      borderRadius: radius.lg,
      overflow: 'hidden',
    },
    orderDisabled: { opacity: 0.55 },
    orderBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md + 2,
      borderRadius: radius.lg,
    },
    orderText: {
      fontWeight: '900',
      fontSize: 15,
    },
    note: {
      textAlign: 'center',
      lineHeight: 16,
      fontSize: 11,
    },
  });
}
