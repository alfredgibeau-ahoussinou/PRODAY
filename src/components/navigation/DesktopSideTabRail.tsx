import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MAIN_TAB_ITEMS, type MainTabId } from '../../navigation/mainTabConfig';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import {
  formatTabBadge,
  resolveTabIcon,
  resolveTabInkColors,
} from './tabBarShared';
import { useAppTheme } from '../../context/ProductLineContext';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { getTabShortLabel, getVisibleMainTabs } from '../../content/poleExperience';
import { useTranslation } from '../../context/LocaleContext';
import { isSponsorRole, SPONSOR_THEME } from '../../content/sponsorExperience';
import { spacing } from '../../theme/designTokens';
import {
  getPoleTabBarChrome,
  resolveTabBarAccent,
} from '../../theme/poleTabBarTheme';
import { useJoueurSession } from '../../context/JoueurSessionContext';
import { JOUEUR_SITE } from '../../content/joueurPageIdentity';
import { desktopShellChrome } from '../../theme/desktopShellChrome';
import { getMobileRailLayout } from '../../navigation/mobileTabConfig';
import { getJoueurGameTabLabel } from '../../content/joueurGameMenu';
import type { IconName } from '../ui/Icon';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { usePlayerThemeColors } from '../../context/PlayerThemeContext';

const GAME_TAB_ICONS: Partial<Record<MainTabId, IconName>> = {
  home: 'football',
  matchs: 'trophy',
  feed: 'stats-chart',
  profil: 'person',
  plus: 'hamburger',
};

type Props = {
  activeTab: MainTabId;
  onTabPress: (tab: MainTabId) => void;
  unreadCount?: number;
  visibleTabs?: MainTabId[];
};

/**
 * Rail d’onglets vertical — Expo web / grand écran (≥900).
 * Remplace le dock bas pour Joueur et shells à onglets génériques.
 */
export function DesktopSideTabRail({
  activeTab,
  onTabPress,
  unreadCount = 0,
  visibleTabs,
}: Props) {
  const { colors, productLine, playerSegment } = useAppTheme();
  const { t } = useTranslation();
  const sessionProfile = useSessionProfile();
  const joueurSession = useJoueurSession();
  const playerTheme = usePlayerThemeColors();
  const insets = useSafeAreaInsets();

  const joueurLive = Boolean(
    joueurSession?.isJoueurPlayer && joueurSession.ready && !joueurSession.needsGate,
  );

  const role = sessionProfile?.role;
  const rail = useMemo(
    () => getMobileRailLayout(productLine, role, visibleTabs),
    [productLine, role, visibleTabs],
  );

  const visibleTabIds = useMemo(
    () => visibleTabs ?? getVisibleMainTabs(productLine, role, sessionProfile),
    [visibleTabs, productLine, role, sessionProfile],
  );

  const tabItems = useMemo(() => {
    const flat = rail.flat ?? [];
    if (joueurLive && flat.length > 0) {
      return flat.map((id) => ({
        id,
        label: getJoueurGameTabLabel(id, joueurSession?.ageGroup),
      }));
    }
    return MAIN_TAB_ITEMS.filter((item) => visibleTabIds.includes(item.id)).map((item) => ({
      id: item.id,
      label: getTabShortLabel(item.id, productLine, role, t),
    }));
  }, [
    joueurLive,
    rail.flat,
    joueurSession?.ageGroup,
    visibleTabIds,
    productLine,
    role,
    t,
  ]);

  const isSponsor = isSponsorRole(role);
  const chrome = useMemo(
    () => getPoleTabBarChrome(productLine, role, playerSegment),
    [productLine, role, playerSegment],
  );
  const accentInk = isSponsor
    ? SPONSOR_THEME.primary
    : joueurLive
      ? playerTheme.accent
      : resolveTabBarAccent(productLine, role, colors, playerSegment);

  const bg = joueurLive ? JOUEUR_SITE.bg : chrome.rootBackground;
  const border = joueurLive ? PLAYER_DARK.border : chrome.barBorderColor;

  return (
    <View
      style={[
        styles.root,
        {
          width: desktopShellChrome.sideRailWidth,
          paddingTop: Math.max(insets.top, spacing.md),
          paddingBottom: Math.max(insets.bottom, spacing.md),
          backgroundColor: bg,
          borderRightColor: border,
        },
      ]}
    >
      {tabItems.map((tab) => {
        const active = tab.id === activeTab;
        const icon = joueurLive
          ? (GAME_TAB_ICONS[tab.id] ?? 'star')
          : resolveTabIcon(tab.id, role, productLine);
        const badge = tab.id === 'messages' ? unreadCount : 0;
        const ink = resolveTabInkColors(active, false, accentInk, chrome.inactiveIcon);

        return (
          <PressableSpring
            key={tab.id}
            style={styles.tab}
            onPress={() => onTabPress(tab.id)}
            scaleTo={0.94}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.label}
          >
            <View
              style={[
                styles.iconWrap,
                active && { backgroundColor: `${accentInk}22` },
              ]}
            >
              <Icon
                name={icon}
                size={22}
                color={active ? ink.active : ink.inactive}
                variant={active ? 'filled' : 'outline'}
              />
              {badge > 0 ? (
                <View style={[styles.badge, { backgroundColor: chrome.badgeColor }]}>
                  <Text style={styles.badgeText}>{formatTabBadge(badge)}</Text>
                </View>
              ) : null}
            </View>
            <Text
              style={[
                styles.label,
                { color: active ? ink.active : ink.inactive },
                active && styles.labelActive,
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </PressableSpring>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRightWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  tab: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
  },
  iconWrap: {
    width: 44,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
    maxWidth: 72,
    textAlign: 'center',
  },
  labelActive: {
    fontWeight: '800',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    borderRadius: 8,
    minWidth: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#0A0A0F',
    fontSize: 8,
    fontWeight: '800',
  },
});
