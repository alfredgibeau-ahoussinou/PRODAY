import React, { useMemo } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableSpring } from '../motion/PressableSpring';
import { prodayHaptics } from '../../utils/prodayHaptics';
import {
  formatShopPrice,
  getShopCategoryLabel,
  type ShopProduct,
} from '../../content/prodayShop';
import { getShopProductImage } from '../../content/shopAssets';
import type { ProductLineId } from '../../models/ProductLine';
import { useAppTheme } from '../../context/ProductLineContext';
import type { AppColors } from '../../theme/universeTheme';
import { useJoueurSession } from '../../context/JoueurSessionContext';
import { usePlayerThemeColors } from '../../context/PlayerThemeContext';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { spacing, radius, shadows } from '../../theme/designTokens';

interface ShopProductCardProps {
  product: ShopProduct;
  productLine: ProductLineId;
  wished?: boolean;
  iaReason?: string;
  onToggleWish: () => void;
  onPress: () => void;
  onQuickAdd?: () => void;
}

export const ShopProductCard: React.FC<ShopProductCardProps> = ({
  product,
  productLine,
  wished = false,
  iaReason,
  onToggleWish,
  onPress,
  onQuickAdd,
}) => {
  const { colors: c } = useAppTheme();
  const joueurSession = useJoueurSession();
  const playerColors = usePlayerThemeColors();
  const joueurSkin = Boolean(
    joueurSession?.isJoueurPlayer && joueurSession.ready && !joueurSession.needsGate,
  );
  const colors = joueurSkin
    ? {
        ...c,
        surface: PLAYER_DARK.surface,
        surfaceMuted: PLAYER_DARK.bgElevated,
        border: PLAYER_DARK.border,
        ink: PLAYER_DARK.text,
        textMuted: PLAYER_DARK.textMuted,
        accent: playerColors.accent,
      }
    : c;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const image = getShopProductImage(product.id, productLine);

  return (
    <PressableSpring
      style={[styles.card, shadows.soft, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => {
        prodayHaptics.press();
        onPress();
      }}
      scaleTo={0.97}
    >
      <View style={[styles.imageWrap, { backgroundColor: colors.surfaceMuted }]}>
        {image ? (
          <Image source={image} style={styles.image} resizeMode="cover" accessibilityLabel={product.name} />
        ) : (
          <View style={styles.fallback}>
            <Icon name={product.icon} size={36} color={colors.ink} variant="filled" />
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.55)']}
          style={styles.shade}
        />
        {product.badge ? (
          <View style={styles.badge}>
            <ProDayText variant="caption" style={styles.badgeText}>
              {product.badge}
            </ProDayText>
          </View>
        ) : null}
        <PressableSpring style={styles.wishBtn} onPress={onToggleWish} scaleTo={0.97} haptic>
          <Icon
            name="bookmark"
            size={17}
            color={wished ? colors.accent : '#fff'}
            variant={wished ? 'filled' : undefined}
          />
        </PressableSpring>
        <ProDayText variant="section" style={styles.priceOnImage}>
          {formatShopPrice(product.priceEur)}
        </ProDayText>
        {onQuickAdd ? (
          <PressableSpring
            style={styles.quickAdd}
            onPress={() => {
              prodayHaptics.cartAdd();
              onQuickAdd();
            }}
            scaleTo={0.97}
            haptic
          >
            <Icon name="add" size={18} color={c.ink} />
          </PressableSpring>
        ) : null}
      </View>

      <View style={styles.body}>
        <ProDayText variant="caption" muted numberOfLines={1}>
          {getShopCategoryLabel(product.category, productLine)}
        </ProDayText>
        <ProDayText variant="section" numberOfLines={2} style={styles.name}>
          {product.name}
        </ProDayText>
        {iaReason ? (
          <ProDayText variant="caption" accent numberOfLines={1} style={styles.iaReason}>
            {iaReason}
          </ProDayText>
        ) : null}
      </View>
    </PressableSpring>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    card: {
      borderRadius: radius.xl,
      borderWidth: 1,
      overflow: 'hidden',
    },
    imageWrap: {
      width: '100%',
      aspectRatio: 0.82,
      position: 'relative',
    },
    image: { width: '100%', height: '100%' },
    fallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    shade: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: '55%',
    },
    badge: {
      position: 'absolute',
      top: spacing.sm,
      left: spacing.sm,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
      backgroundColor: 'rgba(255,255,255,0.92)',
    },
    badgeText: {
      color: c.ink,
      fontSize: 9,
      fontWeight: '900',
    },
    wishBtn: {
      position: 'absolute',
      top: spacing.sm,
      right: spacing.sm,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(0,0,0,0.28)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    priceOnImage: {
      position: 'absolute',
      left: spacing.sm,
      bottom: spacing.sm,
      color: '#fff',
      fontWeight: '900',
      fontSize: 15,
    },
    quickAdd: {
      position: 'absolute',
      right: spacing.sm,
      bottom: spacing.sm,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      gap: 2,
    },
    name: {
      fontWeight: '800',
      minHeight: 38,
    },
    iaReason: { fontWeight: '700', fontSize: 10, marginTop: 2 },
  });
}
