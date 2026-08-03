import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { AnimatedModalShell } from '../motion/AnimatedModalShell';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { formatTabBadge, resolveTabIcon } from './tabBarShared';
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

/** Menu ⋯ — grille claire, sans kicker marketing. */
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
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const chrome = useMemo(
    () => getPoleTabBarChrome(productLine, role),
    [productLine, role],
  );
  const accent = resolveTabBarAccent(productLine, role, colors);
  const styles = useMemo(
    () => createStyles(colors, accent, chrome.cleanStyle),
    [colors, accent, chrome.cleanStyle],
  );

  return (
    <AnimatedModalShell
      visible={visible}
      onClose={onClose}
      variant="compact"
      handleOnly
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.sheet}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Text style={styles.title}>{t('nav.overflow')}</Text>
        <Text style={styles.subtitle}>{t('nav.overflowHint')}</Text>

        <View style={styles.grid}>
          {tabs.map((tab) => {
            const active = tab === activeTab;
            const label = getTabShortLabel(tab, productLine, role, t);
            const badge = tab === 'messages' ? unreadCount : 0;

            return (
              <PressableSpring
                key={tab}
                style={[styles.tile, active && styles.tileActive]}
                onPress={() => {
                  onSelect(tab);
                  onClose();
                }}
                scaleTo={0.96}
                haptic
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <View style={[styles.iconWrap, active && { backgroundColor: colors.accentSoft }]}>
                  <Icon
                    name={resolveTabIcon(tab, role, productLine)}
                    size={24}
                    color={active ? accent : colors.text}
                    variant={active ? 'filled' : 'outline'}
                  />
                  {badge > 0 ? (
                    <View style={[styles.badge, { backgroundColor: chrome.badgeColor }]}>
                      <Text style={styles.badgeText}>{formatTabBadge(badge)}</Text>
                    </View>
                  ) : null}
                </View>
                <Text
                  style={[styles.tileLabel, active && { color: accent }]}
                  numberOfLines={2}
                >
                  {label}
                </Text>
              </PressableSpring>
            );
          })}
        </View>
      </ScrollView>
    </AnimatedModalShell>
  );
};

function createStyles(c: AppColors, accent: string, clean: boolean) {
  return StyleSheet.create({
    scroll: { flex: 1 },
    sheet: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
    },
    title: {
      fontSize: clean ? 20 : 22,
      fontWeight: '800',
      color: c.ink,
      letterSpacing: -0.4,
    },
    subtitle: {
      fontSize: 14,
      fontWeight: '500',
      color: c.textMuted,
      marginTop: spacing.xs,
      marginBottom: spacing.lg,
      lineHeight: 20,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    tile: {
      width: '31%',
      flexGrow: 1,
      minWidth: '30%',
      maxWidth: '48%',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.lg,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    tileActive: {
      borderColor: accent,
      backgroundColor: c.surfaceMuted,
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.background,
    },
    tileLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: c.text,
      textAlign: 'center',
    },
    badge: {
      position: 'absolute',
      top: -2,
      right: -2,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
      borderWidth: 2,
      borderColor: c.surface,
    },
    badgeText: {
      color: c.brandInverse,
      fontSize: 9,
      fontWeight: '800',
    },
  });
}
