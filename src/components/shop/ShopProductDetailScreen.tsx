import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Image,
} from 'react-native';
import { ScreenHeader } from '../ui/ScreenHeader';
import { Icon } from '../ui/Icon';
import {
  formatShopPrice,
  getShopCategoryLabel,
  type ShopProduct,
} from '../../content/prodayShop';
import { getShopProductImage } from '../../content/shopAssets';
import type { ProductLineId } from '../../models/ProductLine';
import { TAB_BAR_CONTENT_INSET } from '../navigation/BottomTabBar';
import { spacing, radius, shadows } from '../../theme/designTokens';

interface ShopProductDetailScreenProps {
  product: ShopProduct;
  productLine: ProductLineId;
  colors: {
    background: string;
    surface: string;
    surfaceMuted: string;
    border: string;
    text: string;
    textMuted: string;
    textSecondary: string;
    ink: string;
    brandInverse: string;
  };
  onBack: () => void;
  onOrder: () => void;
}

export const ShopProductDetailScreen: React.FC<ShopProductDetailScreenProps> = ({
  product,
  productLine,
  colors,
  onBack,
  onOrder,
}) => {
  const image = getShopProductImage(product.id, productLine);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title={product.name} onBack={onBack} centered />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
          {image ? (
            <Image source={image} style={styles.heroImage} resizeMode="cover" accessibilityLabel={product.name} />
          ) : (
            <View style={styles.heroFallback}>
              <Icon name={product.icon} size={56} color={colors.ink} variant="filled" />
            </View>
          )}
          {product.badge ? (
            <View style={[styles.badge, { backgroundColor: colors.ink }]}>
              <Text style={styles.badgeText}>{product.badge}</Text>
            </View>
          ) : null}
        </View>

        <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.soft]}>
          <Text style={[styles.category, { color: colors.textMuted }]}>
            {getShopCategoryLabel(product.category)}
          </Text>
          <Text style={[styles.price, { color: colors.text }]}>{formatShopPrice(product.priceEur)}</Text>
          <Text style={[styles.lead, { color: colors.textSecondary }]}>{product.description}</Text>
          <Text style={[styles.long, { color: colors.text }]}>{product.longDescription}</Text>
        </View>

        <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.soft]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Points clés</Text>
          {product.highlights.map((item) => (
            <View key={item} style={styles.bulletRow}>
              <Icon name="checkmark-circle" size={18} color={colors.ink} />
              <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.soft]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Caractéristiques</Text>
          {product.specs.map((spec) => (
            <View key={spec.label} style={[styles.specRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.specLabel, { color: colors.textMuted }]}>{spec.label}</Text>
              <Text style={[styles.specValue, { color: colors.text }]}>{spec.value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Pressable
          style={[styles.orderBtn, { backgroundColor: colors.ink }]}
          onPress={onOrder}
        >
          <Text style={[styles.orderBtnText, { color: colors.brandInverse }]}>
            Précommander — {formatShopPrice(product.priceEur)}
          </Text>
          <Icon name="chevron-forward" size={18} color={colors.brandInverse} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  hero: {
    height: 280,
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.md,
    position: 'relative',
  },
  heroImage: { width: '100%', height: '100%' },
  heroFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  panel: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  category: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  price: {
    fontSize: 28,
    fontWeight: '900',
    marginTop: spacing.xs,
    letterSpacing: -0.5,
  },
  lead: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  long: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: spacing.sm,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  specLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  specValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: TAB_BAR_CONTENT_INSET + spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  orderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  orderBtnText: {
    fontSize: 15,
    fontWeight: '900',
  },
});
