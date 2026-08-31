import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MainTabId } from '../../navigation/mainTabConfig';
import { getMobileRailLayout } from '../../navigation/mobileTabConfig';
import { PressableSpring } from '../motion/PressableSpring';
import { Icon } from '../ui/Icon';
import type { IconName } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useJoueurSession } from '../../context/JoueurSessionContext';
import { usePlayerThemeColors } from '../../context/PlayerThemeContext';
import { getJoueurGameTabLabel } from '../../content/joueurGameMenu';
import { formatTabBadge } from './tabBarShared';
import { joueurGamePress } from '../../features/joueur/joueurSfx';
import { PLAYER_DARK, PLAYER_DARK_RADIUS } from '../../theme/playerDarkPremium';
import { spacing } from '../../theme/designTokens';

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
 * Dock joueur dark premium — 5 onglets, accent mint néon.
 */
export function JoueurGameTabBar({
  activeTab,
  onTabPress,
  unreadCount = 0,
  visibleTabs,
}: Props) {
  const { productLine } = useAppTheme();
  const profile = useSessionProfile();
  const session = useJoueurSession();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const compactLabels = screenWidth < 360;

  const playerTheme = usePlayerThemeColors();

  const accent = playerTheme.accent;
  const accentBright = playerTheme.accentAlt;
  const dimColor = PLAYER_DARK.textMuted;
  const role = profile?.role;

  const rail = useMemo(
    () => getMobileRailLayout(productLine, role, visibleTabs),
    [productLine, role, visibleTabs],
  );

  const slots = rail.flat ?? [];

  const pressTab = (tab: MainTabId) => {
    if (tab === activeTab) {
      joueurGamePress();
      return;
    }
    onTabPress(tab);
  };

  const renderSlot = (tab: MainTabId) => {
    const active = tab === activeTab;
    const label = getJoueurGameTabLabel(tab, session?.ageGroup);
    const icon = GAME_TAB_ICONS[tab] ?? 'star';
    const badge = tab === 'messages' ? unreadCount : 0;

    return (
      <PressableSpring
        key={tab}
        testID={`main-tab-${tab}`}
        onPress={() => pressTab(tab)}
        scaleTo={0.98}
        haptic
        style={styles.slot}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        accessibilityLabel={label}
      >
        <View
          style={[
            styles.iconWrap,
            active && {
              borderColor: accent,
              backgroundColor: playerTheme.accentSoft,
            },
          ]}
        >
          <Icon
            name={icon}
            size={22}
            color={active ? accentBright : dimColor}
            variant={active ? 'filled' : 'outline'}
          />
          {badge > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{formatTabBadge(badge)}</Text>
            </View>
          ) : null}
        </View>
        {!compactLabels ? (
          <Text
            style={[
              styles.slotLabel,
              { color: active ? accentBright : dimColor },
            ]}
            adjustsFontSizeToFit
            minimumFontScale={0.82}
            numberOfLines={1}
          >
            {label}
          </Text>
        ) : null}
        {active ? <View style={[styles.activeLine, { backgroundColor: accent }]} /> : null}
      </PressableSpring>
    );
  };

  return (
    <View
      style={[
        styles.root,
        {
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
    >
      <View style={styles.dock}>
        <View style={styles.row}>{slots.map((t) => renderSlot(t))}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: spacing.md,
    paddingTop: 0,
    backgroundColor: 'transparent',
  },
  dock: {
    borderWidth: 1,
    borderRadius: PLAYER_DARK_RADIUS.dock,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 8,
    overflow: 'visible',
    backgroundColor: PLAYER_DARK.dockBg,
    borderColor: PLAYER_DARK.dockBorder,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.4,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 10 },
      default: {},
    }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  slot: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
    paddingBottom: 2,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  slotLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    width: '100%',
    textAlign: 'center',
  },
  activeLine: {
    width: 18,
    height: 2,
    borderRadius: 1,
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    backgroundColor: PLAYER_DARK.statYellow,
  },
  badgeText: {
    color: PLAYER_DARK.bg,
    fontSize: 8,
    fontWeight: '900',
  },
});
