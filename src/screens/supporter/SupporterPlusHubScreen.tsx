import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SupporterPageFrame } from '../../components/supporter/SupporterPageFrame';
import { PressableSpring } from '../../components/motion';
import { Icon } from '../../components/ui/Icon';
import { ProDayText } from '../../components/ui/ProDayText';
import { getSupporterPageIdentity, SUPPORTER_SITE } from '../../content/supporterPageIdentity';
import { buildSupporterPlusMenuItems } from '../../content/supporterPlusMenu';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { useUnreadMessageCount } from '../../hooks/useUnreadMessages';
import { formatTabBadge } from '../../components/navigation/tabBarShared';
import { registerClubHelpFallback } from '../../features/club/shell/clubHelpOpen';
import { PoleHelpPanel } from '../../components/help/PoleHelpPanel';
import { getPoleHelpContent, getPoleHelpQuestionCount } from '../../content/poleHelpContent';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { spacing, radius } from '../../theme/designTokens';
import { SupporterLiveNowScreen } from './SupporterLiveNowScreen';
import { SupporterFootballMapScreen } from './SupporterFootballMapScreen';
import { SupporterSuivisScreen } from '../SupporterSuivisScreen';

type Overlay = 'live' | 'map' | 'suivis' | 'ia' | null;

/** Hub Plus supporter — tuiles vers Live, Explorer, Vidéos, Fil, carte, suivis, IA, shop. */
export function SupporterPlusHubScreen() {
  const nav = useTabNavigationActions();
  const { count: unreadCount } = useUnreadMessageCount();
  const [overlay, setOverlay] = useState<Overlay>(null);
  const helpContent = useMemo(() => getPoleHelpContent('supporter', 'supporter'), []);
  const helpCount = useMemo(() => getPoleHelpQuestionCount(helpContent), [helpContent]);

  useEffect(() => {
    const openIa = () => setOverlay('ia');
    registerClubHelpFallback(openIa);
    return () => registerClubHelpFallback(null);
  }, []);

  const items = useMemo(
    () =>
      buildSupporterPlusMenuItems({
        unreadCount,
        shopEnabled: true,
      }),
    [unreadCount],
  );

  if (overlay === 'live') {
    return <SupporterLiveNowScreen onBack={() => setOverlay(null)} />;
  }
  if (overlay === 'map') {
    return <SupporterFootballMapScreen onBack={() => setOverlay(null)} />;
  }
  if (overlay === 'suivis') {
    return (
      <View style={styles.overlay}>
        <PressableSpring style={styles.overlayBack} onPress={() => setOverlay(null)} haptic>
          <ProDayText variant="caption" style={styles.overlayBackText}>
            ← Plus
          </ProDayText>
        </PressableSpring>
        <SupporterSuivisScreen />
      </View>
    );
  }

  return (
    <>
    <SupporterPageFrame
      identity={{
        ...getSupporterPageIdentity('compte'),
        eyebrow: 'Menu',
        title: 'Plus',
        support: 'Live, explorer, vidéos, fil, carte et suivis — tout le reste est ici.',
        icon: 'hamburger',
      }}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.pad}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {items.map((item) => (
            <PressableSpring
              key={item.id}
              style={styles.tile}
              onPress={() => {
                const { action } = item;
                if (action.kind === 'tab') {
                  nav.setActiveTab(action.tab, { returnTo: 'plus' });
                  return;
                }
                if (action.kind === 'shop') {
                  nav.openShop();
                  return;
                }
                if (action.kind === 'live') {
                  setOverlay('live');
                  return;
                }
                if (action.kind === 'map') {
                  setOverlay('map');
                  return;
                }
                if (action.kind === 'suivis') {
                  setOverlay('suivis');
                  return;
                }
                if (action.kind === 'ia') {
                  setOverlay('ia');
                }
              }}
              scaleTo={0.98}
              haptic
              testID={`supporter-plus-${item.id}`}
            >
              <View style={styles.tileTop}>
                <View style={styles.iconWrap}>
                  <Icon name={item.icon} size={24} color={SUPPORTER_SITE.bright} variant="outline" />
                </View>
                {item.badge && item.badge > 0 ? (
                  <View style={styles.badge}>
                    <ProDayText variant="caption" style={styles.badgeText}>
                      {formatTabBadge(item.badge)}
                    </ProDayText>
                  </View>
                ) : null}
              </View>
              <ProDayText variant="section" style={styles.tileLabel}>
                {item.label}
              </ProDayText>
              <ProDayText variant="caption" style={styles.tileSub} numberOfLines={2}>
                {item.subtitle}
              </ProDayText>
            </PressableSpring>
          ))}
        </View>
      </ScrollView>
    </SupporterPageFrame>
    <PoleHelpPanel
      visible={overlay === 'ia'}
      content={helpContent}
      questionCount={helpCount}
      usesBriefcaseIcon={false}
      onClose={() => setOverlay(null)}
    />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  pad: {
    padding: spacing.lg,
    paddingBottom: TAB_BAR_CONTENT_INSET + spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    width: '47%',
    minHeight: 128,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: SUPPORTER_SITE.border,
    padding: spacing.md,
    gap: spacing.xs,
    backgroundColor: SUPPORTER_SITE.elevated,
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
    borderColor: 'rgba(124, 92, 255, 0.45)',
    backgroundColor: SUPPORTER_SITE.soft,
  },
  tileLabel: {
    color: SUPPORTER_SITE.foreground,
    fontWeight: '800',
    fontSize: 15,
  },
  tileSub: {
    color: SUPPORTER_SITE.muted,
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
    backgroundColor: SUPPORTER_SITE.live,
  },
  badgeText: {
    color: SUPPORTER_SITE.bg,
    fontSize: 9,
    fontWeight: '900',
  },
  overlay: { flex: 1, backgroundColor: SUPPORTER_SITE.bg },
  overlayBack: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    alignSelf: 'flex-start',
  },
  overlayBackText: { color: SUPPORTER_SITE.accent },
});
