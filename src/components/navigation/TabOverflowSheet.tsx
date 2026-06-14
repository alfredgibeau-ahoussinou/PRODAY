import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedModalShell } from '../motion/AnimatedModalShell';
import { Icon, type IconName } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { getTabShortLabel } from '../../content/poleExperience';
import type { ProductLineId } from '../../models/ProductLine';
import type { UserRole } from '../../models/User';
import type { MainTabId } from '../../navigation/mainTabConfig';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

type TabOverflowSheetProps = {
  visible: boolean;
  onClose: () => void;
  tabs: MainTabId[];
  activeTab: MainTabId;
  tabIcons: Record<MainTabId, IconName>;
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
  tabIcons,
  productLine,
  role,
  onSelect,
  unreadCount = 0,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <AnimatedModalShell visible={visible} onClose={onClose} closeLabel="Fermer">
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <Text style={styles.title}>Navigation</Text>
        <View style={styles.grid}>
          {tabs.map((tab) => {
            const active = tab === activeTab;
            const label = getTabShortLabel(tab, productLine, role);
            const badge = tab === 'messages' ? unreadCount : 0;
            return (
              <Pressable
                key={tab}
                style={[styles.tile, active && styles.tileActive]}
                onPress={() => {
                  onSelect(tab);
                  onClose();
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <View style={styles.tileIcon}>
                  <Icon
                    name={tabIcons[tab]}
                    size={28}
                    color={active ? colors.ink : colors.textMuted}
                    variant={active ? 'filled' : 'outline'}
                  />
                  {badge > 0 ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {badge > 99 ? '99+' : badge}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.tileLabel, active && styles.tileLabelActive]} numberOfLines={2}>
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

function createStyles(c: AppColors) {
  return StyleSheet.create({
    sheet: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
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
      borderColor: c.ink,
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
      color: c.ink,
      fontWeight: '800',
    },
    badge: {
      position: 'absolute',
      top: 0,
      right: 0,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: c.ink,
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
