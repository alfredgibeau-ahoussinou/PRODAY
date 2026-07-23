import React, { useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Platform, Alert } from 'react-native';
import { ProDayScreenCanvas } from '../ui/ProDayScreenCanvas';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { ShopProductDetailGallery } from './ShopProductDetailGallery';
import { ShopProductDetailFooter } from './ShopProductDetailFooter';
import { ShopRelatedStrip } from './ShopRelatedStrip';
import {
  getRelatedProducts,
  getShopCatalog,
  getShopCategoryLabel,
  getShopCopy,
  SHOP_DELIVERY_STEPS,
  SHOP_FAQ,
  type ShopProduct,
} from '../../content/prodayShop';
import type { ProductLineId } from '../../models/ProductLine';
import { useAppTheme } from '../../context/ProductLineContext';
import type { AppColors } from '../../theme/universeTheme';
import { spacing, radius } from '../../theme/designTokens';
import { SHOP_DETAIL_FOOTER_HEIGHT } from './ShopProductDetailFooter';
import { prodayHaptics } from '../../utils/prodayHaptics';

interface ShopProductDetailScreenProps {
  product: ShopProduct;
  productLine: ProductLineId;
  wished?: boolean;
  onBack: () => void;
  onOrder: (size?: string) => void;
  onAddToCart?: () => void;
  onToggleWishlist?: () => void;
  onOpenRelated?: (product: ShopProduct) => void;
}

export const ShopProductDetailScreen: React.FC<ShopProductDetailScreenProps> = ({
  product,
  productLine,
  wished = false,
  onBack,
  onOrder,
  onAddToCart,
  onToggleWishlist,
  onOpenRelated,
}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const copy = useMemo(() => getShopCopy(productLine), [productLine]);
  const catalog = useMemo(() => getShopCatalog(productLine), [productLine]);
  const related = useMemo(
    () => getRelatedProducts(catalog, product.id, 6),
    [catalog, product.id]
  );
  const hasSizes = Boolean(product.sizes && product.sizes.length > 0);
  const [selectedSize, setSelectedSize] = useState<string | null>(
    product.sizes?.[0] ?? null
  );

  const handleAddToCart = () => {
    prodayHaptics.cartAdd();
    onAddToCart?.();
  };

  const handleOrder = () => {
    if (hasSizes && !selectedSize) {
      Alert.alert('Taille requise', 'Choisissez une taille avant de précommander.');
      return;
    }
    onOrder(selectedSize ?? undefined);
  };

  return (
    <ProDayScreenCanvas flat>
      <View style={styles.root}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: SHOP_DETAIL_FOOTER_HEIGHT + spacing.md,
          }}
        >
          <ShopProductDetailGallery
            product={product}
            productLine={productLine}
            wished={wished}
            onBack={onBack}
            onToggleWish={onToggleWishlist}
          />

          <View style={[styles.sheet, { backgroundColor: c.surface }]}>
            <View style={[styles.categoryPill, { backgroundColor: c.accentSoft }]}>
              <Icon name={product.icon} size={14} color={c.ink} variant="filled" />
              <ProDayText variant="caption" style={styles.categoryText}>
                {getShopCategoryLabel(product.category, productLine)}
              </ProDayText>
            </View>

            <ProDayText variant="hero" style={styles.title}>
              {product.name}
            </ProDayText>

            <ProDayText variant="body" muted style={styles.lead}>
              {product.description}
            </ProDayText>

            {hasSizes ? (
              <View style={styles.block}>
                <ProDayText variant="section" style={styles.blockTitle}>
                  Taille
                </ProDayText>
                <View style={styles.sizeGrid}>
                  {product.sizes!.map((size) => {
                    const active = selectedSize === size;
                    return (
                      <PressableSpring
                        key={size}
                        style={[
                          styles.sizeCell,
                          {
                            borderColor: active ? c.ink : c.border,
                            backgroundColor: active ? c.ink : c.surface,
                          },
                        ]}
                        onPress={() => setSelectedSize(size)}
                        scaleTo={0.96}
                        haptic
                      >
                        <ProDayText
                          variant="caption"
                          inverse={active}
                          style={[styles.sizeLabel, !active && { color: c.text }]}
                        >
                          {size}
                        </ProDayText>
                      </PressableSpring>
                    );
                  })}
                </View>
              </View>
            ) : null}

            <View style={styles.block}>
              <ProDayText variant="section" style={styles.blockTitle}>
                Description
              </ProDayText>
              <ProDayText variant="body" style={styles.bodyText}>
                {product.longDescription}
              </ProDayText>
            </View>

            <View style={styles.block}>
              <ProDayText variant="section" style={styles.blockTitle}>
                Points clés
              </ProDayText>
              <View style={styles.highlightGrid}>
                {product.highlights.map((item) => (
                  <View
                    key={item}
                    style={[styles.highlightCard, { backgroundColor: c.surfaceMuted, borderColor: c.border }]}
                  >
                    <Icon name="checkmark-circle" size={16} color={c.accent} variant="filled" />
                    <ProDayText variant="caption" style={styles.highlightText}>
                      {item}
                    </ProDayText>
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.block, styles.specsCard, { borderColor: c.border }]}>
              <ProDayText variant="section" style={styles.blockTitle}>
                Fiche technique
              </ProDayText>
              {product.specs.map((spec, index) => (
                <View
                  key={spec.label}
                  style={[
                    styles.specRow,
                    index < product.specs.length - 1 && {
                      borderBottomColor: c.border,
                      borderBottomWidth: StyleSheet.hairlineWidth,
                    },
                  ]}
                >
                  <ProDayText variant="caption" muted>
                    {spec.label}
                  </ProDayText>
                  <ProDayText variant="caption" style={styles.specValue}>
                    {spec.value}
                  </ProDayText>
                </View>
              ))}
            </View>

            <View style={styles.block}>
              <ProDayText variant="section" style={styles.blockTitle}>
                Livraison
              </ProDayText>
              <View style={[styles.timeline, { borderColor: c.border }]}>
                {SHOP_DELIVERY_STEPS.map((step, index) => (
                  <View
                    key={step.title}
                    style={[
                      styles.timelineRow,
                      index < SHOP_DELIVERY_STEPS.length - 1 && {
                        borderBottomColor: c.border,
                        borderBottomWidth: StyleSheet.hairlineWidth,
                      },
                    ]}
                  >
                    <View style={[styles.stepNum, { backgroundColor: c.accent }]}>
                      <ProDayText variant="caption" inverse style={styles.stepNumText}>
                        {index + 1}
                      </ProDayText>
                    </View>
                    <View style={styles.timelineCopy}>
                      <ProDayText variant="caption" style={styles.timelineTitle}>
                        {step.title}
                      </ProDayText>
                      <ProDayText variant="caption" muted>
                        {step.body}
                      </ProDayText>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.block}>
              <ProDayText variant="section" style={styles.blockTitle}>
                Questions fréquentes
              </ProDayText>
              {SHOP_FAQ.map((item) => (
                <View
                  key={item.q}
                  style={[styles.faqRow, { borderColor: c.border }]}
                >
                  <ProDayText variant="caption" style={styles.faqQ}>
                    {item.q}
                  </ProDayText>
                  <ProDayText variant="caption" muted style={styles.faqA}>
                    {item.a}
                  </ProDayText>
                </View>
              ))}
            </View>

            {related.length > 0 && onOpenRelated ? (
              <View style={styles.block}>
                <ProDayText variant="section" style={styles.blockTitle}>
                  À associer
                </ProDayText>
                <ShopRelatedStrip
                  products={related}
                  productLine={productLine}
                  onPress={onOpenRelated}
                />
              </View>
            ) : null}
          </View>
        </ScrollView>

        <ShopProductDetailFooter
          priceEur={product.priceEur}
          selectedSize={selectedSize}
          sizeRequired={hasSizes}
          preorderNote={copy.preorderNote}
          onAddToCart={onAddToCart ? handleAddToCart : undefined}
          onOrder={handleOrder}
        />
      </View>
    </ProDayScreenCanvas>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    footerDock: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
    },
    sheet: {
      marginTop: -spacing.xl,
      borderTopLeftRadius: radius.xl + 8,
      borderTopRightRadius: radius.xl + 8,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
      paddingBottom: spacing.lg,
      gap: spacing.md,
    },
    categoryPill: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: radius.pill,
    },
    categoryText: {
      fontWeight: '800',
      color: c.ink,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    title: {
      fontSize: 28,
      lineHeight: 32,
      fontWeight: '900',
      letterSpacing: -0.6,
      color: c.text,
    },
    lead: {
      lineHeight: 22,
      fontSize: 15,
    },
    block: {
      gap: spacing.sm,
    },
    blockTitle: {
      fontWeight: '800',
      color: c.text,
    },
    bodyText: {
      lineHeight: 22,
      color: c.textSecondary,
    },
    sizeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    sizeCell: {
      minWidth: 52,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderRadius: radius.lg,
      borderWidth: 1.5,
      alignItems: 'center',
    },
    sizeLabel: {
      fontWeight: '800',
    },
    highlightGrid: {
      gap: spacing.sm,
    },
    highlightCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
    },
    highlightText: {
      flex: 1,
      lineHeight: 18,
      fontWeight: '600',
      color: c.text,
    },
    specsCard: {
      borderWidth: 1,
      borderRadius: radius.xl,
      padding: spacing.md,
    },
    specRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: spacing.md,
      paddingVertical: spacing.sm,
    },
    specValue: {
      flex: 1,
      textAlign: 'right',
      fontWeight: '700',
      color: c.text,
    },
    timeline: {
      borderWidth: 1,
      borderRadius: radius.xl,
      overflow: 'hidden',
    },
    timelineRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      padding: spacing.md,
    },
    stepNum: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepNumText: {
      fontWeight: '900',
      fontSize: 11,
    },
    timelineCopy: {
      flex: 1,
      gap: 2,
    },
    timelineTitle: {
      fontWeight: '800',
      color: c.text,
    },
    faqRow: {
      borderWidth: 1,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: 4,
      marginBottom: spacing.sm,
    },
    faqQ: {
      fontWeight: '800',
      color: c.text,
    },
    faqA: {
      lineHeight: 18,
    },
  });
}
