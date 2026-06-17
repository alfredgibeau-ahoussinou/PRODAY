import React, { useMemo } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { formatShopPrice, type ShopProduct } from '../../content/prodayShop';
import { getShopProductImage } from '../../content/shopAssets';
import type { ProductLineId } from '../../models/ProductLine';
import { spacing, radius, shadows } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';
import type { AppColors } from '../../theme/universeTheme';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { prodayHaptics } from '../../utils/prodayHaptics';

interface ShopSpotlightProps {
  product: ShopProduct;
  productLine: ProductLineId;
  onPress: () => void;
  onAddToCart?: () => void;
  /** Recommandation IA affichée sur la sélection. */
  recommendation?: { iaScore: number; reason: string };
}

export const ShopSpotlight: React.FC<ShopSpotlightProps> = ({
  product,
  productLine,
  onPress,
  onAddToCart,
  recommendation,
}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const image = getShopProductImage(product.id, productLine);

  return (
    <PressableSpring
      style={[styles.card, shadows.card]}
      onPress={() => {
        prodayHaptics.press();
        onPress();
      }}
      scaleTo={0.98}
    >
      <View style={styles.imageWrap}>
        {image ? (
          <Image source={image} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.fallback}>
            <Icon name={product.icon} size={48} color={c.ink} variant="filled" />
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.75)']}
          style={styles.gradient}
        />
        {product.badge ? (
          <View style={styles.badge}>
            <ProDayText variant="caption" inverse style={styles.badgeText}>
              {product.badge}
            </ProDayText>
          </View>
        ) : null}
        {recommendation ? (
          <View style={[styles.recoPill, { backgroundColor: c.accent }]}>
            <ProDayText variant="caption" inverse style={styles.recoPillText}>
              Pour vous · {recommendation.iaScore}%
            </ProDayText>
          </View>
        ) : null}
        <View style={styles.overlayCopy}>
          <ProDayText variant="eyebrow" style={styles.kicker}>
            {recommendation ? recommendation.reason : 'Sélection du moment'}
          </ProDayText>
          <ProDayText variant="hero" style={styles.name} numberOfLines={2}>
            {product.name}
          </ProDayText>
          <ProDayText variant="section" style={styles.price}>
            {formatShopPrice(product.priceEur)}
          </ProDayText>
        </View>
        {onAddToCart ? (
          <PressableSpring
            style={styles.addBtn}
            scaleTo={0.9}
            haptic
            onPress={() => {
              prodayHaptics.cartAdd();
              onAddToCart();
            }}
          >
            <Icon name="add" size={22} color={c.ink} />
          </PressableSpring>
        ) : null}
      </View>
    </PressableSpring>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    card: {
      marginHorizontal: spacing.lg,
      borderRadius: radius.xl + 4,
      overflow: 'hidden',
      backgroundColor: c.surface,
    },
    imageWrap: {
      height: 248,
      position: 'relative',
      backgroundColor: c.surfaceMuted,
    },
    image: { width: '100%', height: '100%' },
    fallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    gradient: {
      ...StyleSheet.absoluteFillObject,
    },
    badge: {
      position: 'absolute',
      top: spacing.md,
      left: spacing.md,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.pill,
      backgroundColor: 'rgba(255,255,255,0.92)',
    },
    badgeText: {
      color: c.ink,
      fontWeight: '900',
      fontSize: 10,
    },
    recoPill: {
      position: 'absolute',
      top: spacing.md,
      right: spacing.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: 5,
      borderRadius: radius.pill,
    },
    recoPillText: {
      fontWeight: '900',
      fontSize: 10,
      letterSpacing: 0.3,
    },
    overlayCopy: {
      position: 'absolute',
      left: spacing.lg,
      right: spacing.xl + 40,
      bottom: spacing.lg,
      gap: 4,
    },
    kicker: {
      color: 'rgba(255,255,255,0.78)',
      letterSpacing: 1.2,
    },
    name: {
      color: '#fff',
      fontSize: 22,
      lineHeight: 26,
      fontWeight: '900',
    },
    price: {
      color: '#fff',
      fontWeight: '900',
      marginTop: 2,
    },
    addBtn: {
      position: 'absolute',
      right: spacing.md,
      bottom: spacing.md,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
