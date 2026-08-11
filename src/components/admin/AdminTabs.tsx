import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { PressableSpring } from '../motion';
import { Icon, type IconName } from '../ui/Icon';
import { useAdminStyles, adminChrome } from './adminStyles';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

export type AdminTabId =
  | 'overview'
  | 'users'
  | 'events'
  | 'mercato'
  | 'matches'
  | 'clubs'
  | 'finance'
  | 'applications'
  | 'sponsors'
  | 'system';

const TABS: { id: AdminTabId; label: string; icon: IconName; countKey?: string }[] = [
  { id: 'overview', label: 'Vue', icon: 'home' },
  { id: 'users', label: 'Users', icon: 'people', countKey: 'users' },
  { id: 'events', label: 'Events', icon: 'calendar', countKey: 'events' },
  { id: 'mercato', label: 'Mercato', icon: 'briefcase', countKey: 'posts' },
  { id: 'matches', label: 'Matchs', icon: 'handshake', countKey: 'matches' },
  { id: 'clubs', label: 'Clubs', icon: 'business', countKey: 'clubs' },
  { id: 'finance', label: 'Finance', icon: 'calendar', countKey: 'payments' },
  { id: 'applications', label: 'Candid.', icon: 'document', countKey: 'applications' },
  { id: 'sponsors', label: 'Sponsors', icon: 'star', countKey: 'sponsors' },
  { id: 'system', label: 'Système', icon: 'settings' },
];

interface AdminTabsProps {
  active: AdminTabId;
  onChange: (tab: AdminTabId) => void;
  counts?: Partial<
    Record<
      'users' | 'events' | 'posts' | 'matches' | 'sponsors' | 'clubs' | 'payments' | 'applications',
      number
    >
  >;
  pendingVerifications?: number;
}

export const AdminTabs: React.FC<AdminTabsProps> = ({
  active,
  onChange,
  counts,
  pendingVerifications = 0,
}) => {
  const { colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rail}
        >
          {TABS.map((t) => {
            const isActive = active === t.id;
            const count =
              t.id === 'users' && pendingVerifications > 0
                ? pendingVerifications
                : t.countKey && counts
                  ? counts[t.countKey as keyof typeof counts]
                  : undefined;
            return (
              <PressableSpring
                key={t.id}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => onChange(t.id)}
                scaleTo={0.96}
                haptic
              >
                <Icon
                  name={t.icon}
                  size={15}
                  color={isActive ? '#FFFFFF' : c.textMuted}
                />
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{t.label}</Text>
                {count !== undefined && count > 0 ? (
                  <View style={[styles.countBadge, isActive && styles.countBadgeActive]}>
                    <Text style={[styles.countText, isActive && styles.countTextActive]}>
                      {count > 99 ? '99+' : count}
                    </Text>
                  </View>
                ) : null}
              </PressableSpring>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    track: {
      backgroundColor: c.surfaceMuted,
      borderRadius: radius.xl,
      padding: 4,
      borderWidth: 1,
      borderColor: c.border,
    },
    rail: {
      gap: 4,
      alignItems: 'center',
    },
    tab: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: radius.lg,
    },
    tabActive: {
      backgroundColor: adminChrome.accent,
    },
    tabLabel: { fontSize: 12, fontWeight: '700', color: c.textMuted },
    tabLabelActive: { color: '#FFFFFF' },
    countBadge: {
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    countBadgeActive: {
      backgroundColor: 'rgba(255,255,255,0.25)',
    },
    countText: { fontSize: 10, fontWeight: '800', color: c.brand },
    countTextActive: { color: '#FFFFFF' },
  });
}
