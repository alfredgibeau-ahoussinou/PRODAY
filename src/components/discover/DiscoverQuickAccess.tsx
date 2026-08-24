import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import type { IconName } from '../ui/Icon';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { spacing, radius } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { getLocalizedQuickAccessItems } from '../../i18n/localizedContent';
import type { ProductLineId } from '../../models/ProductLine';
import {
  brandVariantForProductLine,
  poleAccent,
  poleAccentSoft,
} from '../../theme/prodayBrand';
import {
  discoverQuickIdsForLine,
  type DiscoverQuickId,
} from './discoverPoleHome';

export type { DiscoverQuickId };

interface DiscoverQuickAccessProps {
  onPress: (id: DiscoverQuickId) => void;
  productLine?: ProductLineId;
  hideReels?: boolean;
}

export const DiscoverQuickAccess: React.FC<DiscoverQuickAccessProps> = ({
  onPress,
  productLine: lineProp,
  hideReels = false,
}) => {
  const { productLine: ctxLine } = useAppTheme();
  const productLine = lineProp ?? ctxLine;
  const variant = brandVariantForProductLine(productLine);
  const accent = poleAccent(variant);
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(accent, variant), [accent, variant]);
  const iconById: Partial<Record<DiscoverQuickId, IconName>> = {
    mercato: 'search',
    matchs: 'handshake',
    reels: 'football',
    shop: 'bag',
  };
  const allowed = useMemo(() => {
    const ids = discoverQuickIdsForLine(productLine);
    return hideReels ? ids.filter((id) => id !== 'reels') : ids;
  }, [hideReels, productLine]);
  const items = useMemo(() => {
    const localized = getLocalizedQuickAccessItems(t);
    return localized
      .filter((item) => allowed.includes(item.id))
      .slice(0, 3)
      .map((item) => ({
        ...item,
        icon: iconById[item.id] ?? 'search',
      }));
  }, [allowed, t]);

  if (items.length === 0) return null;

  return (
    <View style={styles.row}>
      {items.map((item) => (
        <PressableSpring
          key={item.id}
          onPress={() => onPress(item.id)}
          scaleTo={0.98}
          haptic
          style={styles.tile}
        >
          <View style={styles.iconWrap}>
            <Icon name={item.icon} size={20} color={accent} variant="filled" />
          </View>
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.sub}>{item.sub}</Text>
        </PressableSpring>
      ))}
    </View>
  );
};

function createStyles(accent: string, variant: ReturnType<typeof brandVariantForProductLine>) {
  const soft = poleAccentSoft(variant, 0.14);
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    tile: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xs,
      borderRadius: radius.xl,
      backgroundColor: 'rgba(255,255,255,0.04)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255,255,255,0.08)',
      gap: 5,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: radius.lg,
      backgroundColor: soft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
    label: {
      fontSize: 12,
      fontWeight: '800',
      color: '#FAFAFA',
      textAlign: 'center',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    sub: {
      fontSize: 9,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.45)',
      textAlign: 'center',
    },
  });
}
