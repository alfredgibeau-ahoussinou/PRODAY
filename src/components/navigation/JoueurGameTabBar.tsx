import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MainTabId } from '../../navigation/mainTabConfig';
import { getMobileRailLayout } from '../../navigation/mobileTabConfig';
import { PressableSpring } from '../motion/PressableSpring';
import { Icon } from '../ui/Icon';
import type { IconName } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useJoueurSession } from '../../context/JoueurSessionContext';
import { getJoueurGameTabLabel } from '../../content/joueurGameMenu';
import { formatTabBadge } from './tabBarShared';
import { JoueurGamePauseSheet } from './JoueurGamePauseSheet';
import { joueurGamePress, playJoueurSfxFireAndForget } from '../../features/joueur/joueurSfx';
import { spacing } from '../../theme/designTokens';

const PITCH = '#16A34A';
const DOCK = {
  bg: 'rgba(255,255,255,0.98)',
  border: 'rgba(15, 23, 42, 0.08)',
  dim: '#94A3B8',
  ink: '#0F172A',
};

const GAME_TAB_ICONS: Partial<Record<MainTabId, IconName>> = {
  home: 'football',
  recrutement: 'people',
  matchs: 'trophy',
  feed: 'star-four-points',
  profil: 'person',
  messages: 'chat',
  covoiturage: 'car',
  sante: 'heart',
  shop: 'bag',
  reels: 'videocam',
  famille: 'shield',
};

type Props = {
  activeTab: MainTabId;
  onTabPress: (tab: MainTabId) => void;
  unreadCount?: number;
  visibleTabs?: MainTabId[];
};

/** Dock joueur épuré — fond clair, accent vert discret. */
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
  const [pauseOpen, setPauseOpen] = useState(false);

  const ageGroup = session?.ageGroup;
  const role = profile?.role;

  const rail = useMemo(
    () => getMobileRailLayout(productLine, role, visibleTabs),
    [productLine, role, visibleTabs],
  );

  const slots = rail.flat ?? [];
  const overflow = rail.overflow ?? [];
  const pauseActive = overflow.includes(activeTab);

  useEffect(() => {
    if (pauseOpen) setPauseOpen(false);
  }, [activeTab]);

  const pressTab = (tab: MainTabId) => {
    if (tab === activeTab) {
      joueurGamePress();
      return;
    }
    playJoueurSfxFireAndForget('whoosh');
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
            active && { backgroundColor: 'rgba(22, 163, 74, 0.1)' },
          ]}
        >
          <Icon
            name={icon}
            size={20}
            color={active ? PITCH : DOCK.dim}
            variant={active ? 'filled' : 'outline'}
          />
          {badge > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{formatTabBadge(badge)}</Text>
            </View>
          ) : null}
        </View>
        <Text
          style={[
            styles.slotLabel,
            { color: active ? PITCH : DOCK.dim },
          ]}
          numberOfLines={1}
        >
          {label}
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
            paddingBottom: Math.max(insets.bottom, 8),
          },
        ]}
      >
        <View style={styles.dock}>
          <View style={styles.row}>
            {slots.map((t) => renderSlot(t))}
            {overflow.length > 0 ? (
              <PressableSpring
                onPress={() => {
                  joueurGamePress();
                  setPauseOpen(true);
                }}
                scaleTo={0.98}
                haptic
                style={styles.slot}
                accessibilityRole="button"
                accessibilityLabel="Menu"
                accessibilityState={{ selected: pauseActive }}
              >
                <View
                  style={[
                    styles.iconWrap,
                    pauseActive && { backgroundColor: 'rgba(22, 163, 74, 0.1)' },
                  ]}
                >
                  <Icon
                    name="menu"
                    size={20}
                    color={pauseActive ? PITCH : DOCK.dim}
                    variant={pauseActive ? 'filled' : 'outline'}
                  />
                </View>
                <Text
                  style={[
                    styles.slotLabel,
                    { color: pauseActive ? PITCH : DOCK.dim },
                  ]}
                >
                  {ageGroup === 'youth' ? 'Plus' : 'Menu'}
                </Text>
              </PressableSpring>
            ) : null}
          </View>
        </View>
      </View>

      <JoueurGamePauseSheet
        visible={pauseOpen}
        onClose={() => setPauseOpen(false)}
        tabs={overflow}
        activeTab={activeTab}
        unreadCount={unreadCount}
        accent={PITCH}
        accentBright={PITCH}
        ageGroup={session?.ageGroup}
        onSelect={(tab) => {
          setPauseOpen(false);
          playJoueurSfxFireAndForget('whoosh');
          onTabPress(tab);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: spacing.md,
    paddingTop: 0,
    backgroundColor: 'transparent',
  },
  dock: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    borderColor: DOCK.border,
    backgroundColor: DOCK.bg,
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slot: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    minWidth: 0,
    paddingVertical: 2,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotLabel: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    backgroundColor: PITCH,
  },
  badgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '700',
  },
});
