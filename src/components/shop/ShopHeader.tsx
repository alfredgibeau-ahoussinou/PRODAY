import React, { useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ProductLineId } from '../../models/ProductLine';
import { brandForProductLine } from '../../models/ProductLine';
import { gradientsForLine } from '../../theme/universeGradients';
import { spacing, radius } from '../../theme/designTokens';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import type { ShopCopy } from '../../content/prodayShop';

interface ShopHeaderProps {
  productLine: ProductLineId;
  copy: ShopCopy;
  cartCount: number;
  wishCount: number;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
}

export const ShopHeader: React.FC<ShopHeaderProps> = ({
  productLine,
  copy,
  cartCount,
  wishCount,
  onOpenCart,
  onOpenWishlist,
}) => {
  const insets = useSafeAreaInsets();
  const brand = brandForProductLine(productLine);
  const stops = gradientsForLine(productLine);
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.shell}>
      <LinearGradient
        colors={[...stops.hero]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.scrim} />

      <View style={[styles.inner, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.topRow}>
          <View style={styles.copy}>
            <ProDayText variant="eyebrow" style={styles.kicker}>
              {brand.name}
            </ProDayText>
            <ProDayText variant="hero" style={styles.title}>
              {copy.title}
            </ProDayText>
            <ProDayText variant="body" style={styles.sub} numberOfLines={2}>
              {copy.subtitle}
            </ProDayText>
          </View>

          <View style={styles.actions}>
            <PressableSpring onPress={onOpenWishlist} scaleTo={0.92} haptic style={styles.iconBtn}>
              <Icon name="bookmark" size={20} color="#fff" variant={wishCount > 0 ? 'filled' : undefined} />
              {wishCount > 0 ? (
                <View style={styles.badge}>
                  <ProDayText variant="caption" inverse style={styles.badgeText}>
                    {wishCount > 9 ? '9+' : String(wishCount)}
                  </ProDayText>
                </View>
              ) : null}
            </PressableSpring>
            <PressableSpring onPress={onOpenCart} scaleTo={0.92} haptic style={styles.iconBtn}>
              <Icon name="bag" size={20} color="#fff" />
              {cartCount > 0 ? (
                <View style={styles.badge}>
                  <ProDayText variant="caption" inverse style={styles.badgeText}>
                    {cartCount > 9 ? '9+' : String(cartCount)}
                  </ProDayText>
                </View>
              ) : null}
            </PressableSpring>
          </View>
        </View>
      </View>
    </View>
  );
};

function createStyles() {
  return StyleSheet.create({
    shell: {
      borderBottomLeftRadius: radius.xl + 6,
      borderBottomRightRadius: radius.xl + 6,
      overflow: 'hidden',
    },
    scrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.2)',
    },
    inner: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    copy: {
      flex: 1,
      gap: spacing.xs,
    },
    kicker: {
      color: 'rgba(255,255,255,0.72)',
      letterSpacing: 1.8,
      textTransform: 'uppercase',
    },
    title: {
      color: '#fff',
      fontSize: 30,
      lineHeight: 34,
      letterSpacing: -0.8,
      fontWeight: '900',
    },
    sub: {
      color: 'rgba(255,255,255,0.86)',
      lineHeight: 20,
      fontWeight: '500',
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    iconBtn: {
      width: 44,
      height: 44,
      borderRadius: radius.lg,
      backgroundColor: 'rgba(255,255,255,0.14)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.22)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    badge: {
      position: 'absolute',
      top: -3,
      right: -3,
      minWidth: 17,
      height: 17,
      borderRadius: 9,
      backgroundColor: '#22c55e',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    badgeText: {
      fontSize: 9,
      fontWeight: '900',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
  });
}
