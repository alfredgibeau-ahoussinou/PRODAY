import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MainTabId } from '../../navigation/mainTabConfig';
import { PressableSpring } from '../motion/PressableSpring';
import { Icon } from '../ui/Icon';
import { TabActiveIndicator } from './TabActiveIndicator';
import { TabOverflowSheet } from './TabOverflowSheet';
import {
  formatTabBadge,
  resolveTabIcon,
  resolveTabInkColors,
} from './tabBarShared';
import { useAppTheme } from '../../context/ProductLineContext';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useTranslation } from '../../context/LocaleContext';
import { getTabShortLabel } from '../../content/poleExperience';
import { spacing, shadows } from '../../theme/designTokens';
import { getPoleTabBarChrome, resolveTabBarAccent } from '../../theme/poleTabBarTheme';
import { SUPPORTER_SITE } from '../../content/supporterPageIdentity';
import { SupporterLiveTabButton } from './SupporterLiveTabButton';

const BAR_HEIGHT = 56;
const SIDE_ICON = 26;

type Props = {
  activeTab: MainTabId;
  onTabPress: (tab: MainTabId) => void;
  onLivePress: () => void;
  unreadCount?: number;
  visibleTabs?: MainTabId[];
  overflowTabs?: MainTabId[];
};

/** Barre supporter V2 — 4 slots + FAB LIVE centre (distinct du dock joueur). */
export const SupporterMediaTabBar: React.FC<Props> = ({
  activeTab,
  onTabPress,
  onLivePress,
  unreadCount = 0,
  visibleTabs = ['home', 'matchs', 'feed', 'reels', 'profil'],
  overflowTabs = ['messages'],
}) => {
  const { colors, productLine } = useAppTheme();
  const sessionProfile = useSessionProfile();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const role = sessionProfile?.role;
  const chrome = useMemo(
    () => getPoleTabBarChrome(productLine, role),
    [productLine, role],
  );
  const accentInk = resolveTabBarAccent(productLine, role, colors);
  const inactiveInk = chrome.inactiveIcon;
  const activeInk = chrome.activeIcon;

  const leftTabs = visibleTabs.filter((t) => t === 'home' || t === 'matchs');
  const rightTabs = visibleTabs.filter((t) => t === 'feed' || t === 'reels' || t === 'profil');
  const liveActive = activeTab === 'matchs';

  const styles = useMemo(
    () => createStyles(colors, accentInk, chrome),
    [colors, accentInk, chrome],
  );

  const renderTab = (tab: MainTabId) => {
    const active = tab === activeTab;
    const icon = resolveTabIcon(tab, role, productLine);
    const label = getTabShortLabel(tab, productLine, role, t);
    const badge = tab === 'messages' ? unreadCount : 0;
    const ink = resolveTabInkColors(active, false, activeInk, inactiveInk);

    return (
      <PressableSpring
        key={tab}
        testID={`main-tab-${tab}`}
        style={styles.sideTab}
        onPress={() => onTabPress(tab)}
        scaleTo={0.97}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        accessibilityLabel={label}
      >
        <View style={styles.sideIconWrap}>
          <TabActiveIndicator active={active} color={ink.activePill} />
          <Icon
            name={icon}
            size={SIDE_ICON}
            color={active ? ink.active : ink.inactive}
            variant={active ? 'filled' : 'outline'}
          />
          {badge > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{formatTabBadge(badge)}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.sideLabel, active && styles.sideLabelActive, { color: active ? ink.active : ink.inactive }]}>
          {label}
        </Text>
      </PressableSpring>
    );
  };

  return (
    <>
      <View style={[styles.root, { paddingBottom: Math.max(insets.bottom, spacing.sm), backgroundColor: SUPPORTER_SITE.bg }]}>
        <View style={[styles.bar, { backgroundColor: chrome.barBackground, borderColor: chrome.barBorderColor }, shadows.soft]}>
          <View style={styles.leftCluster}>{leftTabs.map(renderTab)}</View>
          <SupporterLiveTabButton active={liveActive} onPress={onLivePress} />
          <View style={styles.rightCluster}>
            {rightTabs.map(renderTab)}
            {overflowTabs.length > 0 ? (
              <PressableSpring
                style={styles.sideTab}
                onPress={() => setMenuOpen(true)}
                scaleTo={0.97}
                accessibilityRole="button"
                accessibilityLabel={t('nav.menu')}
              >
                <View style={styles.sideIconWrap}>
                  <Icon name="menu" size={SIDE_ICON} color={inactiveInk} variant="outline" />
                </View>
                <Text style={[styles.sideLabel, { color: inactiveInk }]}>{t('nav.menu')}</Text>
              </PressableSpring>
            ) : null}
          </View>
        </View>
      </View>
      <TabOverflowSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        tabs={overflowTabs}
        activeTab={activeTab}
        productLine={productLine}
        role={role}
        onSelect={onTabPress}
        unreadCount={unreadCount}
      />
    </>
  );
};

function createStyles(
  c: ReturnType<typeof useAppTheme>['colors'],
  accent: string,
  chrome: ReturnType<typeof getPoleTabBarChrome>,
) {
  return StyleSheet.create({
    root: { paddingTop: spacing.xs },
    bar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      minHeight: BAR_HEIGHT,
      borderRadius: chrome.barBorderRadius,
      borderWidth: chrome.barBorderWidth,
      paddingHorizontal: spacing.xs,
      paddingBottom: spacing.xs,
      paddingTop: spacing.xs,
    },
    leftCluster: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      alignItems: 'flex-end',
    },
    rightCluster: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      alignItems: 'flex-end',
    },
    sideTab: {
      minWidth: 48,
      maxWidth: 72,
      minHeight: 52,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 2,
      gap: 3,
    },
    sideIconWrap: {
      width: 44,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sideLabel: {
      fontSize: 9,
      fontWeight: '600',
      letterSpacing: 0.1,
      maxWidth: 64,
      textAlign: 'center',
    },
    sideLabelActive: { fontWeight: '800', color: accent },
    badge: {
      position: 'absolute',
      top: -3,
      right: -4,
      minWidth: 17,
      height: 17,
      borderRadius: 9,
      backgroundColor: chrome.badgeColor,
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
