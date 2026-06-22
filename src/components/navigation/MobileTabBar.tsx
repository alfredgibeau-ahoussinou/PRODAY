import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MainTabId } from '../../navigation/mainTabConfig';
import { getMobileRailLayout } from '../../navigation/mobileTabConfig';
import { PressableSpring } from '../motion/PressableSpring';
import { motion } from '../../theme/motion';
import { Icon, type IconName } from '../ui/Icon';
import { TabOverflowSheet } from './TabOverflowSheet';
import { useAppTheme } from '../../context/ProductLineContext';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useTranslation } from '../../context/LocaleContext';
import { getTabShortLabel } from '../../content/poleExperience';
import {
  getPhysioTabIcon,
  isMedicalPractitionerRole,
} from '../../content/medicalExperience';
import {
  getSponsorTabIcon,
  isSponsorRole,
  SPONSOR_THEME,
} from '../../content/sponsorExperience';
import { spacing, shadows } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';
import {
  getPoleTabBarChrome,
  resolveTabBarAccent,
} from '../../theme/poleTabBarTheme';

const TAB_ICONS: Record<MainTabId, IconName> = {
  home: 'home',
  recrutement: 'search',
  matchs: 'handshake',
  covoiturage: 'car',
  sante: 'heart',
  feed: 'star-four-points',
  reels: 'videocam',
  famille: 'shield',
  messages: 'chat',
  profil: 'person',
  shop: 'bag',
};

const TabActiveGlow: React.FC<{
  active: boolean;
  immersive: boolean;
  accent: string;
}> = ({ active, immersive, accent }) => {
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(active ? 1 : 0, motion.spring.snappy);
  }, [active, progress]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: progress.value * (immersive ? 0.28 : 0.16),
    transform: [{ scale: 0.88 + progress.value * 0.12 }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: 44,
          height: 32,
          borderRadius: 16,
          backgroundColor: immersive ? '#fff' : accent,
        },
        glowStyle,
      ]}
    />
  );
};

const BAR_HEIGHT = 62;
const SIDE_ICON = 26;
const CENTER_ICON = 30;

type MobileTabBarProps = {
  activeTab: MainTabId;
  onTabPress: (tab: MainTabId) => void;
  unreadCount?: number;
  visibleTabs?: MainTabId[];
};

function resolveIcon(
  tab: MainTabId,
  isPhysio: boolean,
  isSponsor: boolean,
): IconName {
  if (isPhysio) return getPhysioTabIcon(tab);
  if (isSponsor) return getSponsorTabIcon(tab);
  return TAB_ICONS[tab];
}

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
  const isPhysio = isMedicalPractitionerRole(role);
  const isSponsor = isSponsorRole(role);
  const immersive = activeTab === 'reels';

  const rail = useMemo(
    () => getMobileRailLayout(productLine, role, visibleTabs),
    [productLine, role, visibleTabs],
  );

  const menuActive = rail.overflow.includes(activeTab);
  const chrome = useMemo(
    () => getPoleTabBarChrome(productLine, role),
    [productLine, role],
  );
  const accentInk = isSponsor
    ? SPONSOR_THEME.primary
    : resolveTabBarAccent(productLine, role, colors);

  const dockBg = immersive ? 'rgba(0,0,0,0.94)' : colors.surface;
  const dockBorder = immersive ? 'rgba(255,255,255,0.1)' : colors.border;
  const rootBg = immersive ? '#000' : colors.background;

  const styles = useMemo(
    () => createStyles(colors, immersive, accentInk, chrome),
    [colors, immersive, accentInk, chrome],
  );

  const renderSideTab = (tab: MainTabId) => {
    const active = tab === activeTab;
    const icon = resolveIcon(tab, isPhysio, isSponsor);
    const label = getTabShortLabel(tab, productLine, role, t);
    const badge = tab === 'messages' ? unreadCount : 0;
    const ink = active
      ? immersive
        ? '#fff'
        : accentInk
      : immersive
        ? 'rgba(255,255,255,0.78)'
        : colors.textMuted;

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
          <TabActiveGlow active={active} immersive={immersive} accent={accentInk} />
          <Icon
            name={icon}
            size={SIDE_ICON}
            color={ink}
            variant={active ? 'filled' : 'outline'}
          />
          {badge > 0 ? (
            <View
              style={[
                styles.badge,
                immersive && [styles.badgeImmersive, { backgroundColor: accentInk }],
              ]}
            >
              <Text style={styles.badgeText}>
                {badge > 99 ? '99+' : badge > 9 ? '9+' : badge}
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.sideLabel, active && styles.sideLabelActive, { color: ink }]} numberOfLines={1}>
          {label}
        </Text>
      </PressableSpring>
    );
  };

  const centerTab = rail.center;
  const centerActive = centerTab === activeTab;
  const centerIcon = centerTab
    ? resolveIcon(centerTab, isPhysio, isSponsor)
    : 'videocam';

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
          <View style={styles.leftCluster}>
            {rail.left.map(renderSideTab)}
          </View>

          {centerTab ? (
            <PressableSpring
              style={styles.centerWrap}
              onPress={() => onTabPress(centerTab)}
              scaleTo={0.94}
              accessibilityRole="tab"
              accessibilityState={{ selected: centerActive }}
              accessibilityLabel="Reels"
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
                  centerActive && styles.centerBtnActive,
                  immersive && [styles.centerBtnImmersive, { backgroundColor: accentInk }],
                  !immersive && centerActive && { backgroundColor: accentInk },
                  !immersive && shadows.soft,
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
                ]}
              >
                Reels
              </Text>
            </PressableSpring>
          ) : (
            <View style={styles.centerWrap} />
          )}

          <View style={styles.rightCluster}>
            {rail.right.map(renderSideTab)}
            {rail.overflow.length > 0 ? (
              <PressableSpring
                style={styles.sideTab}
                onPress={() => setMenuOpen(true)}
                scaleTo={0.94}
                accessibilityRole="button"
                accessibilityLabel="Menu navigation"
                accessibilityState={{ selected: menuActive }}
              >
                <View style={styles.sideIconWrap}>
                  <Icon
                    name="menu"
                    size={SIDE_ICON}
                    color={
                      menuActive
                        ? immersive
                          ? '#fff'
                          : accentInk
                        : immersive
                          ? 'rgba(255,255,255,0.78)'
                          : colors.textMuted
                    }
                    variant={menuActive ? 'filled' : 'outline'}
                  />
                </View>
                <Text
                  style={[
                    styles.sideLabel,
                    menuActive && styles.sideLabelActive,
                    {
                      color: menuActive
                        ? immersive
                          ? '#fff'
                          : accentInk
                        : immersive
                          ? 'rgba(255,255,255,0.78)'
                          : colors.textMuted,
                    },
                  ]}
                >
                  Menu
                </Text>
              </PressableSpring>
            ) : null}
          </View>
        </View>
      </View>

      <TabOverflowSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        tabs={rail.overflow}
        activeTab={activeTab}
        tabIcons={TAB_ICONS}
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
    },
    rightCluster: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-evenly',
    },
    sideTab: {
      minWidth: 64,
      minHeight: 52,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xs,
      gap: 4,
    },
    sideIconWrap: {
      width: 36,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sideLabel: {
      fontSize: 11,
      fontWeight: '600',
      maxWidth: 72,
      textAlign: 'center',
    },
    sideLabelActive: {
      fontWeight: '800',
    },
    centerWrap: {
      width: 80,
      alignItems: 'center',
      marginTop: chrome.centerButtonLift,
      gap: 4,
    },
    centerBtn: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    centerBtnActive: {
      backgroundColor: accent,
    },
    centerBtnImmersive: {
      borderColor: 'rgba(255,255,255,0.2)',
    },
    centerLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: c.textMuted,
    },
    centerLabelActive: {
      color: accent,
      fontWeight: '800',
    },
    badge: {
      position: 'absolute',
      top: -2,
      right: -8,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: chrome.badgeColor,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
      borderWidth: 2,
      borderColor: c.surface,
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
