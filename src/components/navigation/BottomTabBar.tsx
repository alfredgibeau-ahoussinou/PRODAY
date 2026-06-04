import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MAIN_TAB_ITEMS, type MainTabId } from '../../navigation/mainTabConfig';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { isGuestTabAllowed } from '../../navigation/guestAccess';
import { PressableSpring } from '../discover/PressableSpring';
import { Icon, type IconName } from '../ui/Icon';
import { motion } from '../../theme/motion';
import { useAppTheme } from '../../context/ProductLineContext';
import { colors as defaultColors, spacing, radius, shadows } from '../../theme/designTokens';

export { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';

const TAB_ICONS: Record<MainTabId, IconName> = {
  home: 'home',
  recrutement: 'search',
  matchs: 'handshake',
  feed: 'star-four-points',
  messages: 'chat',
  profil: 'person',
};

const TAB_SHORT_LABELS: Record<MainTabId, string> = {
  home: 'Accueil',
  recrutement: 'Mercato',
  matchs: 'Matchs',
  feed: 'Fil',
  messages: 'Messages',
  profil: 'Profil',
};

const DOCK_PAD = 4;
const PILL_INSET = 6;

interface BottomTabBarProps {
  activeTab: MainTabId;
  onTabPress: (tab: MainTabId) => void;
  unreadCount?: number;
  guestMode?: boolean;
}

/**
 * Barre d’onglets — dock flottant, pilule active (style accueil clair ProDay).
 */
export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onTabPress,
  unreadCount = 0,
  guestMode = false,
}) => {
  const { colors, isWoman } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [trackW, setTrackW] = useState(0);
  const tabW = trackW > 0 ? trackW / MAIN_TAB_ITEMS.length : 0;
  const activeIndex = MAIN_TAB_ITEMS.findIndex((t) => t.id === activeTab);
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

  return (
    <View
      style={[
        styles.root,
        {
          paddingBottom: Math.max(insets.bottom, spacing.sm),
          backgroundColor: colors.background,
        },
      ]}
    >
      {guestMode ? (
        <PressableSpring
          style={styles.guestBanner}
          onPress={() => onTabPress('profil')}
          scaleTo={0.99}
        >
          <Icon name="lock" size={14} color={colors.ink} />
          <Text style={styles.guestBannerText}>
            Connectez-vous pour publier, messagerie et profil complet
          </Text>
          <Icon name="chevron-forward" size={14} color={colors.inkMuted} />
        </PressableSpring>
      ) : null}

      <View style={styles.dockOuter}>
        <View
          style={[
            styles.dock,
            shadows.soft,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onLayout={onTrackLayout}
        >
          {tabW > 0 ? (
            <Animated.View
              style={[
                styles.activePill,
                pillStyle,
                isWoman && {
                  backgroundColor: colors.accentSoft,
                  borderColor: colors.accentMuted,
                },
              ]}
            />
          ) : null}

          {MAIN_TAB_ITEMS.map((tab) => {
            const active = tab.id === activeTab;
            const icon = TAB_ICONS[tab.id];
            const locked = guestMode && !isGuestTabAllowed(tab.id);
            const badge = !locked && tab.id === 'messages' ? unreadCount : 0;
            const label = TAB_SHORT_LABELS[tab.id];
            const tabOn = active && !locked;
            const accentInk = isWoman ? colors.accent : colors.ink;
            const iconColor = locked
              ? colors.textMuted
              : tabOn
                ? accentInk
                : colors.textMuted;

            return (
              <PressableSpring
                key={tab.id}
                style={styles.tab}
                onPress={() => onTabPress(tab.id)}
                scaleTo={locked ? 1 : 0.96}
                accessibilityRole="tab"
                accessibilityState={{ selected: active, disabled: locked }}
                accessibilityLabel={tab.label}
              >
                <View style={styles.iconRow}>
                  <Icon
                    name={locked ? 'lock' : icon}
                    size={20}
                    color={iconColor}
                    variant={tabOn ? 'filled' : 'outline'}
                  />
                  {badge > 0 ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {badge > 99 ? '99+' : badge > 9 ? '9+' : badge}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.label,
                    tabOn && { color: accentInk, fontWeight: '800' },
                    locked && styles.labelLocked,
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

const styles = StyleSheet.create({
  root: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: defaultColors.background,
  },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    backgroundColor: defaultColors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: defaultColors.border,
  },
  guestBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: defaultColors.textSecondary,
    lineHeight: 17,
  },
  dockOuter: {
    width: '100%',
  },
  dock: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 52,
    padding: DOCK_PAD,
    backgroundColor: defaultColors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: defaultColors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  activePill: {
    position: 'absolute',
    top: DOCK_PAD,
    left: 0,
    height: 52 - DOCK_PAD * 2,
    backgroundColor: defaultColors.surfaceMuted,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: defaultColors.border,
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
    backgroundColor: defaultColors.ink,
    borderRadius: 9,
    minWidth: 17,
    height: 17,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: defaultColors.surface,
  },
  badgeText: {
    color: defaultColors.brandInverse,
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 11,
  },
  label: {
    fontSize: MAIN_TAB_ITEMS.length > 6 ? 8 : MAIN_TAB_ITEMS.length > 5 ? 9 : 10,
    fontWeight: '600',
    color: defaultColors.textMuted,
    letterSpacing: 0.1,
  },
  labelActive: {
    color: defaultColors.ink,
    fontWeight: '800',
  },
  labelLocked: {
    opacity: 0.45,
  },
});
