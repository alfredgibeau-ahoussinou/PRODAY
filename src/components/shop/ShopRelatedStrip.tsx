import React, { useMemo } from 'react';
import { View, ScrollView, Image, StyleSheet } from 'react-native';
import { formatShopPrice, type ShopProduct } from '../../content/prodayShop';
import { getShopProductImage } from '../../content/shopAssets';
import type { ProductLineId } from '../../models/ProductLine';
import { useAppTheme } from '../../context/ProductLineContext';
import type { AppColors } from '../../theme/universeTheme';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { spacing, radius, shadows } from '../../theme/designTokens';

interface ShopRelatedStripProps {
  products: ShopProduct[];
  productLine: ProductLineId;
  onPress: (product: ShopProduct) => void;
}

export const ShopRelatedStrip: React.FC<ShopRelatedStripProps> = ({
  products,
  productLine,
  onPress,
}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  if (products.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {products.map((item) => {
        const image = getShopProductImage(item.id, productLine);
        return (
          <PressableSpring
            key={item.id}
            style={[styles.card, shadows.soft, { backgroundColor: c.surface, borderColor: c.border }]}
            onPress={() => onPress(item)}
            scaleTo={0.97}
          >
            <View style={[styles.thumb, { backgroundColor: c.surfaceMuted }]}>
              {image ? (
                <Image source={image} style={styles.thumbImg} resizeMode="cover" />
              ) : (
                <Icon name={item.icon} size={24} color={c.ink} />
              )}
            </View>
            <View style={styles.copy}>
              <ProDayText variant="caption" numberOfLines={2} style={styles.name}>
                {item.name}
              </ProDayText>
              <ProDayText variant="caption" accent style={styles.price}>
                {formatShopPrice(item.priceEur)}
              </ProDayText>
            </View>
          </PressableSpring>
        );
      })}
    </ScrollView>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    row: {
      gap: spacing.sm,
      paddingRight: spacing.lg,
    },
    card: {
      width: 132,
      borderRadius: radius.lg,
      borderWidth: 1,
      overflow: 'hidden',
    },
    thumb: {
      height: 108,
      alignItems: 'center',
      justifyContent: 'center',
    },
    thumbImg: { width: '100%', height: '100%' },
    copy: {
      padding: spacing.sm,
      gap: 4,
    },
    name: {
      fontWeight: '700',
      color: c.text,
      minHeight: 32,
    },
    price: {
      fontWeight: '900',
    },
  });
}
