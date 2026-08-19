import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
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
import { useJoueurSession } from '../../context/JoueurSessionContext';
import { JOUEUR_SITE } from '../../content/joueurPageIdentity';

const BAR_HEIGHT = 56;
const SIDE_ICON = 26;
const CENTER_ICON = 28;
const CLEAN_ICON = 28;

type MobileTabBarProps = {
  activeTab: MainTabId;
  onTabPress: (tab: MainTabId) => void;
  unreadCount?: number;
  visibleTabs?: MainTabId[];
};

/** Barre basse — style Instagram (clean) pour shells plats, rail classique sinon. */
export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  activeTab,
  onTabPress,
  unreadCount = 0,
  visibleTabs,
}) => {
  const { colors, productLine, playerSegment } = useAppTheme();
  const { t } = useTranslation();
  const sessionProfile = useSessionProfile();
  const joueurSession = useJoueurSession();
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);

  const role = sessionProfile?.role;
  const isSponsor = isSponsorRole(role);
  const immersive = activeTab === 'reels';
  const joueurLive =
    Boolean(joueurSession?.isJoueurPlayer && joueurSession.ready && !joueurSession.needsGate);

  const rail = useMemo(
    () => getMobileRailLayout(productLine, role, visibleTabs),
    [productLine, role, visibleTabs],
  );

  useEffect(() => {
    if (menuOpen) setMenuOpen(false);
  }, [activeTab]);

  const menuActive = rail.overflow.includes(activeTab);
  const chrome = useMemo(
    () => getPoleTabBarChrome(productLine, role, playerSegment),
    [productLine, role, playerSegment],
  );
  const clean = chrome.cleanStyle && !immersive;
  const accentInk = isSponsor
    ? SPONSOR_THEME.primary
    : joueurLive
      ? joueurSession!.identity.accent
      : resolveTabBarAccent(productLine, role, colors, playerSegment);

  const menuLabel = t('nav.menu');
  const menuA11y = t('nav.menuA11y');

  const dockBg = immersive
    ? 'rgba(0,0,0,0.94)'
    : joueurLive
      ? 'rgba(6,10,16,0.96)'
      : chrome.barBackground;
  const dockBorder = immersive
    ? 'rgba(255,255,255,0.1)'
    : joueurLive
      ? joueurSession!.identity.accent
      : chrome.barBorderColor;
  const rootBg = immersive || joueurLive ? JOUEUR_SITE.bg : chrome.rootBackground;
  const inactiveInk = joueurLive ? 'rgba(244,247,255,0.42)' : chrome.inactiveIcon;
  const activeInk = joueurLive ? accentInk : chrome.activeIcon;

  const styles = useMemo(
    () => createStyles(colors, immersive, accentInk, chrome),
    [colors, immersive, accentInk, chrome],
  );

  const renderSideTab = (tab: MainTabId, compact = false) => {
    const active = tab === activeTab;
    const icon = resolveTabIcon(tab, role, productLine);
    const label = getTabShortLabel(tab, productLine, role, t);
    const badge = tab === 'messages' ? unreadCount : 0;
    const ink = resolveTabInkColors(active, immersive, clean ? activeInk : accentInk, inactiveInk);

    return (
      <PressableSpring
        key={tab}
        testID={`main-tab-${tab}`}
        style={[
          styles.sideTab,
          compact && styles.sideTabCompact,
          rail.flat?.length ? styles.sideTabFlat : null,
          clean && styles.sideTabClean,
        ]}
        onPress={() => onTabPress(tab)}
        scaleTo={0.97}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        accessibilityLabel={label}
      >
        <View style={[styles.sideIconWrap, clean && styles.sideIconWrapClean]}>
          {!clean ? (
            <TabActiveIndicator active={active} color={ink.activePill} />
          ) : null}
          <Icon
            name={icon}
            size={clean ? CLEAN_ICON : compact ? 22 : SIDE_ICON}
            color={active ? ink.active : ink.inactive}
            variant={active ? 'filled' : 'outline'}
          />
          {badge > 0 ? (
            <View
              style={[
                styles.badge,
                clean && styles.badgeClean,
                immersive && [styles.badgeImmersive, { backgroundColor: accentInk }],
              ]}
            >
              {!clean ? (
                <Text style={styles.badgeText}>{formatTabBadge(badge)}</Text>
              ) : null}
            </View>
          ) : null}
        </View>
        {!clean ? (
          <Text
            style={[
              styles.sideLabel,
              compact && styles.sideLabelCompact,
              rail.flat?.length ? styles.sideLabelFlat : null,
              active && styles.sideLabelActive,
              { color: active ? ink.active : ink.inactive },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        ) : null}
      </PressableSpring>
    );
  };

  const centerTab = rail.center;
  const centerActive = centerTab === activeTab;
  const centerLabel = centerTab
    ? getTabShortLabel(centerTab, productLine, role, t)
    : '';
  const centerIcon = centerTab ? resolveTabIcon(centerTab, role, productLine) : 'videocam';

  const renderMenuButton = () => {
    if (rail.overflow.length === 0) return null;
    const active = menuActive;
    const ink = resolveTabInkColors(active, immersive, clean ? activeInk : accentInk, inactiveInk);
    const flat = Boolean(rail.flat?.length);

    return (
      <PressableSpring
        style={[
          styles.sideTab,
          flat && styles.sideTabFlat,
          clean && styles.sideTabClean,
        ]}
        onPress={() => setMenuOpen(true)}
        scaleTo={0.97}
        accessibilityRole="button"
        accessibilityLabel={menuA11y}
        accessibilityState={{ selected: active }}
      >
        <View style={[styles.sideIconWrap, clean && styles.sideIconWrapClean]}>
          {!clean ? (
            <TabActiveIndicator active={active} color={ink.activePill} />
          ) : null}
          <Icon
            name="menu"
            size={clean ? CLEAN_ICON : SIDE_ICON}
            color={active ? ink.active : ink.inactive}
            variant={active ? 'filled' : 'outline'}
          />
        </View>
        {!clean ? (
          <Text
            style={[
              styles.sideLabel,
              active && styles.sideLabelActive,
              { color: active ? ink.active : ink.inactive },
            ]}
          >
            {menuLabel}
          </Text>
        ) : null}
      </PressableSpring>
    );
  };

  return (
    <>
      <View
        style={[
          styles.root,
          clean && styles.rootClean,
          {
            paddingBottom: clean
              ? Math.max(insets.bottom, 4)
              : Math.max(insets.bottom, spacing.sm),
            backgroundColor: rootBg,
          },
        ]}
      >
        <View
          style={[
            styles.bar,
            clean && styles.barClean,
            {
              backgroundColor: dockBg,
              borderColor: dockBorder,
              borderWidth: immersive ? 0 : chrome.barBorderWidth,
              borderTopWidth: clean && !immersive ? StyleSheet.hairlineWidth : chrome.barBorderWidth,
              borderLeftWidth: clean ? 0 : chrome.barBorderWidth,
              borderRightWidth: clean ? 0 : chrome.barBorderWidth,
              borderBottomWidth: clean ? 0 : chrome.barBorderWidth,
              paddingTop: centerTab
                ? Math.max(-chrome.centerButtonLift, spacing.xs)
                : clean
                  ? 6
                  : spacing.xs,
            },
            chrome.barShadow && !immersive && !clean && shadows.soft,
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

          {rail.flat && rail.flat.length > 0 ? (
            <View style={[styles.flatRow, clean && styles.flatRowClean]}>
              {rail.flat.map((tab) => renderSideTab(tab, true))}
              {renderMenuButton()}
            </View>
          ) : (
            <>
              <View style={styles.leftCluster}>{rail.left.map((tab) => renderSideTab(tab))}</View>

              {centerTab ? (
                <PressableSpring
                  testID={`main-tab-${centerTab}`}
                  style={styles.centerWrap}
                  onPress={() => onTabPress(centerTab)}
                  scaleTo={0.97}
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
                      color="#000000"
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
                {rail.right.map((tab) => renderSideTab(tab))}
                {renderMenuButton()}
              </View>
            </>
          )}
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
  const clean = chrome.cleanStyle && !immersive;
  const pillInset = chrome.layout === 'pill' && !immersive && !clean ? spacing.md : 0;

  return StyleSheet.create({
    root: {
      paddingTop: spacing.xs,
      paddingHorizontal: pillInset,
    },
    rootClean: {
      paddingTop: 0,
      paddingHorizontal: 0,
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
    barClean: {
      minHeight: 50,
      borderRadius: 0,
      paddingHorizontal: 0,
      paddingBottom: Platform.OS === 'ios' ? 2 : 6,
      alignItems: 'center',
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
    sideTabCompact: {
      minWidth: 0,
      maxWidth: undefined,
      minHeight: 48,
      paddingHorizontal: 2,
    },
    sideTabFlat: {
      flex: 1,
    },
    sideTabClean: {
      minHeight: 44,
      gap: 0,
      paddingHorizontal: 0,
    },
    sideIconWrap: {
      width: 44,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sideIconWrapClean: {
      width: 48,
      height: 32,
    },
    sideLabel: {
      fontSize: 10,
      fontWeight: '600',
      letterSpacing: 0.1,
      maxWidth: 76,
      textAlign: 'center',
    },
    sideLabelCompact: {
      fontSize: 9,
      maxWidth: 64,
    },
    sideLabelFlat: {
      maxWidth: 72,
    },
    flatRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xs,
      paddingBottom: spacing.xs,
    },
    flatRowClean: {
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
      paddingBottom: 0,
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
    badgeClean: {
      top: -2,
      right: 2,
      minWidth: 8,
      height: 8,
      borderRadius: 4,
      paddingHorizontal: 0,
      borderWidth: 1.5,
      borderColor: '#000',
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
