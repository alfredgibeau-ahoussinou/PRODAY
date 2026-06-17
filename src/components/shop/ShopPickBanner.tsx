import React, { useMemo } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { formatShopPrice, type ShopProduct } from '../../content/prodayShop';
import { getShopProductImage } from '../../content/shopAssets';
import type { ProductLineId } from '../../models/ProductLine';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';
import type { ShopProductRecommendation } from '../../core/recommendation/shopRecommendation.engine';

interface ShopPickBannerProps {
  product: ShopProduct;
  productLine: ProductLineId;
  recommendation: ShopProductRecommendation;
  onPress: () => void;
}

/** Bandeau recommandation IA — visible au-dessus du catalogue. */
export const ShopPickBanner: React.FC<ShopPickBannerProps> = ({
  product,
  productLine,
  recommendation,
  onPress,
}) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const image = getShopProductImage(product.id, productLine);

  return (
    <PressableSpring
      style={[styles.card, { borderColor: colors.accentMuted, backgroundColor: colors.accentSoft }]}
      onPress={onPress}
      scaleTo={0.98}
      haptic
    >
      <View style={[styles.thumb, { backgroundColor: colors.surface }]}>
        {image ? (
          <Image source={image} style={styles.thumbImage} resizeMode="cover" />
        ) : (
          <Icon name={product.icon} size={22} color={colors.accent} variant="filled" />
        )}
      </View>
      <View style={styles.copy}>
        <ProDayText variant="caption" accent style={styles.kicker}>
          Recommandé pour vous · {recommendation.iaScore}%
        </ProDayText>
        <ProDayText variant="section" numberOfLines={1}>
          {product.name}
        </ProDayText>
        <ProDayText variant="caption" muted numberOfLines={1}>
          {recommendation.reason} · {formatShopPrice(product.priceEur)}
        </ProDayText>
      </View>
      <Icon name="chevron-forward" size={18} color={colors.accent} />
    </PressableSpring>
  );
};

function createStyles(c: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
    },
    thumb: {
      width: 56,
      height: 56,
      borderRadius: radius.md,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    thumbImage: { width: '100%', height: '100%' },
    copy: { flex: 1, gap: 2, minWidth: 0 },
    kicker: { fontWeight: '800', letterSpacing: 0.2 },
  });
}
