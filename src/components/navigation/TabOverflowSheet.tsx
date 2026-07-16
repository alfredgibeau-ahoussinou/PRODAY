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
import { spacing, radius, shadows } from '../../theme/designTokens';
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
        <Text style={styles.kicker}>{chrome.overflowKicker}</Text>
        <Text style={styles.title}>{t('nav.overflow')}</Text>
        <Text style={styles.subtitle}>{t('nav.overflowHint')}</Text>

        <View style={styles.list}>
          {tabs.map((tab, index) => {
            const active = tab === activeTab;
            const label = getTabShortLabel(tab, productLine, role, t);
            const badge = tab === 'messages' ? unreadCount : 0;
            const isLast = index === tabs.length - 1;

            return (
              <PressableSpring
                key={tab}
                style={[
                  styles.row,
                  active && styles.rowActive,
                  isLast && styles.rowLast,
                ]}
                onPress={() => {
                  onSelect(tab);
                  onClose();
                }}
                scaleTo={0.98}
                haptic
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <View
                  style={[
                    styles.iconCircle,
                    active && { backgroundColor: colors.accentSoft },
                  ]}
                >
                  <Icon
                    name={resolveTabIcon(tab, role, productLine)}
                    size={22}
                    color={active ? accent : colors.textMuted}
                    variant={active ? 'filled' : 'outline'}
                  />
                  {badge > 0 ? (
                    <View style={[styles.badge, { backgroundColor: chrome.badgeColor }]}>
                      <Text style={styles.badgeText}>{formatTabBadge(badge)}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.rowCopy}>
                  <Text
                    style={[styles.rowLabel, active && { color: accent }]}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                  {active ? (
                    <Text style={styles.rowMeta}>{t('nav.overflowActive')}</Text>
                  ) : null}
                </View>

                <Icon
                  name={active ? 'checkmark-circle' : 'chevron-forward'}
                  size={active ? 20 : 18}
                  color={active ? accent : colors.textMuted}
                  variant={active ? 'filled' : 'outline'}
                />
              </PressableSpring>
            );
          })}
        </View>
      </ScrollView>
    </AnimatedModalShell>
  );
};

function createStyles(c: AppColors, accent: string) {
  return StyleSheet.create({
    scroll: { flex: 1 },
    sheet: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
    },
    kicker: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      color: accent,
      marginBottom: spacing.xs,
    },
    title: {
      fontSize: 22,
      fontWeight: '900',
      color: c.ink,
      letterSpacing: -0.3,
    },
    subtitle: {
      fontSize: 14,
      fontWeight: '500',
      color: c.textMuted,
      marginTop: spacing.xs,
      marginBottom: spacing.lg,
      lineHeight: 20,
    },
    list: {
      borderRadius: radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      backgroundColor: c.surface,
      overflow: 'hidden',
      ...shadows.soft,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minHeight: 64,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    rowActive: {
      backgroundColor: c.surfaceMuted,
    },
    rowLast: {
      borderBottomWidth: 0,
    },
    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.background,
    },
    rowCopy: {
      flex: 1,
      gap: 2,
    },
    rowLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: c.text,
    },
    rowMeta: {
      fontSize: 12,
      fontWeight: '600',
      color: accent,
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
