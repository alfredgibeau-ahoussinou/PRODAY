import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { DiscoverLightHeader } from './DiscoverLightHeader';
import { DiscoverHomePager } from './DiscoverHomePager';
import { DiscoverIntroPager } from './DiscoverIntroPager';
import { DiscoverUniverseCarousel } from './DiscoverUniverseCarousel';
import { DiscoverActivityStrip } from './DiscoverActivityStrip';
import { DiscoverSectionLabel } from './DiscoverSectionLabel';
import { DiscoverJourneyPage } from './DiscoverJourneyPage';
import { DiscoverJoinPage } from './DiscoverJoinPage';
import type { DiscoverExperienceId } from './DiscoverExperiencesHub';
import { ProDayModuleGrid } from '../ui/ProDayModuleGrid';
import { Icon } from '../ui/Icon';
import { PressableSpring } from './PressableSpring';
import { discoverStyles, discoverPalette } from './discoverStyles';
import { useDiscoverMetrics } from './useDiscoverMetrics';
import type { DiscoverChapterId, IntroSlideAction } from '../../content/discoverChapters';
import type { RecruitmentStats } from '../../services/stats.service';
import type { RecruitmentPost } from '../../models/Player';
import type { Tournament } from '../../models/Tournament';
import type { ProDayModuleId } from '../../content/prodayModules';
import { spacing } from '../../theme/designTokens';

export interface DiscoverInteractiveHomeProps {
  stats: RecruitmentStats | null;
  posts: RecruitmentPost[];
  tournaments: Tournament[];
  loading: boolean;
  statsLabel: string;
  liveRecruitment: boolean;
  onSignup: () => void;
  onPress: () => void;
  onMercato: () => void;
  onMatchs: () => void;
  onModulePress: (id: ProDayModuleId) => void;
  onStepPress: (id: string) => void;
  onFeaturePress: () => void;
  onExperience: (id: DiscoverExperienceId) => void;
}

/**
 * Accueil invité — fond clair, cartes blanches, 5 pages swipe, layout mobile.
 */
export const DiscoverInteractiveHome: React.FC<DiscoverInteractiveHomeProps> = ({
  stats,
  posts,
  tournaments,
  loading,
  statsLabel,
  liveRecruitment,
  onSignup,
  onPress,
  onMercato,
  onMatchs,
  onModulePress,
  onStepPress,
  onFeaturePress,
  onExperience,
}) => {
  const [chapter, setChapter] = useState<DiscoverChapterId>('welcome');
  const metrics = useDiscoverMetrics();
  const exploreScrollRef = useRef<ScrollView>(null);
  const liveScrollRef = useRef<ScrollView>(null);

  const pagePad = useMemo(
    () => ({
      paddingHorizontal: metrics.pad,
      paddingTop: spacing.xs,
      paddingBottom: metrics.scrollBottomPad,
      flexGrow: 1,
    }),
    [metrics.pad, metrics.scrollBottomPad]
  );

  const goChapter = useCallback((id: DiscoverChapterId) => setChapter(id), []);

  const onChapterSelect = useCallback((id: DiscoverChapterId) => {
    if (id === 'explore') {
      exploreScrollRef.current?.scrollTo({ y: 0, animated: true });
    } else if (id === 'live') {
      liveScrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, []);

  const onIntroAction = useCallback(
    (action: IntroSlideAction) => {
      switch (action) {
        case 'signup':
          setChapter('join');
          break;
        case 'live':
          setChapter('live');
          break;
        case 'modules':
          setChapter('explore');
          break;
        case 'arena':
          onModulePress('arena');
          break;
        case 'sponsors':
          onModulePress('sponsors');
          break;
        default:
          break;
      }
    },
    [onModulePress, onSignup]
  );

  const hasActivity = posts.length > 0 || tournaments.length > 0;
  const showHeaderStats = Boolean(stats) && !loading;

  const scrollProps = {
    showsVerticalScrollIndicator: false,
    nestedScrollEnabled: true,
    keyboardShouldPersistTaps: 'handled' as const,
    bounces: true,
  };

  const pages = useMemo(
    () => [
      {
        id: 'welcome' as const,
        render: () => (
          <View style={local.page}>
            <DiscoverIntroPager
              statsLabel={showHeaderStats ? undefined : statsLabel}
              onAction={onIntroAction}
              autoAdvance={false}
              compact
              height={metrics.introPagerHeight}
              showFooter
              variant="editorial"
            />
          </View>
        ),
      },
      {
        id: 'explore' as const,
        render: () => (
          <ScrollView
            ref={exploreScrollRef}
            style={local.pageScroll}
            contentContainerStyle={pagePad}
            {...scrollProps}
          >
            <DiscoverSectionLabel>Univers ProDay</DiscoverSectionLabel>
            <DiscoverUniverseCarousel
              onModulePress={onModulePress}
              showHeader={false}
              autoPlay={false}
              variant="editorial"
            />
            <View style={local.gridSpacer} />
            <DiscoverSectionLabel>Tous les modules</DiscoverSectionLabel>
            <ProDayModuleGrid
              onModulePress={onModulePress}
              liveRecruitment={liveRecruitment}
              animated
              fullWidthModuleId="gestion"
            />
          </ScrollView>
        ),
      },
      {
        id: 'live' as const,
        render: () => (
          <ScrollView
            ref={liveScrollRef}
            style={local.pageScroll}
            contentContainerStyle={pagePad}
            {...scrollProps}
          >
            <DiscoverSectionLabel>Communauté</DiscoverSectionLabel>

            {!loading && stats ? (
              <PressableSpring
                style={discoverStyles.statsRow}
                onPress={onPress}
                scaleTo={0.98}
              >
                <View style={discoverStyles.liveDot} />
                <Text style={discoverStyles.statsRowText} numberOfLines={2}>
                  {statsLabel}
                </Text>
                <Icon name="chevron-forward" size={16} color={discoverPalette.faint} />
              </PressableSpring>
            ) : loading ? (
              <ActivityIndicator color={discoverPalette.ink} style={local.loader} />
            ) : (
              <View style={discoverStyles.emptyCard}>
                <Icon name="people" size={24} color={discoverPalette.faint} />
                <Text style={discoverStyles.emptyCardText}>
                  Les statistiques de la communauté s’afficheront dès qu’elles sont disponibles.
                </Text>
              </View>
            )}

            {hasActivity || loading ? (
              <>
                <DiscoverSectionLabel>Activité récente</DiscoverSectionLabel>
                <DiscoverActivityStrip
                  posts={posts}
                  tournaments={tournaments}
                  loading={loading}
                  onPress={onPress}
                  variant="editorial"
                />
              </>
            ) : null}

            <DiscoverSectionLabel>Accès rapide</DiscoverSectionLabel>
            <View style={discoverStyles.shortcuts}>
              <PressableSpring style={discoverStyles.shortcut} onPress={onMercato} scaleTo={0.98}>
                <View style={discoverStyles.shortcutIcon}>
                  <Icon name="search" size={20} color={discoverPalette.ink} variant="filled" />
                </View>
                <View style={local.shortcutCopy}>
                  <Text style={discoverStyles.shortcutTitle}>Mercato</Text>
                  <Text style={discoverStyles.shortcutSub}>Annonces & candidatures</Text>
                </View>
                <Icon name="chevron-forward" size={18} color={discoverPalette.faint} />
              </PressableSpring>
              <PressableSpring style={discoverStyles.shortcut} onPress={onMatchs} scaleTo={0.98}>
                <View style={discoverStyles.shortcutIcon}>
                  <Icon name="handshake" size={20} color={discoverPalette.ink} variant="filled" />
                </View>
                <View style={local.shortcutCopy}>
                  <Text style={discoverStyles.shortcutTitle}>Matchs</Text>
                  <Text style={discoverStyles.shortcutSub}>Amicaux & convocations</Text>
                </View>
                <Icon name="chevron-forward" size={18} color={discoverPalette.faint} />
              </PressableSpring>
            </View>

            <View style={discoverStyles.trust}>
              <Icon name="shield" size={18} color={discoverPalette.ink} variant="filled" />
              <Text style={discoverStyles.trustText}>
                <Text style={discoverStyles.trustBold}>Profils vérifiés</Text>
                {' — coachs et agents validés avant la messagerie complète.'}
              </Text>
            </View>
          </ScrollView>
        ),
      },
      {
        id: 'journey' as const,
        render: () => (
          <View style={local.pageScroll}>
            <DiscoverJourneyPage
              onStepPress={onStepPress}
              onFeaturePress={onFeaturePress}
              scrollBottomPad={metrics.scrollBottomPad}
            />
          </View>
        ),
      },
      {
        id: 'join' as const,
        render: () => (
          <View style={local.pageScroll}>
            <DiscoverJoinPage
              onExperience={onExperience}
              onSignup={onSignup}
              scrollBottomPad={metrics.scrollBottomPad}
            />
          </View>
        ),
      },
    ],
    [
      statsLabel,
      showHeaderStats,
      onIntroAction,
      onModulePress,
      liveRecruitment,
      loading,
      stats,
      hasActivity,
      posts,
      tournaments,
      onPress,
      onMercato,
      onMatchs,
      onStepPress,
      onFeaturePress,
      onExperience,
      onSignup,
      pagePad,
      metrics.introPagerHeight,
      metrics.scrollBottomPad,
    ]
  );

  return (
    <View style={discoverStyles.canvas}>
      <DiscoverLightHeader
        statsLabel={showHeaderStats ? statsLabel : undefined}
        onStatsPress={showHeaderStats ? onPress : undefined}
      />

      <View style={discoverStyles.body}>
        <DiscoverHomePager
          embedded
          ui="light"
          pages={pages}
          activeChapter={chapter}
          onChapterChange={goChapter}
          onChapterSelect={onChapterSelect}
        />
      </View>
    </View>
  );
};

const local = StyleSheet.create({
  page: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: spacing.xs,
  },
  pageScroll: { flex: 1, minHeight: 0 },
  loader: { marginVertical: spacing.xl },
  gridSpacer: { height: spacing.md },
  shortcutCopy: { flex: 1, minWidth: 0 },
});
