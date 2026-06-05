import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  Linking,
  Image,
} from 'react-native';
import { useTabNavigation } from '../context/TabNavigationContext';
import { useAppTheme } from '../context/ProductLineContext';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Icon } from '../components/ui/Icon';
import { ShopProductDetailScreen } from '../components/shop/ShopProductDetailScreen';
import { TAB_BAR_CONTENT_INSET } from '../components/navigation/BottomTabBar';
import {
  formatShopPrice,
  getShopCatalog,
  getShopCategoryLabel,
  getShopCopy,
  type ShopProduct,
  type ShopProductCategory,
} from '../content/prodayShop';
import { getShopProductImage } from '../content/shopAssets';
import type { ProductLineId } from '../models/ProductLine';
import { spacing, radius, shadows } from '../theme/designTokens';

const CATEGORY_ORDER: ShopProductCategory[] = ['equipment', 'apparel', 'jersey'];

export const ShopScreen: React.FC = () => {
  const { setActiveTab } = useTabNavigation();
  const { colors, productLine } = useAppTheme();
  const copy = useMemo(() => getShopCopy(productLine), [productLine]);
  const catalog = useMemo(() => getShopCatalog(productLine), [productLine]);
  const [category, setCategory] = useState<ShopProductCategory | 'all'>('all');
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);

  const filtered =
    category === 'all' ? catalog : catalog.filter((p) => p.category === category);

  const onBack = () => setActiveTab('home');

  const onOrder = (product: ShopProduct) => {
    const subject = encodeURIComponent(`Précommande ProDay — ${product.name}`);
    const body = encodeURIComponent(
      `Bonjour,\n\nJe souhaite précommander :\n- ${product.name}\n- Prix indicatif : ${formatShopPrice(product.priceEur)}\n- Univers : ${productLine}\n\nMerci !`
    );
    Alert.alert(
      product.name,
      `${formatShopPrice(product.priceEur)}\n\n${copy.preorderNote}`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Précommander par email',
          onPress: () => {
            void Linking.openURL(
              `mailto:${copy.contactEmail}?subject=${subject}&body=${body}`
            );
          },
        },
      ]
    );
  };

  if (selectedProduct) {
    return (
      <ShopProductDetailScreen
        product={selectedProduct}
        productLine={productLine}
        colors={colors}
        onBack={() => setSelectedProduct(null)}
        onOrder={() => onOrder(selectedProduct)}
      />
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title={copy.title} subtitle={copy.subtitle} onBack={onBack} centered />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.noteCard, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
          <Icon name="bag" size={20} color={colors.ink} variant="filled" />
          <Text style={[styles.noteText, { color: colors.textSecondary }]}>{copy.preorderNote}</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          <FilterChip
            label="Tout"
            active={category === 'all'}
            onPress={() => setCategory('all')}
            colors={colors}
          />
          {CATEGORY_ORDER.map((cat) => (
            <FilterChip
              key={cat}
              label={getShopCategoryLabel(cat)}
              active={category === cat}
              onPress={() => setCategory(cat)}
              colors={colors}
            />
          ))}
        </ScrollView>

        <View style={styles.grid}>
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              productLine={productLine}
              colors={colors}
              onPress={() => setSelectedProduct(product)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const FilterChip: React.FC<{
  label: string;
  active: boolean;
  onPress: () => void;
  colors: { ink: string; surface: string; border: string };
}> = ({ label, active, onPress, colors }) => (
  <Pressable
    style={[
      styles.chip,
      {
        backgroundColor: active ? colors.ink : colors.surface,
        borderColor: active ? colors.ink : colors.border,
      },
    ]}
    onPress={onPress}
  >
    <Text style={[styles.chipText, { color: active ? '#fff' : colors.ink }]}>{label}</Text>
  </Pressable>
);

const ProductCard: React.FC<{
  product: ShopProduct;
  productLine: ProductLineId;
  colors: {
    surface: string;
    border: string;
    text: string;
    textMuted: string;
    textSecondary: string;
    surfaceMuted: string;
    ink: string;
  };
  onPress: () => void;
}> = ({ product, productLine, colors, onPress }) => {
  const image = getShopProductImage(product.id, productLine);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        shadows.soft,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Voir le détail de ${product.name}`}
    >
      <View style={[styles.imageWrap, { backgroundColor: colors.surfaceMuted }]}>
        {image ? (
          <Image source={image} style={styles.image} resizeMode="cover" accessibilityLabel={product.name} />
        ) : (
          <View style={styles.imageFallback}>
            <Icon name={product.icon} size={40} color={colors.ink} variant="filled" />
          </View>
        )}
        {product.badge ? (
          <View style={[styles.badge, { backgroundColor: colors.ink }]}>
            <Text style={styles.badgeText}>{product.badge}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.cardBody}>
        <Text style={[styles.cardCategory, { color: colors.textMuted }]}>
          {getShopCategoryLabel(product.category)}
        </Text>
        <Text style={[styles.cardName, { color: colors.text }]}>{product.name}</Text>
        <Text style={[styles.cardDesc, { color: colors.textSecondary }]} numberOfLines={2}>
          {product.description}
        </Text>
        <View style={styles.cardFooter}>
          <Text style={[styles.price, { color: colors.text }]}>{formatShopPrice(product.priceEur)}</Text>
          <View style={styles.detailHint}>
            <Text style={[styles.detailText, { color: colors.ink }]}>Voir le détail</Text>
            <Icon name="chevron-forward" size={14} color={colors.ink} />
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  noteText: { flex: 1, fontSize: 13, lineHeight: 19 },
  filters: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: '800' },
  grid: {
    gap: spacing.lg,
  },
  card: {
    width: '100%',
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardPressed: { opacity: 0.94 },
  imageWrap: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  cardBody: {
    padding: spacing.md,
  },
  cardCategory: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
    lineHeight: 22,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  price: { fontSize: 20, fontWeight: '900' },
  detailHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: { fontSize: 13, fontWeight: '800' },
});
