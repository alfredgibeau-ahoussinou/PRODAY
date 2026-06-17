import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import type { IconName } from '../ui/Icon';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { spacing, radius, shadows } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { getLocalizedQuickAccessItems } from '../../i18n/localizedContent';
import type { AppColors } from '../../theme/universeTheme';

export type DiscoverQuickId = 'mercato' | 'matchs' | 'reels' | 'shop' | 'sponsors';

const ITEM_IDS: DiscoverQuickId[] = ['mercato', 'matchs', 'reels', 'shop'];

interface DiscoverQuickAccessProps {
  onPress: (id: DiscoverQuickId) => void;
  hideReels?: boolean;
}

export const DiscoverQuickAccess: React.FC<DiscoverQuickAccessProps> = ({
  onPress,
  hideReels = false,
}) => {
  const { colors: c } = useAppTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(c), [c]);
  const iconById: Partial<Record<DiscoverQuickId, IconName>> = {
    mercato: 'search',
    matchs: 'handshake',
    reels: 'football',
    shop: 'bag',
  };
  const items = useMemo(() => {
    const localized = getLocalizedQuickAccessItems(t);
    const list = localized.map((item) => ({
      ...item,
      icon: iconById[item.id] ?? 'search',
    }));
    return hideReels ? list.filter((item) => item.id !== 'reels') : list;
  }, [hideReels, t]);

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
            <Icon name={item.icon} size={20} color={c.ink} variant="filled" />
          </View>
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.sub}>{item.sub}</Text>
        </PressableSpring>
      ))}
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    tile: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.md + 2,
      paddingHorizontal: spacing.xs,
      borderRadius: radius.xl,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      gap: 5,
      ...shadows.soft,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: radius.lg,
      backgroundColor: c.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
    label: {
      fontSize: 12,
      fontWeight: '800',
      color: c.text,
      textAlign: 'center',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    sub: {
      fontSize: 9,
      fontWeight: '600',
      color: c.textMuted,
      textAlign: 'center',
    },
  });
}
