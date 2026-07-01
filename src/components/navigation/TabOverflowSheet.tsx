import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedModalShell } from '../motion/AnimatedModalShell';
import { Icon } from '../ui/Icon';
import { resolveTabIcon } from './tabBarShared';
import { useAppTheme } from '../../context/ProductLineContext';
import { getTabShortLabel } from '../../content/poleExperience';
import { useTranslation } from '../../context/LocaleContext';
import type { ProductLineId } from '../../models/ProductLine';
import type { UserRole } from '../../models/User';
import type { MainTabId } from '../../navigation/mainTabConfig';
import { spacing, radius } from '../../theme/designTokens';
import {
  getPoleTabBarChrome,
  resolveTabBarAccent,
} from '../../theme/poleTabBarTheme';
import type { AppColors } from '../../theme/universeTheme';

type TabOverflowSheetProps = {
  visible: boolean;
  onClose: () => void;
  tabs: MainTabId[];
  activeTab: MainTabId;
  productLine: ProductLineId;
  role?: UserRole | null;
  onSelect: (tab: MainTabId) => void;
  unreadCount?: number;
};

export const TabOverflowSheet: React.FC<TabOverflowSheetProps> = ({
  visible,
  onClose,
  tabs,
  activeTab,
  productLine,
  role,
  onSelect,
  unreadCount = 0,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const chrome = useMemo(
    () => getPoleTabBarChrome(productLine, role),
    [productLine, role],
  );
  const accent = resolveTabBarAccent(productLine, role, colors);
  const styles = useMemo(
    () => createStyles(colors, accent),
    [colors, accent],
  );

  return (
    <AnimatedModalShell visible={visible} onClose={onClose} closeLabel={t('common.close')}>
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <Text style={styles.kicker}>{chrome.overflowKicker}</Text>
        <Text style={styles.title}>{t('nav.overflow')}</Text>
        <View style={styles.grid}>
          {tabs.map((tab) => {
            const active = tab === activeTab;
            const label = getTabShortLabel(tab, productLine, role, t);
            const badge = tab === 'messages' ? unreadCount : 0;
            return (
              <Pressable
                key={tab}
                style={[
                  styles.tile,
                  active && [styles.tileActive, { borderColor: accent }],
                ]}
                onPress={() => {
                  onSelect(tab);
                  onClose();
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <View style={styles.tileIcon}>
                  <Icon
                    name={resolveTabIcon(tab, role, productLine)}
                    size={28}
                    color={active ? accent : colors.textMuted}
                    variant={active ? 'filled' : 'outline'}
                  />
                  {badge > 0 ? (
                    <View style={[styles.badge, { backgroundColor: chrome.badgeColor }]}>
                      <Text style={styles.badgeText}>
                        {badge > 99 ? '99+' : badge}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text
                  style={[styles.tileLabel, active && [styles.tileLabelActive, { color: accent }]]}
                  numberOfLines={2}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </AnimatedModalShell>
  );
};

function createStyles(c: AppColors, accent: string) {
  return StyleSheet.create({
    sheet: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    kicker: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.2,
      color: accent,
      marginBottom: spacing.xs,
    },
    title: {
      fontSize: 18,
      fontWeight: '800',
      color: c.ink,
      marginBottom: spacing.lg,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    tile: {
      width: '47%',
      minHeight: 88,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    tileActive: {
      borderColor: accent,
      backgroundColor: c.surface,
    },
    tileIcon: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tileLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: c.textMuted,
      textAlign: 'center',
    },
    tileLabelActive: {
      fontWeight: '800',
    },
    badge: {
      position: 'absolute',
      top: 0,
      right: 0,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    badgeText: {
      color: c.brandInverse,
      fontSize: 10,
      fontWeight: '800',
    },
  });
}
