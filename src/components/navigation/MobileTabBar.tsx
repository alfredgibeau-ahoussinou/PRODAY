import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MainTabId } from '../../navigation/mainTabConfig';
import { getMobileRailLayout } from '../../navigation/mobileTabConfig';
import { PressableSpring } from '../motion/PressableSpring';
import { Icon } from '../ui/Icon';
import { TabOverflowSheet } from './TabOverflowSheet';
import { TabActiveIndicator } from './TabActiveIndicator';
import {
  formatTabBadge,
  resolveTabIcon,
  resolveTabInkColors,
} from './tabBarShared';
import { useAppTheme } from '../../context/ProductLineContext';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useTranslation } from '../../context/LocaleContext';
import { getTabShortLabel } from '../../content/poleExperience';
import { isSponsorRole, SPONSOR_THEME } from '../../content/sponsorExperience';
import { spacing, shadows } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';
import {
  getPoleTabBarChrome,
  resolveTabBarAccent,
} from '../../theme/poleTabBarTheme';

const BAR_HEIGHT = 62;
const SIDE_ICON = 24;
const CENTER_ICON = 28;

type MobileTabBarProps = {
  activeTab: MainTabId;
  onTabPress: (tab: MainTabId) => void;
  unreadCount?: number;
  visibleTabs?: MainTabId[];
};

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  activeTab,
  onTabPress,
  unreadCount = 0,
  visibleTabs,
}) => {
  const { colors, productLine } = useAppTheme();
  const { t } = useTranslation();
  const sessionProfile = useSessionProfile();
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);

  const role = sessionProfile?.role;
  const isSponsor = isSponsorRole(role);
  const immersive = activeTab === 'reels';

  const rail = useMemo(
    () => getMobileRailLayout(productLine, role, visibleTabs),
    [productLine, role, visibleTabs],
  );

  useEffect(() => {
    if (menuOpen) setMenuOpen(false);
  }, [activeTab]);

  const menuActive = rail.overflow.includes(activeTab);
  const chrome = useMemo(
    () => getPoleTabBarChrome(productLine, role),
    [productLine, role],
  );
  const accentInk = isSponsor
    ? SPONSOR_THEME.primary
    : resolveTabBarAccent(productLine, role, colors);

  const menuLabel = t('nav.menu');
  const menuA11y = t('nav.menuA11y');

  const dockBg = immersive ? 'rgba(0,0,0,0.94)' : colors.surface;
  const dockBorder = immersive ? 'rgba(255,255,255,0.1)' : colors.border;
  const rootBg = immersive ? '#000' : colors.background;

  const styles = useMemo(
    () => createStyles(colors, immersive, accentInk, chrome),
    [colors, immersive, accentInk, chrome],
  );

  const renderSideTab = (tab: MainTabId) => {
    const active = tab === activeTab;
    const icon = resolveTabIcon(tab, role);
    const label = getTabShortLabel(tab, productLine, role, t);
    const badge = tab === 'messages' ? unreadCount : 0;
    const ink = resolveTabInkColors(active, immersive, accentInk, colors.textMuted);

    return (
      <PressableSpring
        key={tab}
        style={styles.sideTab}
        onPress={() => onTabPress(tab)}
        scaleTo={0.94}
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
            <View
              style={[
                styles.badge,
                immersive && [styles.badgeImmersive, { backgroundColor: accentInk }],
              ]}
            >
              <Text style={styles.badgeText}>{formatTabBadge(badge)}</Text>
            </View>
          ) : null}
        </View>
        <Text
          style={[
            styles.sideLabel,
            active && styles.sideLabelActive,
            { color: active ? ink.active : ink.inactive },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </PressableSpring>
    );
  };

  const centerTab = rail.center;
  const centerActive = centerTab === activeTab;
  const centerLabel = centerTab
    ? getTabShortLabel(centerTab, productLine, role, t)
    : '';
  const centerIcon = centerTab ? resolveTabIcon(centerTab, role) : 'videocam';

  const renderMenuButton = () => {
    if (rail.overflow.length === 0) return null;
    const active = menuActive;
    const ink = resolveTabInkColors(active, immersive, accentInk, colors.textMuted);

    return (
      <PressableSpring
        style={styles.sideTab}
        onPress={() => setMenuOpen(true)}
        scaleTo={0.94}
        accessibilityRole="button"
        accessibilityLabel={menuA11y}
        accessibilityState={{ selected: active }}
      >
        <View style={styles.sideIconWrap}>
          <TabActiveIndicator active={active} color={ink.activePill} />
          <Icon
            name="menu"
            size={SIDE_ICON}
            color={active ? ink.active : ink.inactive}
            variant={active ? 'filled' : 'outline'}
          />
        </View>
        <Text
          style={[
            styles.sideLabel,
            active && styles.sideLabelActive,
            { color: active ? ink.active : ink.inactive },
          ]}
        >
          {menuLabel}
        </Text>
      </PressableSpring>
    );
  };

  return (
    <>
      <View
        style={[
          styles.root,
          {
            paddingBottom: Math.max(insets.bottom, spacing.sm),
            backgroundColor: rootBg,
          },
        ]}
      >
        <View
          style={[
            styles.bar,
            {
              backgroundColor: dockBg,
              borderColor: dockBorder,
              borderWidth: immersive ? 0 : chrome.barBorderWidth,
              paddingTop: centerTab
                ? Math.max(-chrome.centerButtonLift, spacing.xs)
                : spacing.xs,
            },
            chrome.barShadow && !immersive && shadows.soft,
          ]}
        >
          {!immersive && chrome.topAccentHeight > 0 ? (
            <View
              style={[
                styles.topAccent,
                {
                  height: chrome.topAccentHeight,
                  backgroundColor: chrome.topAccentColor,
                },
              ]}
            />
          ) : null}

          <View style={styles.leftCluster}>{rail.left.map(renderSideTab)}</View>

          {centerTab ? (
            <PressableSpring
              style={styles.centerWrap}
              onPress={() => onTabPress(centerTab)}
              scaleTo={0.94}
              accessibilityRole="tab"
              accessibilityState={{ selected: centerActive }}
              accessibilityLabel={centerLabel}
            >
              <View
                style={[
                  styles.centerBtn,
                  {
                    width: chrome.centerButtonSize,
                    height: chrome.centerButtonSize,
                    borderRadius: chrome.centerButtonSize / 2,
                    backgroundColor: chrome.centerButtonIdle,
                    borderWidth: chrome.centerButtonBorderWidth,
                    borderColor: chrome.centerButtonBorder,
                  },
                  centerActive && !immersive && { backgroundColor: accentInk },
                  immersive && [styles.centerBtnImmersive, { backgroundColor: accentInk }],
                  !immersive && shadows.interactive,
                ]}
              >
                <Icon
                  name={centerIcon}
                  size={CENTER_ICON}
                  color={centerActive || immersive ? '#fff' : colors.brandInverse}
                  variant="filled"
                />
              </View>
              <Text
                style={[
                  styles.centerLabel,
                  centerActive && styles.centerLabelActive,
                  immersive && { color: '#fff' },
                  centerActive && !immersive && { color: accentInk },
                ]}
              >
                {centerLabel}
              </Text>
            </PressableSpring>
          ) : (
            <View style={styles.centerSpacer} />
          )}

          <View style={styles.rightCluster}>
            {rail.right.map(renderSideTab)}
            {renderMenuButton()}
          </View>
        </View>
      </View>

      <TabOverflowSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        tabs={rail.overflow}
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
  c: AppColors,
  immersive: boolean,
  accent: string,
  chrome: ReturnType<typeof getPoleTabBarChrome>,
) {
  const pillInset = chrome.layout === 'pill' && !immersive ? spacing.md : spacing.sm;

  return StyleSheet.create({
    root: {
      paddingTop: spacing.xs,
      paddingHorizontal: pillInset,
    },
    bar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      minHeight: BAR_HEIGHT,
      borderRadius: immersive ? 0 : chrome.barBorderRadius,
      paddingHorizontal: spacing.xs,
      paddingBottom: spacing.xs,
      overflow: 'hidden',
    },
    topAccent: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
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
      minWidth: 56,
      maxWidth: 88,
      minHeight: 52,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xs,
      gap: 3,
    },
    sideIconWrap: {
      width: 44,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sideLabel: {
      fontSize: 10,
      fontWeight: '600',
      letterSpacing: 0.1,
      maxWidth: 76,
      textAlign: 'center',
    },
    sideLabelActive: {
      fontWeight: '800',
    },
    centerWrap: {
      width: 76,
      alignItems: 'center',
      marginTop: chrome.centerButtonLift,
      gap: 3,
      zIndex: 2,
    },
    centerSpacer: {
      width: 76,
    },
    centerBtn: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    centerBtnImmersive: {
      borderColor: 'rgba(255,255,255,0.2)',
    },
    centerLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: c.textMuted,
      letterSpacing: 0.1,
    },
    centerLabelActive: {
      color: accent,
      fontWeight: '800',
    },
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
      borderColor: immersive ? 'rgba(0,0,0,0.5)' : c.surface,
    },
    badgeImmersive: {
      borderColor: 'rgba(0,0,0,0.5)',
    },
    badgeText: {
      color: c.brandInverse,
      fontSize: 9,
      fontWeight: '800',
    },
  });
}
