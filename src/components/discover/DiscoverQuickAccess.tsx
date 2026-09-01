import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import type { IconName } from '../ui/Icon';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { spacing } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { getLocalizedQuickAccessItems } from '../../i18n/localizedContent';
import type { ProductLineId } from '../../models/ProductLine';
import {
  brandVariantForProductLine,
  poleAccent,
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
  const styles = useMemo(() => createStyles(accent), [accent]);

  const iconById: Partial<Record<DiscoverQuickId, IconName>> = {
    mercato: 'search',
    matchs: 'calendar',
    reels: 'play',
    shop: 'bag',
    sponsors: 'star',
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
          scaleTo={0.96}
          haptic
          style={styles.tile}
        >
          <View style={styles.iconWrap}>
            <Icon name={item.icon} size={20} color="#F5D04A" />
          </View>
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.sub} numberOfLines={1}>{item.sub}</Text>
        </PressableSpring>
      ))}
    </View>
  );
};

function createStyles(accent: string) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: 12,
      width: '100%',
    },
    tile: {
      flex: 1,
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderRadius: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.10)',
      alignItems: 'center',
      gap: 6,
    },
    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: 'rgba(245, 208, 74, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
    label: {
      fontSize: 14,
      fontWeight: '700',
      color: '#FFFFFF',
      textAlign: 'center',
      letterSpacing: 0.1,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    sub: {
      fontSize: 12,
      fontWeight: '500',
      color: 'rgba(255, 255, 255, 0.5)',
      textAlign: 'center',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
  });
}
