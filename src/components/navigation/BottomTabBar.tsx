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
import { colors, spacing } from '../../theme/designTokens';

export { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';

const TAB_ICONS: Record<MainTabId, IconName> = {
  home: 'home',
  recrutement: 'search',
  matchs: 'handshake',
  messages: 'chat',
  profil: 'person',
};

/** Libellés courts pour la barre (évite le texte tronqué). */
const TAB_SHORT_LABELS: Record<MainTabId, string> = {
  home: 'Accueil',
  recrutement: 'Mercato',
  matchs: 'Matchs',
  messages: 'Messages',
  profil: 'Profil',
};

interface BottomTabBarProps {
  activeTab: MainTabId;
  onTabPress: (tab: MainTabId) => void;
  unreadCount?: number;
  guestMode?: boolean;
}

/**
 * Barre d’onglets — style maquettes ProDay : pleine largeur, trait actif en haut.
 */
export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onTabPress,
  unreadCount = 0,
  guestMode = false,
}) => {
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(0);
  const tabWidth = barWidth > 0 ? barWidth / MAIN_TAB_ITEMS.length : 0;
  const activeIndex = MAIN_TAB_ITEMS.findIndex((t) => t.id === activeTab);
  const indicatorX = useSharedValue(0);

  useEffect(() => {
    if (tabWidth > 0) {
      indicatorX.value = withSpring(activeIndex * tabWidth, motion.spring.smooth);
    }
  }, [activeIndex, tabWidth, indicatorX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: tabWidth,
  }));

  const onBarLayout = (e: LayoutChangeEvent) => {
    setBarWidth(e.nativeEvent.layout.width);
  };

  return (
    <View style={[styles.root, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {guestMode ? (
        <PressableSpring
          style={styles.guestBanner}
          onPress={() => onTabPress('profil')}
          scaleTo={0.99}
        >
          <Icon name="lock" size={14} color={colors.accent} />
          <Text style={styles.guestBannerText}>
            Connectez-vous pour Mercato, Matchs et Messages
          </Text>
          <Icon name="chevron-forward" size={14} color={colors.accent} />
        </PressableSpring>
      ) : null}

      <View style={styles.bar} onLayout={onBarLayout}>
        {tabWidth > 0 ? (
          <Animated.View style={[styles.topIndicator, indicatorStyle]} />
        ) : null}

        {MAIN_TAB_ITEMS.map((tab) => {
          const active = tab.id === activeTab;
          const icon = TAB_ICONS[tab.id];
          const locked = guestMode && !isGuestTabAllowed(tab.id);
          const badge = !locked && tab.id === 'messages' ? unreadCount : 0;
          const label = TAB_SHORT_LABELS[tab.id];

          return (
            <PressableSpring
              key={tab.id}
              style={styles.tab}
              onPress={() => onTabPress(tab.id)}
              scaleTo={locked ? 1 : 0.92}
              accessibilityRole="tab"
              accessibilityState={{ selected: active, disabled: locked }}
              accessibilityLabel={
                locked ? `${tab.label} — connexion requise` : tab.label
              }
            >
              <View style={styles.iconRow}>
                <Icon
                  name={locked ? 'lock' : icon}
                  size={22}
                  color={
                    locked
                      ? colors.textMuted
                      : active
                        ? colors.accent
                        : colors.textMuted
                  }
                  variant={active && !locked ? 'filled' : 'outline'}
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
                  active && !locked && styles.labelActive,
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
  );
};

const BAR_HEIGHT = 56;

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.accentSoft,
    borderBottomWidth: 1,
    borderBottomColor: colors.accentMuted,
  },
  guestBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
    lineHeight: 16,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: BAR_HEIGHT,
    paddingTop: 4,
    paddingBottom: 6,
    position: 'relative',
  },
  topIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 3,
    backgroundColor: colors.accent,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    gap: 3,
  },
  iconRow: {
    width: 28,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -6,
    backgroundColor: colors.accent,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  badgeText: {
    color: colors.brandInverse,
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 11,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: -0.2,
  },
  labelActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  labelLocked: {
    opacity: 0.4,
  },
});
