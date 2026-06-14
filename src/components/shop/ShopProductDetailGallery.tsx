import React, { useMemo } from 'react';
import { View, Image, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ShopProduct } from '../../content/prodayShop';
import { getShopProductImage } from '../../content/shopAssets';
import type { ProductLineId } from '../../models/ProductLine';
import { useAppTheme } from '../../context/ProductLineContext';
import type { AppColors } from '../../theme/universeTheme';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { ProDayText } from '../ui/ProDayText';
import { spacing, radius, shadows } from '../../theme/designTokens';

interface ShopProductDetailGalleryProps {
  product: ShopProduct;
  productLine: ProductLineId;
  wished?: boolean;
  onBack: () => void;
  onToggleWish?: () => void;
}

export const ShopProductDetailGallery: React.FC<ShopProductDetailGalleryProps> = ({
  product,
  productLine,
  wished = false,
  onBack,
  onToggleWish,
}) => {
  const insets = useSafeAreaInsets();
  const { height: windowH } = useWindowDimensions();
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const image = getShopProductImage(product.id, productLine);
  const galleryH = Math.min(400, Math.round(windowH * 0.46));

  return (
    <View style={[styles.shell, { height: galleryH, backgroundColor: c.surfaceMuted }]}>
      <View style={styles.imageStage}>
        {image ? (
          <Image
            source={image}
            style={styles.image}
            resizeMode="contain"
            accessibilityLabel={product.name}
          />
        ) : (
          <View style={styles.fallback}>
            <Icon name={product.icon} size={72} color={c.ink} variant="filled" />
          </View>
        )}
      </View>

      <View style={[styles.toolbar, { paddingTop: insets.top + spacing.xs }]}>
        <PressableSpring onPress={onBack} scaleTo={0.94} haptic style={[styles.toolBtn, shadows.soft]}>
          <Icon name="arrow-back" size={22} color={c.ink} />
        </PressableSpring>
        {onToggleWish ? (
          <PressableSpring onPress={onToggleWish} scaleTo={0.94} haptic style={[styles.toolBtn, shadows.soft]}>
            <Icon
              name="bookmark"
              size={20}
              color={wished ? c.accent : c.ink}
              variant={wished ? 'filled' : undefined}
            />
          </PressableSpring>
        ) : (
          <View style={styles.toolSpacer} />
        )}
      </View>

      {product.badge ? (
        <View style={[styles.badge, { backgroundColor: c.ink }]}>
          <ProDayText variant="caption" inverse style={styles.badgeText}>
            {product.badge}
          </ProDayText>
        </View>
      ) : null}
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    shell: {
      position: 'relative',
      overflow: 'hidden',
    },
    imageStage: {
      flex: 1,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xl * 2.2,
      paddingBottom: spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    fallback: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    toolbar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
    },
    toolBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    toolSpacer: { width: 44 },
    badge: {
      position: 'absolute',
      bottom: spacing.lg,
      left: spacing.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: radius.pill,
    },
    badgeText: {
      fontWeight: '900',
      fontSize: 10,
      letterSpacing: 0.6,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
  });
}
