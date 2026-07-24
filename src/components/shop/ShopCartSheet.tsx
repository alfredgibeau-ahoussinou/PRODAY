import React, { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { AnimatedModalShell } from '../motion/AnimatedModalShell';
import { PressableSpring } from '../motion';
import { formatShopPrice, type ShopCopy, type ShopProduct } from '../../content/prodayShop';
import { getShopProductImage } from '../../content/shopAssets';
import type { ProductLineId } from '../../models/ProductLine';
import type { CartLine } from '../../hooks/useShopCart';
import { spacing, radius } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';
import type { AppColors } from '../../theme/universeTheme';
import { ProDayText } from '../ui/ProDayText';
import { ProDayGradient } from '../ui/ProDayGradient';
import { Icon } from '../ui/Icon';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { ShopProductCard } from './ShopProductCard';

type SheetTab = 'cart' | 'wishlist';

interface ShopCartSheetProps {
  visible: boolean;
  initialTab?: SheetTab;
  productLine: ProductLineId;
  copy: ShopCopy;
  cart: CartLine[];
  cartProducts: { product: ShopProduct; qty: number }[];
  cartTotal: number;
  wishProducts: ShopProduct[];
  wishlist: Set<string>;
  paying?: boolean;
  onClose: () => void;
  onOpenProduct: (product: ShopProduct) => void;
  onSetQty?: (productId: string, qty: number) => void;
  onToggleWishlist: (productId: string) => void;
  onPayOnline?: () => void;
  payCtaLabel?: string;
  onBrowseCatalog?: () => void;
  onAddToCart?: (productId: string) => void;
}

export const ShopCartSheet: React.FC<ShopCartSheetProps> = ({
  visible,
  initialTab = 'cart',
  productLine,
  copy,
  cartProducts,
  cartTotal,
  wishProducts,
  wishlist,
  paying = false,
  onClose,
  onOpenProduct,
  onSetQty,
  onToggleWishlist,
  onPayOnline,
  payCtaLabel = 'Payer par carte',
  onBrowseCatalog,
  onAddToCart,
}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const [tab, setTab] = useState<SheetTab>(initialTab);

  React.useEffect(() => {
    if (visible) setTab(initialTab);
  }, [visible, initialTab]);

  const emailCart = () => {
    const lines = cartProducts.map(
      ({ product, qty }) =>
        `- ${product.name} × ${qty} (${formatShopPrice(product.priceEur * qty)})`
    );
    const subject = encodeURIComponent('Précommande ProDay. Mon panier');
    const body = encodeURIComponent(
      `Bonjour,\n\nJe souhaite précommander :\n${lines.join('\n')}\n\nTotal : ${formatShopPrice(cartTotal)}\nUnivers : ${productLine}\n\nMerci !`
    );
    void Linking.openURL(`mailto:${copy.contactEmail}?subject=${subject}&body=${body}`);
  };

  return (
    <AnimatedModalShell visible={visible} onClose={onClose} closeLabel="Fermer le panier">
      <View style={styles.root}>
        <View style={styles.tabs}>
          {(['cart', 'wishlist'] as const).map((id) => {
            const active = tab === id;
            const label = id === 'cart' ? 'Panier' : 'Favoris';
            const count = id === 'cart' ? cartProducts.length : wishProducts.length;
            return (
              <PressableSpring
                key={id}
                style={[styles.tab, active && { backgroundColor: c.accent }]}
                onPress={() => setTab(id)}
                scaleTo={0.98}
              >
                <ProDayText variant="caption" inverse={active} style={!active ? { color: c.text } : undefined}>
                  {label}
                  {count > 0 ? ` · ${count}` : ''}
                </ProDayText>
              </PressableSpring>
            );
          })}
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {tab === 'cart' ? (
            cartProducts.length === 0 ? (
              <View style={styles.empty}>
                <Icon name="bag" size={36} color={c.textMuted} />
                <ProDayText variant="body" muted style={styles.emptyText}>
                  Votre panier est vide.
                </ProDayText>
                {onBrowseCatalog ? (
                  <PressableSpring onPress={onBrowseCatalog} scaleTo={0.96} haptic>
                    <ProDayGradient kind="cta" style={styles.emptyCta}>
                      <ProDayText variant="caption" inverse style={styles.emptyCtaText}>
                        Parcourir la boutique
                      </ProDayText>
                    </ProDayGradient>
                  </PressableSpring>
                ) : null}
              </View>
            ) : (
              cartProducts.map(({ product, qty }) => {
                const image = getShopProductImage(product.id, productLine);
                return (
                  <View key={product.id} style={[styles.line, { borderColor: c.border }]}>
                    <PressableSpring onPress={() => onOpenProduct(product)} scaleTo={0.99}>
                      <View style={styles.lineMain}>
                        <View style={[styles.thumb, { backgroundColor: c.surfaceMuted }]}>
                          {image ? (
                            <Image source={image} style={styles.thumbImg} resizeMode="cover" />
                          ) : (
                            <Icon name={product.icon} size={20} color={c.ink} />
                          )}
                        </View>
                        <View style={styles.lineCopy}>
                          <ProDayText variant="section" numberOfLines={2}>
                            {product.name}
                          </ProDayText>
                          <ProDayText variant="caption" muted>
                            {formatShopPrice(product.priceEur)} / unité
                          </ProDayText>
                        </View>
                      </View>
                    </PressableSpring>
                    <View style={styles.qtyRow}>
                      <PressableSpring
                        style={[styles.qtyBtn, { borderColor: c.border }]}
                        onPress={() => onSetQty?.(product.id, qty - 1)}
                        scaleTo={0.92}
                      >
                        <ProDayText variant="section" accent>
                          −
                        </ProDayText>
                      </PressableSpring>
                      <ProDayText variant="section">{qty}</ProDayText>
                      <PressableSpring
                        style={[styles.qtyBtn, { borderColor: c.border }]}
                        onPress={() => {
                          prodayHaptics.cartAdd();
                          onSetQty?.(product.id, qty + 1);
                        }}
                        scaleTo={0.92}
                        haptic
                      >
                        <Icon name="add" size={16} color={c.accent} />
                      </PressableSpring>
                      <ProDayText variant="caption" accent style={styles.lineTotal}>
                        {formatShopPrice(product.priceEur * qty)}
                      </ProDayText>
                    </View>
                  </View>
                );
              })
            )
          ) : wishProducts.length === 0 ? (
            <View style={styles.empty}>
              <Icon name="bookmark" size={36} color={c.textMuted} />
              <ProDayText variant="body" muted style={styles.emptyText}>
                Aucun favori. Touchez le signet sur un produit.
              </ProDayText>
              {onBrowseCatalog ? (
                <PressableSpring onPress={onBrowseCatalog} scaleTo={0.96} haptic>
                  <ProDayGradient kind="cta" style={styles.emptyCta}>
                    <ProDayText variant="caption" inverse style={styles.emptyCtaText}>
                      Parcourir la boutique
                    </ProDayText>
                  </ProDayGradient>
                </PressableSpring>
              ) : null}
            </View>
          ) : (
            wishProducts.map((product) => (
              <View key={product.id} style={styles.wishCard}>
                <ShopProductCard
                  product={product}
                  productLine={productLine}
                  wished={wishlist.has(product.id)}
                  onToggleWish={() => onToggleWishlist(product.id)}
                  onPress={() => onOpenProduct(product)}
                  onQuickAdd={() => onAddToCart?.(product.id)}
                />
              </View>
            ))
          )}

          <ProDayText variant="caption" muted style={styles.note}>
            {copy.preorderNote}
          </ProDayText>
        </ScrollView>

        {tab === 'cart' && cartProducts.length > 0 ? (
          <View style={[styles.footer, { borderTopColor: c.border, backgroundColor: c.background }]}>
            <View style={styles.totalRow}>
              <ProDayText variant="section">Total</ProDayText>
              <ProDayText variant="hero" accent>
                {formatShopPrice(cartTotal)}
              </ProDayText>
            </View>
            <PressableSpring
              style={[styles.payBtn, { backgroundColor: c.accent }, paying && styles.payDisabled]}
              onPress={() => onPayOnline?.()}
              disabled={paying}
              scaleTo={0.97}
              haptic={!paying}
            >
              {paying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name="bag" size={18} color="#fff" />
                  <ProDayText variant="caption" inverse style={styles.payText}>
                    {payCtaLabel}
                  </ProDayText>
                </>
              )}
            </PressableSpring>
            <PressableSpring
              style={[styles.emailBtn, { borderColor: c.border }]}
              onPress={emailCart}
              scaleTo={0.98}
              haptic
            >
              <Icon name="mail" size={16} color={c.accent} />
              <ProDayText variant="caption" accent style={styles.payText}>
                Précommander par email
              </ProDayText>
            </PressableSpring>
          </View>
        ) : null}
      </View>
    </AnimatedModalShell>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1, minHeight: 320 },
    tabs: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: c.surfaceMuted,
    },
    scroll: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
      gap: spacing.sm,
    },
    empty: {
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xl,
    },
    emptyText: { textAlign: 'center' },
    emptyCta: {
      marginTop: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: radius.pill,
    },
    emptyCtaText: { fontWeight: '800' },
    line: {
      borderWidth: 1,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.sm,
    },
    lineMain: { flexDirection: 'row', gap: spacing.md },
    thumb: {
      width: 64,
      height: 64,
      borderRadius: radius.md,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    thumbImg: { width: '100%', height: '100%' },
    lineCopy: { flex: 1, gap: 2 },
    qtyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    qtyBtn: {
      width: 32,
      height: 32,
      borderRadius: radius.md,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    lineTotal: { marginLeft: 'auto', fontWeight: '800' },
    wishCard: { marginBottom: spacing.sm },
    note: { textAlign: 'center', lineHeight: 18, marginTop: spacing.md },
    footer: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      gap: spacing.sm,
    },
    totalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    payBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
    },
    payDisabled: { opacity: 0.7 },
    payText: { fontWeight: '800' },
    emailBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
    },
  });
}
