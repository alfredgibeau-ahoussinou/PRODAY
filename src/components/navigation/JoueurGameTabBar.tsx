import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MainTabId } from '../../navigation/mainTabConfig';
import { getMobileRailLayout } from '../../navigation/mobileTabConfig';
import { PressableSpring } from '../motion/PressableSpring';
import { Icon } from '../ui/Icon';
import type { IconName } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useJoueurSession } from '../../context/JoueurSessionContext';
import { JOUEUR_SITE } from '../../content/joueurPageIdentity';
import { getJoueurGameTabLabel } from '../../content/joueurGameMenu';
import { formatTabBadge } from './tabBarShared';
import { JoueurGamePauseSheet } from './JoueurGamePauseSheet';
import { joueurGamePress, playJoueurSfxFireAndForget } from '../../features/joueur/joueurSfx';
import { useJoueurProgress } from '../../context/JoueurProgressContext';
import { JoueurXpBar } from '../player/joueurPortalUi';
import { spacing } from '../../theme/designTokens';

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

/**
 * Dock Ultimate Team — barre glass premium, pas pad arcade.
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
  const progressApi = useJoueurProgress();
  const insets = useSafeAreaInsets();
  const [pauseOpen, setPauseOpen] = useState(false);

  const identity = session?.identity;
  const accent = identity?.accent ?? '#4C8BFF';
  const accentBright = identity?.accentBright ?? '#93C5FD';
  const ageGroup = session?.ageGroup;
  const isYouth = ageGroup === 'youth';
  const isTeen = ageGroup === 'teen';
  const role = profile?.role;
  const level = progressApi?.level;
  const stars = progressApi?.progress.stars ?? 0;
  const dockBg = isYouth
    ? 'rgba(255,248,228,0.97)'
    : isTeen
      ? 'rgba(12,18,28,0.96)'
      : 'rgba(10,14,22,0.96)';
  const dimColor = isYouth
    ? identity?.inkMuted ?? 'rgba(63,42,10,0.55)'
    : JOUEUR_SITE.dim;
  const dockBorder = isYouth
    ? identity?.border ?? 'rgba(63,42,10,0.14)'
    : JOUEUR_SITE.border;
  const labelActive = isYouth ? identity?.ink ?? '#3F2A0A' : accentBright;

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
    const isHome = tab === 'home';

    return (
      <PressableSpring
        key={tab}
        testID={`main-tab-${tab}`}
        onPress={() => pressTab(tab)}
        scaleTo={0.97}
        haptic
        style={[styles.slot, isHome && styles.slotHome]}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        accessibilityLabel={label}
      >
        <View
          style={[
            isHome ? styles.homeOrb : styles.iconWrap,
            {
              borderColor: active ? accent : 'transparent',
              backgroundColor: active
                ? identity?.soft ?? 'rgba(76,139,255,0.18)'
                : isHome
                  ? 'rgba(255,255,255,0.06)'
                  : 'transparent',
            },
          ]}
        >
          <Icon
            name={icon}
            size={isHome ? (isYouth ? 24 : 22) : isYouth ? 22 : 20}
            color={active ? (isYouth ? accent : accentBright) : dimColor}
            variant={active ? 'filled' : 'outline'}
          />
          {badge > 0 ? (
            <View style={[styles.badge, { backgroundColor: JOUEUR_SITE.live }]}>
              <Text style={styles.badgeText}>{formatTabBadge(badge)}</Text>
            </View>
          ) : null}
        </View>
        <Text
          style={[
            styles.slotLabel,
            {
              color: active ? labelActive : dimColor,
              fontSize: isYouth ? 9 : 8,
            },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {active ? <View style={[styles.activeDot, { backgroundColor: accent }]} /> : null}
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
        <View
          style={[
            styles.dock,
            {
              borderColor: dockBorder,
              backgroundColor: dockBg,
              borderRadius: isYouth ? 28 : isTeen ? 18 : 22,
              borderWidth: 1,
            },
          ]}
        >
          {progressApi?.ready ? (
            <View style={styles.hudStrip}>
              <Text style={[styles.hudLvl, { color: isYouth ? identity?.ink ?? accent : accentBright }]}>
                {isYouth ? `NIV ${level?.level ?? 1}` : isTeen ? `DIV ${level?.level ?? 1}` : `LVL ${level?.level ?? 1}`}
              </Text>
              <View style={styles.hudXp}>
                <JoueurXpBar
                  value={level?.xpIntoLevel ?? 0}
                  max={level?.xpForNext ?? 100}
                  color={accent}
                />
              </View>
              <Text style={[styles.hudStars, isYouth && { color: accent }]}>★ {stars}</Text>
            </View>
          ) : null}
          <View style={styles.row}>
            {slots.map((t) => renderSlot(t))}
            {overflow.length > 0 ? (
              <PressableSpring
                onPress={() => {
                  joueurGamePress();
                  setPauseOpen(true);
                }}
                scaleTo={0.97}
                haptic
                style={styles.slot}
                accessibilityRole="button"
                accessibilityLabel="Menu"
                accessibilityState={{ selected: pauseActive }}
              >
                <View
                  style={[
                    styles.iconWrap,
                    {
                      borderColor: pauseActive ? accent : 'transparent',
                      backgroundColor: pauseActive
                        ? identity?.soft ?? 'rgba(76,139,255,0.18)'
                        : 'transparent',
                    },
                  ]}
                >
                  <Icon
                    name="menu"
                    size={20}
                    color={pauseActive ? (isYouth ? accent : accentBright) : dimColor}
                    variant={pauseActive ? 'filled' : 'outline'}
                  />
                </View>
                <Text
                  style={[
                    styles.slotLabel,
                    { color: pauseActive ? labelActive : dimColor },
                  ]}
                >
                  {isYouth ? 'PLUS' : 'MENU'}
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
        accent={accent}
        accentBright={accentBright}
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
    borderWidth: 1,
    borderRadius: 28,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 6,
    overflow: 'hidden',
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  hudStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingTop: 2,
  },
  hudLvl: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  hudXp: { flex: 1 },
  hudStars: {
    color: JOUEUR_SITE.xp,
    fontSize: 10,
    fontWeight: '900',
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
  slotHome: {
    marginTop: -2,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  homeOrb: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  slotLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 1,
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
  },
  badgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '900',
  },
});
