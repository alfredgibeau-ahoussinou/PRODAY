import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MAIN_TAB_ITEMS, type MainTabId } from '../../navigation/mainTabConfig';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { PressableSpring } from '../discover/PressableSpring';
import { Icon, type IconName } from '../ui/Icon';
import { motion } from '../../theme/motion';
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
import { spacing, radius, shadows } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

export { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';

const TAB_ICONS: Record<MainTabId, IconName> = {
  home: 'home',
  recrutement: 'search',
  matchs: 'handshake',
  covoiturage: 'car',
  sante: 'heart',
  feed: 'star-four-points',
  messages: 'chat',
  profil: 'person',
  shop: 'bag',
};

const TAB_SHORT_LABELS: Record<MainTabId, string> = {
  home: 'Accueil',
  recrutement: 'Mercato',
  matchs: 'Matchs',
  covoiturage: 'Covoiturage',
  sante: 'Santé',
  feed: 'Fil',
  messages: 'Messages',
  profil: 'Profil',
  shop: 'Shop',
};

const DOCK_PAD = 4;
const PILL_INSET = 6;

interface BottomTabBarProps {
  activeTab: MainTabId;
  onTabPress: (tab: MainTabId) => void;
  unreadCount?: number;
}

/**
 * Barre d’onglets — dock flottant, pilule active (style accueil clair ProDay).
 */
export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onTabPress,
  unreadCount = 0,
}) => {
  const { colors, isWoman, productLine } = useAppTheme();
  const sessionProfile = useSessionProfile();
  const insets = useSafeAreaInsets();
  const [trackW, setTrackW] = useState(0);
  const visibleTabIds = useMemo(
    () => getVisibleMainTabs(productLine, sessionProfile?.role),
    [productLine, sessionProfile?.role]
  );
  const tabItems = useMemo(
    () => MAIN_TAB_ITEMS.filter((t) => visibleTabIds.includes(t.id)),
    [visibleTabIds]
  );
  const role = sessionProfile?.role;
  const isPhysio = isMedicalPractitionerRole(role);
  const isSponsor = isSponsorRole(role);
  const tabW = trackW > 0 ? trackW / tabItems.length : 0;
  const activeIndex = tabItems.findIndex((t) => t.id === activeTab);
  const pillX = useSharedValue(0);

  useEffect(() => {
    if (tabW > 0) {
      pillX.value = withSpring(activeIndex * tabW, motion.spring.snappy);
    }
  }, [activeIndex, tabW, pillX]);

  const pillStyle = useAnimatedStyle(() => ({
    width: Math.max(0, tabW - PILL_INSET * 2),
    transform: [{ translateX: pillX.value + PILL_INSET }],
  }));

  const onTrackLayout = (e: LayoutChangeEvent) => {
    setTrackW(e.nativeEvent.layout.width);
  };

  const dockBg = isSponsor ? SPONSOR_THEME.surface : colors.surface;
  const dockBorder = isSponsor ? SPONSOR_THEME.border : colors.border;
  const rootBg = isSponsor ? SPONSOR_THEME.background : colors.background;
  const staticStyles = useMemo(() => createTabBarStyles(colors), [colors]);

  return (
    <View
      style={[
        staticStyles.root,
        {
          paddingBottom: Math.max(insets.bottom, spacing.sm),
          backgroundColor: rootBg,
        },
      ]}
    >
      <View style={staticStyles.dockOuter}>
        <View
          style={[
            staticStyles.dock,
            shadows.soft,
            { backgroundColor: dockBg, borderColor: dockBorder },
          ]}
          onLayout={onTrackLayout}
        >
          {tabW > 0 ? (
            <Animated.View
              style={[
                staticStyles.activePill,
                pillStyle,
                isPhysio
                  ? {
                      backgroundColor: MEDICAL_THEME.primarySoft,
                      borderColor: MEDICAL_THEME.primaryBorder,
                    }
                  : isSponsor
                    ? {
                        backgroundColor: SPONSOR_THEME.primarySoft,
                        borderColor: SPONSOR_THEME.primaryBorder,
                      }
                    : isWoman && {
                        backgroundColor: colors.accentSoft,
                        borderColor: colors.accentMuted,
                      },
              ]}
            />
          ) : null}

          {tabItems.map((tab) => {
            const active = tab.id === activeTab;
            const icon = isPhysio
              ? getPhysioTabIcon(tab.id)
              : isSponsor
                ? getSponsorTabIcon(tab.id)
                : TAB_ICONS[tab.id];
            const badge = tab.id === 'messages' ? unreadCount : 0;
            const label = getTabShortLabel(tab.id, productLine, role) || TAB_SHORT_LABELS[tab.id];
            const tabOn = active;
            const accentInk = isPhysio
              ? MEDICAL_THEME.primary
              : isSponsor
                ? SPONSOR_THEME.primary
                : isWoman
                  ? colors.accent
                  : colors.ink;
            const iconColor = tabOn
              ? accentInk
              : isSponsor
                ? SPONSOR_THEME.textMuted
                : colors.textMuted;

            return (
              <PressableSpring
                key={tab.id}
                style={staticStyles.tab}
                onPress={() => onTabPress(tab.id)}
                scaleTo={0.96}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={label}
              >
                <View style={staticStyles.iconRow}>
                  <Icon
                    name={icon}
                    size={20}
                    color={iconColor}
                    variant={tabOn ? 'filled' : 'outline'}
                  />
                  {badge > 0 ? (
                    <View style={staticStyles.badge}>
                      <Text style={staticStyles.badgeText}>
                        {badge > 99 ? '99+' : badge > 9 ? '9+' : badge}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text
                  style={[
                    staticStyles.label,
                    {
                      fontSize:
                        tabItems.length > 5 ? 9 : tabItems.length > 4 ? 9 : 10,
                    },
                    tabOn && { color: accentInk, fontWeight: '800' },
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </PressableSpring>
            );
          })}
        </View>
      </View>
    </View>
  );
};

function createTabBarStyles(c: AppColors) {
  return StyleSheet.create({
    root: {
      paddingTop: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    dockOuter: {
      width: '100%',
    },
    dock: {
      flexDirection: 'row',
      alignItems: 'stretch',
      minHeight: 52,
      padding: DOCK_PAD,
      borderRadius: radius.xl,
      borderWidth: 1,
      position: 'relative',
      overflow: 'hidden',
    },
    activePill: {
      position: 'absolute',
      top: DOCK_PAD,
      left: 0,
      height: 52 - DOCK_PAD * 2,
      backgroundColor: c.surfaceMuted,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xs,
      gap: 2,
      zIndex: 1,
    },
    iconRow: {
      width: 26,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badge: {
      position: 'absolute',
      top: -3,
      right: -8,
      backgroundColor: c.ink,
      borderRadius: 9,
      minWidth: 17,
      height: 17,
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
      lineHeight: 11,
    },
    label: {
      fontSize: 10,
      fontWeight: '600',
      color: c.textMuted,
      letterSpacing: 0.1,
    },
  });
}
