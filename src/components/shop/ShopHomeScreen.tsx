import React, { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { useAppTheme } from '../../context/ProductLineContext';
import { ProDayText } from '../ui/ProDayText';
import { SearchBar } from '../ui/SearchBar';
import { Icon } from '../ui/Icon';
import { ShopHeader } from './ShopHeader';
import { ShopSpotlight } from './ShopSpotlight';
import { ShopCategoryRail } from './ShopCategoryRail';
import { ShopProductCard } from './ShopProductCard';
import { ShopTrustStrip } from './ShopTrustStrip';
import { ShopCartSheet } from './ShopCartSheet';
import { ShopCarpoolServicePanel } from './ShopCarpoolServicePanel';
import { ShopOrdersPanel } from './ShopOrdersPanel';
import type { ShopOrder } from '../../models/ShopOrder';
import { PressableSpring, StaggerReveal } from '../motion';
import {
  getShopCatalog,
  getShopCategoryLabel,
  getShopCopy,
  getShopSpotlight,
  sortShopProducts,
  type ShopProduct,
  type ShopProductCategory,
  type ShopSortId,
} from '../../content/prodayShop';
import type { ProductLineId } from '../../models/ProductLine';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { spacing, radius } from '../../theme/designTokens';
import type { CartLine } from '../../hooks/useShopCart';
import type { User } from '../../models/User';
import { V3TabShell } from '../v3/V3TabShell';
import { GlassCard } from '../aurora/GlassCard';
import { isV3ShellEnabled } from '../../config/featureFlags';
import { useProDayBrain } from '../../hooks/useProDayBrain';
import { useSectionIntelligence } from '../../hooks/useSectionIntelligence';
import {
  buildShopProductRecommendations,
  shopScoreMap,
  sortShopProductsByFit,
} from '../../core/recommendation/shopRecommendation.engine';
import { trackV3Event } from '../../core/analytics/v3Events';

const SORT_CYCLE: { id: ShopSortId; label: string }[] = [
  { id: 'featured', label: 'Sélection' },
  { id: 'price-asc', label: 'Prix ↑' },
  { id: 'price-desc', label: 'Prix ↓' },
  { id: 'name', label: 'A–Z' },
];

interface ShopHomeScreenProps {
  productLine: ProductLineId;
  onOpenProduct: (product: ShopProduct) => void;
  cartCount?: number;
  cart?: CartLine[];
  wishlist?: Set<string>;
  onToggleWishlist?: (productId: string) => void;
  onAddToCart?: (productId: string) => void;
  onSetQty?: (productId: string, qty: number) => void;
  onPayOnline?: () => void;
  paying?: boolean;
  payCtaLabel?: string;
  shopOrders?: ShopOrder[];
  shopOrdersLoading?: boolean;
  profile?: User | null;
}

export const ShopHomeScreen: React.FC<ShopHomeScreenProps> = ({
  productLine,
  onOpenProduct,
  cartCount = 0,
  cart = [],
  wishlist: wishlistProp,
  onToggleWishlist,
  onAddToCart,
  onSetQty,
  onPayOnline,
  paying = false,
  payCtaLabel = 'Payer par carte',
  profile = null,
}) => {
  const { openCarpool } = useTabNavigation();
  const { colors } = useAppTheme();
  const useV3Header = isV3ShellEnabled();
  const brain = useProDayBrain(profile, productLine);
  const intelligence = useSectionIntelligence('shop', profile, productLine);
  const { width: screenWidth } = useWindowDimensions();
  const copy = useMemo(() => getShopCopy(productLine), [productLine]);
  const catalog = useMemo(() => getShopCatalog(productLine), [productLine]);
  const spotlight = useMemo(() => getShopSpotlight(catalog), [catalog]);

  const [category, setCategory] = useState<ShopProductCategory | 'all'>('all');
  const [sort, setSort] = useState<ShopSortId>('featured');
  const [search, setSearch] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetTab, setSheetTab] = useState<'cart' | 'wishlist'>('cart');
  const [localWishlist, setLocalWishlist] = useState<Set<string>>(new Set());
  const wishlist = wishlistProp ?? localWishlist;

  const cardWidth = Math.floor((screenWidth - spacing.lg * 2 - spacing.md) / 2);
  const sortLabel = SORT_CYCLE.find((s) => s.id === sort)?.label ?? 'Trier';

  const cartProducts = useMemo(
    () =>
      cart
        .map((line) => {
          const product = catalog.find((p) => p.id === line.productId);
          return product ? { product, qty: line.qty } : null;
        })
        .filter((x): x is { product: ShopProduct; qty: number } => x !== null),
    [cart, catalog]
  );

  const cartTotal = useMemo(
    () => cartProducts.reduce((sum, { product, qty }) => sum + product.priceEur * qty, 0),
    [cartProducts]
  );

  const wishProducts = useMemo(
    () => catalog.filter((p) => wishlist.has(p.id)),
    [catalog, wishlist]
  );

  const shopRecs = useMemo(
    () =>
      buildShopProductRecommendations({
        profile,
        products: catalog,
        healthState: brain.ai.health.state,
        productLine,
      }),
    [profile, catalog, brain.ai.health.state, productLine]
  );
  const shopScores = useMemo(() => shopScoreMap(shopRecs), [shopRecs]);
  const topPick = shopRecs[0];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = catalog.filter((p) => {
      if (spotlight && p.id === spotlight.id && category === 'all' && !q) return true;
      if (category !== 'all' && p.category !== category) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        getShopCategoryLabel(p.category, productLine).toLowerCase().includes(q)
      );
    });
    const sorted = sortShopProductsByFit(
      sortShopProducts(base, sort),
      shopRecs,
      useV3Header && sort === 'featured' && !q && category === 'all'
    );
    return sorted;
  }, [catalog, category, search, sort, productLine, spotlight, shopRecs, useV3Header]);

  const gridProducts = useMemo(() => {
    if (!spotlight || category !== 'all' || search.trim()) return filtered;
    return filtered.filter((p) => p.id !== spotlight.id);
  }, [filtered, spotlight, category, search]);

  const toggleWishlist = (id: string) => {
    if (onToggleWishlist) onToggleWishlist(id);
    else {
      setLocalWishlist((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }
  };

  const openSheet = (tab: 'cart' | 'wishlist') => {
    setSheetTab(tab);
    setSheetOpen(true);
  };

  const cycleSort = () => {
    const idx = SORT_CYCLE.findIndex((s) => s.id === sort);
    const next = SORT_CYCLE[(idx + 1) % SORT_CYCLE.length];
    setSort(next.id);
  };

  const cartActions = (
    <View style={styles.headerActions}>
      <PressableSpring onPress={() => openSheet('wishlist')} scaleTo={0.92} haptic>
        <View style={[styles.headerBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Icon name="bookmark" size={18} color={colors.ink} />
          {wishlist.size > 0 ? (
            <ProDayText variant="caption" accent style={styles.headerBadge}>
              {wishlist.size}
            </ProDayText>
          ) : null}
        </View>
      </PressableSpring>
      <PressableSpring onPress={() => openSheet('cart')} scaleTo={0.92} haptic>
        <View style={[styles.headerBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Icon name="bag" size={18} color={colors.ink} />
          {cartCount > 0 ? (
            <ProDayText variant="caption" accent style={styles.headerBadge}>
              {cartCount}
            </ProDayText>
          ) : null}
        </View>
      </PressableSpring>
    </View>
  );

  const scrollContent = (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: TAB_BAR_CONTENT_INSET + spacing.lg }}
    >
      {!useV3Header ? (
        <ShopHeader
          productLine={productLine}
          copy={copy}
          cartCount={cartCount}
          wishCount={wishlist.size}
          onOpenCart={() => openSheet('cart')}
          onOpenWishlist={() => openSheet('wishlist')}
        />
      ) : null}

      {useV3Header &&
      (brain.ai.health.state === 'FATIGUED' ||
        brain.ai.health.state === 'OVERLOADED' ||
        brain.ai.health.state === 'INJURY_RISK') ? (
        <GlassCard variant="accent" style={styles.healthBand}>
          <ProDayText variant="caption" accent style={styles.healthTitle}>
            Recommandé récupération
          </ProDayText>
          <ProDayText variant="body" muted>
            {brain.ai.health.dailyPlanHint}
          </ProDayText>
        </GlassCard>
      ) : null}

      {useV3Header && topPick && category === 'all' && !search.trim() ? (
        <GlassCard variant="default" style={styles.pickBand}>
          <ProDayText variant="caption" muted>
            Pour vous · {topPick.iaScore}% compat.
          </ProDayText>
          <ProDayText variant="section" numberOfLines={1}>
            {catalog.find((p) => p.id === topPick.productId)?.name ?? 'Sélection'}
          </ProDayText>
          <ProDayText variant="caption" accent>
            {topPick.reason}
          </ProDayText>
        </GlassCard>
      ) : null}

        {spotlight && category === 'all' && !search.trim() ? (
          <View style={styles.spotlight}>
            <ShopSpotlight
              product={spotlight}
              productLine={productLine}
              onPress={() => onOpenProduct(spotlight)}
              onAddToCart={onAddToCart ? () => onAddToCart(spotlight.id) : undefined}
            />
          </View>
        ) : null}

        <ShopCategoryRail
          productLine={productLine}
          catalog={catalog}
          active={category}
          onSelect={setCategory}
        />

        <View style={styles.toolbar}>
          <View style={styles.searchWrap}>
            <SearchBar
              placeholder="Rechercher…"
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <PressableSpring
            style={[styles.sortBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={cycleSort}
            scaleTo={0.96}
            haptic
          >
            <Icon name="star" size={14} color={colors.accent} variant="filled" />
            <ProDayText variant="caption" style={styles.sortLabel}>
              {sortLabel}
            </ProDayText>
          </PressableSpring>
        </View>

        <ProDayText variant="caption" muted style={styles.resultCount}>
          {filtered.length} article{filtered.length > 1 ? 's' : ''}
        </ProDayText>

        {gridProducts.length === 0 ? (
          <View style={[styles.empty, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Icon name="bag" size={28} color={colors.textMuted} />
            <ProDayText variant="body" muted style={styles.emptyText}>
              {search.trim()
                ? 'Aucun produit ne correspond à votre recherche.'
                : 'Aucun produit dans cette catégorie.'}
            </ProDayText>
            {search.trim() ? (
              <PressableSpring onPress={() => setSearch('')} scaleTo={0.96} haptic>
                <ProDayText variant="caption" accent style={styles.clearSearch}>
                  Effacer la recherche
                </ProDayText>
              </PressableSpring>
            ) : category !== 'all' ? (
              <PressableSpring onPress={() => setCategory('all')} scaleTo={0.96} haptic>
                <ProDayText variant="caption" accent style={styles.clearSearch}>
                  Toutes les catégories
                </ProDayText>
              </PressableSpring>
            ) : null}
          </View>
        ) : (
          <View style={styles.grid}>
            {gridProducts.map((product, index) => (
              <View key={product.id} style={{ width: cardWidth }}>
                <StaggerReveal index={index}>
                  <ShopProductCard
                    product={product}
                    productLine={productLine}
                    wished={wishlist.has(product.id)}
                    iaReason={
                      useV3Header ? shopScores.get(product.id)?.reason : undefined
                    }
                    onToggleWish={() => toggleWishlist(product.id)}
                    onPress={() => {
                      if (useV3Header) {
                        trackV3Event('shop_product_tap', {
                          productId: product.id,
                          iaScore: shopScores.get(product.id)?.iaScore ?? 0,
                        });
                      }
                      onOpenProduct(product);
                    }}
                    onQuickAdd={onAddToCart ? () => onAddToCart(product.id) : undefined}
                  />
                </StaggerReveal>
              </View>
            ))}
          </View>
        )}

        <View style={styles.trust}>
          <ShopTrustStrip />
        </View>

        <View style={styles.services}>
          <ShopCarpoolServicePanel
            onOpenCarpool={() => openCarpool({ chapter: 'evenements' })}
            onReserveAsPassenger={() => openCarpool({ chapter: 'reserver' })}
          />
        </View>
      </ScrollView>
  );

  return (
    <View style={styles.root}>
      {useV3Header ? (
        <V3TabShell
          title={copy.title}
          subtitle={copy.subtitle}
          right={cartActions}
          flat
          intelligence={intelligence}
          stats={[
            { value: catalog.length, label: 'Articles' },
            {
              value: topPick ? topPick.iaScore : '—',
              label: 'Pour vous',
              highlight: Boolean(topPick && topPick.iaScore >= 60),
            },
            { value: cartCount, label: 'Panier', highlight: cartCount > 0 },
          ]}
        >
          {scrollContent}
        </V3TabShell>
      ) : (
        scrollContent
      )}

      <ShopCartSheet
        visible={sheetOpen}
        initialTab={sheetTab}
        productLine={productLine}
        copy={copy}
        cart={cart}
        cartProducts={cartProducts}
        cartTotal={cartTotal}
        wishProducts={wishProducts}
        wishlist={wishlist}
        paying={paying}
        onClose={() => setSheetOpen(false)}
        onOpenProduct={(product) => {
          setSheetOpen(false);
          onOpenProduct(product);
        }}
        onSetQty={onSetQty}
        onToggleWishlist={toggleWishlist}
        onPayOnline={onPayOnline}
        payCtaLabel={payCtaLabel}
        onBrowseCatalog={() => setSheetOpen(false)}
        onAddToCart={onAddToCart}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerActions: { flexDirection: 'row', gap: spacing.xs },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    fontWeight: '800',
    fontSize: 9,
  },
  healthBand: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    padding: spacing.md,
    gap: 4,
  },
  healthTitle: { fontWeight: '800', letterSpacing: 0.5 },
  pickBand: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    gap: 4,
  },
  spotlight: { marginTop: spacing.md, marginBottom: spacing.xs },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  searchWrap: { flex: 1 },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  sortLabel: { fontWeight: '800' },
  resultCount: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  empty: {
    marginHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  emptyText: { textAlign: 'center' },
  clearSearch: { marginTop: spacing.sm, fontWeight: '700' },
  trust: { marginTop: spacing.xl, marginBottom: spacing.lg },
  orders: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  services: { paddingHorizontal: spacing.lg },
});
