import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MAIN_TAB_ITEMS, type MainTabId } from '../../navigation/mainTabConfig';
import { PressableSpring } from '../discover/PressableSpring';
import { Icon, type IconName } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { getTabShortLabel, getVisibleMainTabs } from '../../content/poleExperience';
import {
  getPhysioTabIcon,
  isMedicalPractitionerRole,
  MEDICAL_THEME,
} from '../../content/medicalExperience';
import {
  getSponsorTabIcon,
  isSponsorRole,
  SPONSOR_THEME,
} from '../../content/sponsorExperience';
import { spacing } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

const TAB_ICONS: Record<MainTabId, IconName> = {
  home: 'home',
  recrutement: 'search',
  matchs: 'handshake',
  covoiturage: 'car',
  sante: 'heart',
  feed: 'star-four-points',
  reels: 'videocam',
  messages: 'chat',
  profil: 'person',
  shop: 'bag',
};

type CompactTabBarProps = {
  activeTab: MainTabId;
  onTabPress: (tab: MainTabId) => void;
  unreadCount?: number;
  visibleTabs?: MainTabId[];
};

/** Barre compacte — web / desktop. */
export const CompactTabBar: React.FC<CompactTabBarProps> = ({
  activeTab,
  onTabPress,
  unreadCount = 0,
  visibleTabs,
}) => {
  const { colors, isWoman, productLine } = useAppTheme();
  const sessionProfile = useSessionProfile();
  const insets = useSafeAreaInsets();
  const immersive = activeTab === 'reels';

  const visibleTabIds = useMemo(
    () => visibleTabs ?? getVisibleMainTabs(productLine, sessionProfile?.role),
    [visibleTabs, productLine, sessionProfile?.role],
  );
  const tabItems = useMemo(
    () => MAIN_TAB_ITEMS.filter((t) => visibleTabIds.includes(t.id)),
    [visibleTabIds],
  );

  const role = sessionProfile?.role;
  const isPhysio = isMedicalPractitionerRole(role);
  const isSponsor = isSponsorRole(role);
  const accentInk = isPhysio
    ? MEDICAL_THEME.primary
    : isSponsor
      ? SPONSOR_THEME.primary
      : isWoman
        ? colors.accent
        : colors.ink;

  const styles = useMemo(() => createStyles(colors, immersive), [colors, immersive]);

  return (
    <View
      style={[
        styles.root,
        {
          paddingBottom: Math.max(insets.bottom, spacing.xs),
          backgroundColor: immersive ? '#000' : colors.background,
        },
      ]}
    >
      <View
        style={[
          styles.dock,
          {
            backgroundColor: immersive ? 'rgba(0,0,0,0.92)' : colors.surface,
            borderColor: immersive ? 'rgba(255,255,255,0.08)' : colors.border,
          },
        ]}
      >
        {tabItems.map((tab) => {
          const active = tab.id === activeTab;
          const icon = isPhysio
            ? getPhysioTabIcon(tab.id)
            : isSponsor
              ? getSponsorTabIcon(tab.id)
              : TAB_ICONS[tab.id];
          const badge = tab.id === 'messages' ? unreadCount : 0;
          const label = getTabShortLabel(tab.id, productLine, role) || tab.label;
          const iconColor = active
            ? immersive
              ? '#fff'
              : accentInk
            : immersive
              ? 'rgba(255,255,255,0.45)'
              : colors.textMuted;

          return (
            <PressableSpring
              key={tab.id}
              style={styles.tab}
              onPress={() => onTabPress(tab.id)}
              scaleTo={0.92}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={label}
            >
              <View style={styles.iconWrap}>
                <Icon
                  name={icon}
                  size={21}
                  color={iconColor}
                  variant={active ? 'filled' : 'outline'}
                />
                {badge > 0 ? (
                  <View style={[styles.badge, immersive && styles.badgeImmersive]}>
                    <Text style={styles.badgeText}>
                      {badge > 99 ? '99+' : badge > 9 ? '9+' : badge}
                    </Text>
                  </View>
                ) : null}
              </View>
            </PressableSpring>
          );
        })}
      </View>
    </View>
  );
};

function createStyles(c: AppColors, immersive: boolean) {
  return StyleSheet.create({
    root: {
      paddingTop: spacing.xs,
      paddingHorizontal: spacing.sm,
    },
    dock: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 44,
      borderRadius: immersive ? 0 : 14,
      borderWidth: 1,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      height: 44,
    },
    iconWrap: {
      width: 28,
      height: 26,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badge: {
      position: 'absolute',
      top: -2,
      right: -6,
      backgroundColor: c.ink,
      borderRadius: 8,
      minWidth: 15,
      height: 15,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
      borderWidth: 1.5,
      borderColor: c.surface,
    },
    badgeImmersive: {
      borderColor: 'rgba(0,0,0,0.5)',
    },
    badgeText: {
      color: c.brandInverse,
      fontSize: 8,
      fontWeight: '800',
    },
  });
}
