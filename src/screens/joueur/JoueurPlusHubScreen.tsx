import React, { useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { JoueurScreenChrome } from '../../components/joueur/JoueurScreenChrome';
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
  getJoueurUnavailableFeature,
  type JoueurPlusMenuItem,
} from '../../content/joueurPlusMenu';
import { isMinorUser } from '../../utils/minor';
import { useUnreadMessageCount } from '../../hooks/useUnreadMessages';
import { formatTabBadge } from '../../components/navigation/tabBarShared';
import { usePlayerThemeColors } from '../../context/PlayerThemeContext';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { PLAYER_DARK, PLAYER_DARK_RADIUS } from '../../theme/playerDarkPremium';
import { spacing } from '../../theme/designTokens';

/** Hub Plus — tuiles grandes style discover, accès aux modules secondaires. */
export function JoueurPlusHubScreen() {
  const profile = useSessionProfile();
  const session = useJoueurSession();
  const nav = useTabNavigationActions();
  const { productLine } = useAppTheme();
  const { count: unreadCount } = useUnreadMessageCount();
  const playerTheme = usePlayerThemeColors();

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
      }),
    [session?.ageGroup, visibleTabs, profile, unreadCount],
  );

  const runItem = (item: JoueurPlusMenuItem) => {
    if (item.unavailable) {
      const info = getJoueurUnavailableFeature(item.id);
      if (info) Alert.alert(info.title, info.message);
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
    <JoueurScreenChrome variant="page" kicker="Menu" title="Tout ProDay">
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.pad, { paddingBottom: TAB_BAR_CONTENT_INSET + spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        <ProDayText variant="caption" style={styles.lead}>
          Retrouve messages, équipe, entraînement, reels et boutique sans chercher dans l’accueil.
        </ProDayText>
        <View style={styles.grid}>
          {items.map((item) => (
            <PressableSpring
              key={item.id}
              style={styles.tile}
              onPress={() => runItem(item)}
              scaleTo={0.98}
              haptic
              testID={`plus-menu-${item.id}`}
            >
              <View style={styles.tileTop}>
                <View
                  style={[
                    styles.iconWrap,
                    {
                      backgroundColor: playerTheme.accentSoft,
                      borderColor: `${playerTheme.accent}55`,
                    },
                  ]}
                >
                  <Icon name={item.icon} size={26} color={playerTheme.accentAlt} variant="outline" />
                </View>
                {item.badge && item.badge > 0 ? (
                  <View style={styles.badge}>
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
              <ProDayText variant="section" style={styles.tileLabel}>
                {item.label}
              </ProDayText>
              {item.subtitle ? (
                <ProDayText variant="caption" style={styles.tileSub} numberOfLines={2}>
                  {item.subtitle}
                </ProDayText>
              ) : null}
            </PressableSpring>
          ))}
        </View>
      </ScrollView>
    </JoueurScreenChrome>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, backgroundColor: PLAYER_DARK.bg },
  scroll: { flex: 1 },
  pad: { padding: spacing.lg, gap: spacing.md },
  lead: {
    color: PLAYER_DARK.textMuted,
    lineHeight: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    width: '47%',
    minHeight: 128,
    borderRadius: PLAYER_DARK_RADIUS.card,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    padding: spacing.md,
    gap: spacing.xs,
    backgroundColor: PLAYER_DARK.surface,
  },
  tileTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  tileLabel: {
    color: PLAYER_DARK.text,
    fontWeight: '800',
    fontSize: 15,
  },
  tileSub: {
    color: PLAYER_DARK.textMuted,
    fontSize: 11,
    lineHeight: 15,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    backgroundColor: PLAYER_DARK.statYellow,
  },
  badgeText: {
    color: PLAYER_DARK.bg,
    fontSize: 9,
    fontWeight: '900',
  },
  soonBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: PLAYER_DARK.surfaceRaised,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
  },
  soonBadgeText: {
    color: PLAYER_DARK.textMuted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
