import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ADMIN_TAB_ITEMS, type AdminMainTabId } from '../../navigation/adminTabConfig';
import { PressableSpring } from '../discover/PressableSpring';
import { Icon } from '../ui/Icon';
import { colors, spacing } from '../../theme/designTokens';

interface AdminTabBarProps {
  activeTab: AdminMainTabId;
  onTabPress: (tab: AdminMainTabId) => void;
  pendingVerifications?: number;
}

export const AdminTabBar: React.FC<AdminTabBarProps> = ({
  activeTab,
  onTabPress,
  pendingVerifications = 0,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      <View style={styles.brandStrip}>
        <Text style={styles.brandText}>PRODAY · ESPACE ADMIN</Text>
      </View>
      <View style={styles.row}>
        {ADMIN_TAB_ITEMS.map((tab) => {
          const active = tab.id === activeTab;
          const badge =
            tab.id === 'users' && pendingVerifications > 0 ? pendingVerifications : 0;
          return (
            <PressableSpring
              key={tab.id}
              onPress={() => onTabPress(tab.id)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Icon
                name={tab.icon}
                size={18}
                color={active ? colors.brandInverse : colors.heroMuted}
              />
              <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
                {tab.shortLabel}
              </Text>
              {badge > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
                </View>
              ) : null}
            </PressableSpring>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surfaceInverse,
    borderTopWidth: 2,
    borderTopColor: colors.accent,
  },
  brandStrip: {
    paddingVertical: 4,
    alignItems: 'center',
    backgroundColor: colors.ink,
  },
  brandText: {
    color: colors.accent,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: 4,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  label: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.heroMuted,
  },
  labelActive: { color: colors.brandInverse },
  badge: {
    position: 'absolute',
    top: 4,
    right: 8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: colors.brandInverse, fontSize: 8, fontWeight: '900' },
});
