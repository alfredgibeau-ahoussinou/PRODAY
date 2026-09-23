import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableSpring } from '../../components/motion';
import { Icon } from '../../components/ui/Icon';
import { ProDayText } from '../../components/ui/ProDayText';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { useJoueurSession } from '../../context/JoueurSessionContext';
import { useAppTheme } from '../../context/ProductLineContext';
import { getVisibleMainTabs } from '../../content/poleExperience';
import {
  buildJoueurPlusMenuItems,
  plusMenuFeatureFlag,
  type JoueurPlusMenuItem,
} from '../../content/joueurPlusMenu';
import { usePlatformFeatureFlags } from '../../hooks/usePlatformFeatureFlags';
import { isMinorUser } from '../../utils/minor';
import { useUnreadMessageCount } from '../../hooks/useUnreadMessages';
import { formatTabBadge } from '../../components/navigation/tabBarShared';
import { usePlayerTheme, usePlayerThemeColors } from '../../context/PlayerThemeContext';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { spacing, colors } from '../../theme/designTokens';
import { GlobalSearchBar } from '../../components/search/GlobalSearchBar';
import { GlobalSearchModal } from '../../components/search/GlobalSearchModal';
import { CrestWatermark } from './PlayerSaisonIcons';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';

/** Hub Plus — menu complet Tout ProDay */
export function JoueurPlusHubScreen() {
  const insets = useSafeAreaInsets();
  const profile = useSessionProfile();
  const session = useJoueurSession();
  const nav = useTabNavigationActions();
  const { productLine } = useAppTheme();
  const { count: unreadCount } = useUnreadMessageCount();
  const playerThemeCtx = usePlayerTheme();
  const playerTheme = usePlayerThemeColors();
  const teamPrimary = playerTheme.accent;
  const clubName = playerThemeCtx.clubName;
  const { isEnabled, disabledCopy } = usePlatformFeatureFlags();
  const [searchOpen, setSearchOpen] = useState(false);

  const visibleTabs = useMemo(
    () => getVisibleMainTabs(productLine, profile?.role, profile ?? undefined),
    [productLine, profile],
  );

  const items = useMemo(
    () =>
      buildJoueurPlusMenuItems({
        ageGroup: session?.ageGroup,
        visibleTabs,
        unreadCount,
        isMinor: profile ? isMinorUser(profile) : false,
        isFeatureEnabled: isEnabled,
      }),
    [session?.ageGroup, visibleTabs, profile, unreadCount, isEnabled],
  );

  const runItem = (item: JoueurPlusMenuItem) => {
    if (item.unavailable) {
      const flagKey = plusMenuFeatureFlag(item.id);
      if (flagKey) {
        const copy = disabledCopy(flagKey);
        Alert.alert(copy.title, copy.message);
      }
      return;
    }
    const { action } = item;
    if (action.kind === 'tab') {
      nav.setActiveTab(action.tab, { returnTo: 'plus' });
      return;
    }
    if (action.kind === 'dashboard') {
      nav.openDashboard(action.view);
      return;
    }
    nav.openShop();
  };

  if (!profile) {
    return <View style={styles.loader} />;
  }

  return (
    <View style={[styles.root, { paddingTop: 6 }]}>
      {/* 1. Header ProDay Stylisé */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View
            style={[
              styles.clubCrest,
              { borderColor: `${teamPrimary}40`, backgroundColor: `${teamPrimary}18` },
            ]}
          >
            <CrestWatermark width={22} height={26} color={teamPrimary} opacity={0.95} />
          </View>
          <View style={styles.titleCol}>
            <ProDayText variant="title" style={styles.headerTitleText}>
              Tout ProDay
            </ProDayText>
            {clubName ? (
              <View style={styles.clubSubtitleRow}>
                <View style={[styles.clubDot, { backgroundColor: teamPrimary }]} />
                <ProDayText
                  variant="caption"
                  style={[styles.clubSubtitleText, { color: `${teamPrimary}D0` }]}
                >
                  {clubName}
                </ProDayText>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.pad, { paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl }]}
        showsVerticalScrollIndicator={false}
        decelerationRate="normal"
      >
        <ProDayText variant="caption" style={styles.lead}>
          Retrouve messages, équipe, entraînement, vidéos et boutique sans chercher dans l’accueil.
        </ProDayText>

        <GlobalSearchBar
          onPress={() => setSearchOpen(true)}
          accent={teamPrimary}
          style={styles.searchBarWrap}
        />

        <View style={styles.grid}>
          {items.map((item) => (
            <PressableSpring
              key={item.id}
              style={styles.tile}
              onPress={() => runItem(item)}
              scaleTo={0.97}
              haptic
              testID={`plus-menu-${item.id}`}
            >
              <View style={styles.tileTop}>
                <View
                  style={[
                    styles.iconWrap,
                    {
                      backgroundColor: `${teamPrimary}14`,
                      borderColor: `${teamPrimary}33`,
                    },
                  ]}
                >
                  <Icon name={item.icon} size={24} color={teamPrimary} variant="outline" />
                </View>
                {item.badge && item.badge > 0 ? (
                  <View style={[styles.badge, { backgroundColor: teamPrimary }]}>
                    <ProDayText variant="caption" style={styles.badgeText}>
                      {formatTabBadge(item.badge)}
                    </ProDayText>
                  </View>
                ) : item.unavailable ? (
                  <View style={styles.soonBadge}>
                    <ProDayText variant="caption" style={styles.soonBadgeText}>
                      Bientôt
                    </ProDayText>
                  </View>
                ) : null}
              </View>
              <View style={styles.tileBottom}>
                <ProDayText variant="section" style={styles.tileLabel}>
                  {item.label}
                </ProDayText>
                {item.subtitle ? (
                  <ProDayText variant="caption" style={styles.tileSub} numberOfLines={2}>
                    {item.subtitle}
                  </ProDayText>
                ) : null}
              </View>
            </PressableSpring>
          ))}
        </View>
      </ScrollView>

      <GlobalSearchModal
        visible={searchOpen}
        onClose={() => setSearchOpen(false)}
        accent={teamPrimary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PLAYER_DARK.bg,
  },
  loader: {
    flex: 1,
    backgroundColor: PLAYER_DARK.bg,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: PLAYER_DARK.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clubCrest: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitleText: {
    fontSize: 21,
    fontWeight: '900',
    color: PLAYER_DARK.text,
    letterSpacing: -0.4,
  },
  clubSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
  },
  clubDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  clubSubtitleText: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  scroll: {
    flex: 1,
  },
  pad: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 12,
  },
  lead: {
    color: PLAYER_DARK.textMuted,
    fontSize: 12.5,
    lineHeight: 18,
  },
  searchBarWrap: {
    marginTop: 2,
    marginBottom: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  tile: {
    width: '48.5%',
    minHeight: 136,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    padding: 15,
    justifyContent: 'space-between',
    backgroundColor: PLAYER_DARK.surface,
  },
  tileTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  tileBottom: {
    gap: 2,
    marginTop: 8,
  },
  tileLabel: {
    color: PLAYER_DARK.text,
    fontWeight: '900',
    fontSize: 14.5,
    letterSpacing: -0.2,
  },
  tileSub: {
    color: PLAYER_DARK.textMuted,
    fontSize: 10.5,
    fontWeight: '500',
    lineHeight: 14,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: PLAYER_DARK.bg,
    fontSize: 9,
    fontWeight: '900',
  },
  soonBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: PLAYER_DARK.surfaceRaised,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
  },
  soonBadgeText: {
    color: PLAYER_DARK.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
