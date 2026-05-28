import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon, type IconName } from '../ui/Icon';
import { colors, spacing, radius } from '../../theme/designTokens';

export type AdminTabId =
  | 'overview'
  | 'users'
  | 'events'
  | 'mercato'
  | 'matches'
  | 'arena'
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
  { id: 'arena', label: 'Arena', icon: 'trophy', countKey: 'tournaments' },
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
      'users' | 'events' | 'posts' | 'matches' | 'tournaments' | 'sponsors' | 'clubs' | 'payments' | 'applications',
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
}) => (
  <View style={styles.wrap}>
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
          <TouchableOpacity
            key={t.id}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onChange(t.id)}
            activeOpacity={0.85}
          >
            <Icon
              name={t.icon}
              size={16}
              color={isActive ? colors.brandInverse : colors.textMuted}
            />
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{t.label}</Text>
            {count !== undefined && count > 0 ? (
              <View style={[styles.countBadge, isActive && styles.countBadgeActive]}>
                <Text style={[styles.countText, isActive && styles.countTextActive]}>
                  {count > 99 ? '99+' : count}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
  rail: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  tabActive: {
    backgroundColor: colors.ink,
    borderColor: colors.accent,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
  },
  tabLabelActive: { color: colors.brandInverse },
  countBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  countBadgeActive: {
    backgroundColor: colors.accent,
    borderColor: colors.brandInverse,
  },
  countText: { fontSize: 9, fontWeight: '900', color: colors.accent },
  countTextActive: { color: colors.brandInverse },
});
