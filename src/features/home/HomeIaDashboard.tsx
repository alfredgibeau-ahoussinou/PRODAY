import React, { useState, useCallback, useMemo } from 'react';
import { ScrollView, RefreshControl, Alert, Linking } from 'react-native';
import type { User } from '../../models/User';
import type { ProductLineId } from '../../models/ProductLine';
import { useProDayBrain } from '../../hooks/useProDayBrain';
import { useGeoLocation } from '../../hooks/useGeoLocation';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { useAppTheme } from '../../context/ProductLineContext';
import { validateMatchJoin } from '../../core';
import { trackV3Event } from '../../core/analytics/v3Events';
import type { GeoRadiusKm } from '../../core/types/geo';
import type { GeoMarker } from '../../core/types/geo';
import type { MatchRecommendation } from '../../core/types/recommendation';
import { SkeletonList } from '../../components/motion';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { spacing } from '../../theme/designTokens';
import { HomeIaHeader } from './components/HomeIaHeader';
import { HeroIaBlock } from './components/HeroIaBlock';
import { GeoMapPreview } from './components/GeoMapPreview';
import { MatchCarousel } from './components/MatchCarousel';
import { useWearableHealth } from '../../hooks/useWearableHealth';
import { hasWearableData } from '../../services/wearableHealth/formatWearableMetrics';
import { buildRecoverySuggestions } from '../../services/wearableHealth/recoverySuggestions';
import { buildHealthReportHtml } from '../../utils/healthReportPdf';
import { HealthSummaryCard } from './components/HealthSummaryCard';
import { ProgressionBlock } from './components/ProgressionBlock';
import { ReelsPreviewStrip } from './components/ReelsPreviewStrip';
import { StaffPrioritiesStrip } from '../v3/components/StaffPrioritiesStrip';
import { buildStaffPriorities } from '../v3/engines/staffHome.engine';
import type { StaffPriorityItem } from '../v3/engines/staffHome.engine';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useStaffMercatoPipeline } from '../../hooks/useStaffMercatoPipeline';
import { ActivityFeedStrip } from './components/ActivityFeedStrip';
import { HealthProgramCard } from './components/HealthProgramCard';
import { buildActivityFeed } from '../v3/engines/activityFeed.engine';
import { HealthScoreExplainSheet } from '../../components/health/HealthScoreExplainSheet';
import { ProDayModuleGrid } from '../../components/ui/ProDayModuleGrid';
import type { ProDayModuleId } from '../../content/prodayModules';

interface HomeIaDashboardProps {
  profile: User;
  productLine: ProductLineId;
  unreadMessages: number;
  onRefresh?: () => Promise<void>;
  refreshing?: boolean;
}

const pagePad = {
  paddingHorizontal: spacing.lg,
  paddingBottom: TAB_BAR_CONTENT_INSET + spacing.lg,
};

/** Dashboard IA — écran principal dynamique (spec §4). */
export const HomeIaDashboard: React.FC<HomeIaDashboardProps> = ({
  profile,
  productLine,
  unreadMessages,
  onRefresh,
  refreshing = false,
}) => {
  const { colors } = useAppTheme();
  const nav = useTabNavigationActions();
  const [radiusKm, setRadiusKm] = useState<GeoRadiusKm>(5);
  const [healthExplainOpen, setHealthExplainOpen] = useState(false);
  const { userLocation, refreshLocation, locating, locError } = useGeoLocation(profile);
  const wearable = useWearableHealth();
  const wearableForBrain =
    wearable.connected && wearable.metrics && hasWearableData(wearable.metrics)
      ? wearable.metrics
      : null;
  const brain = useProDayBrain(profile, productLine, {
    radiusKm,
    userLocation,
    wearable: wearableForBrain,
  });
  const recoverySuggestions = useMemo(
    () => buildRecoverySuggestions(wearable.metrics, brain.ai.health),
    [wearable.metrics, brain.ai.health],
  );
  const handleExportHealthReport = useCallback(() => {
    const html = buildHealthReportHtml(
      profile.display_name,
      brain.ai.health,
      wearable.metrics,
      wearable.history,
    );
    const uri = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
    void Linking.openURL(uri).catch(() => {
      Alert.alert('Export', 'Ouvrez le rapport dans le navigateur puis « Imprimer → PDF ».');
    });
  }, [profile.display_name, brain.ai.health, wearable.metrics, wearable.history]);
  const { data: dashboardData } = useDashboardData(profile);
  const mercatoPipeline = useStaffMercatoPipeline(profile);
  const isStaffHome = profile.role !== 'player';
  const staffPriorities = useMemo(
    () =>
      isStaffHome
        ? buildStaffPriorities({
            pendingConvocations: dashboardData.pendingConvocations.length,
            pendingApplications: mercatoPipeline.pendingApplications,
            myPostsCount: mercatoPipeline.myPostsCount,
            upcomingEvents: dashboardData.myUpcomingEvents.length,
          })
        : [],
    [
      isStaffHome,
      dashboardData.pendingConvocations.length,
      dashboardData.myUpcomingEvents.length,
      mercatoPipeline.pendingApplications,
      mercatoPipeline.myPostsCount,
    ]
  );
  const activityFeed = useMemo(
    () =>
      buildActivityFeed({
        uid: profile.uid,
        teamEvents: dashboardData.teamEvents,
        openMatches: dashboardData.openMatches,
        applications: dashboardData.myApplications,
      }),
    [profile.uid, dashboardData.teamEvents, dashboardData.openMatches, dashboardData.myApplications]
  );

  const handleActivityPress = useCallback(
    (item: import('../v3/engines/activityFeed.engine').ActivityFeedItem) => {
      trackV3Event('activity_feed_tap', { kind: item.kind, tab: item.tab });
      nav.setActiveTab(item.tab as Parameters<typeof nav.setActiveTab>[0]);
    },
    [nav]
  );

  const handleCtaTab = useCallback(
    (tab: string) => {
      trackV3Event('home_hero_cta_tap', { tab });
      nav.setActiveTab(tab as Parameters<typeof nav.setActiveTab>[0]);
    },
    [nav]
  );

  const handleStaffPriority = useCallback(
    (item: StaffPriorityItem) => {
      if (item.action === 'gestion') {
        nav.openDashboard('gestion');
        return;
      }
      if (item.action === 'sponsors') {
        nav.openDashboard('sponsors');
        return;
      }
      handleCtaTab(item.tab);
    },
    [nav, handleCtaTab]
  );

  const handleModulePress = useCallback(
    (id: ProDayModuleId) => {
      trackV3Event('home_module_tap', { module: id });
      switch (id) {
        case 'recrutement':
          nav.openMercato('home');
          break;
        case 'matchs':
          nav.openMatchs();
          break;
        case 'gestion':
          nav.openDashboard('gestion');
          break;
        case 'sponsors':
          nav.openDashboard('sponsors');
          break;
      }
    },
    [nav]
  );

  const handleJoinMatch = useCallback(
    (match: MatchRecommendation) => {
      const check = validateMatchJoin({
        health: brain.ai.health,
        distanceKm: match.distanceKm,
        levelScore: match.iaLevelScore,
      });
      if (!check.allowed) {
        Alert.alert('Participation déconseillée', check.reasons.join('\n'));
        return;
      }
      nav.openMatchs();
    },
    [brain.ai.health, nav]
  );

  const handleGeoMarkerPress = useCallback(
    (marker: GeoMarker) => {
      trackV3Event('home_geo_marker_tap', { kind: marker.kind });
      nav.openMatchs();
    },
    [nav]
  );

  const notifCount = brain.notifications.push.length + brain.notifications.inbox.length;

  return (
    <ScrollView
      contentContainerStyle={pagePad}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        ) : undefined
      }
    >
      <HomeIaHeader
        profile={profile}
        globalScore={brain.ai.dynamicScore}
        notificationCount={notifCount}
        onAvatarPress={() => nav.openProfile()}
        onLocationPress={() => nav.openMatchs()}
        onNotificationsPress={() => nav.setActiveTab('messages')}
      />

      {brain.loading ? (
        <SkeletonList count={3} variant="card" />
      ) : (
        <>
          <HeroIaBlock
            state={brain.ai.heroState}
            title={brain.ai.heroTitle}
            description={brain.ai.heroDescription}
            primaryLabel={brain.ai.primaryCta.label}
            secondaryLabel={brain.ai.secondaryCta?.label}
            onPrimaryPress={() => handleCtaTab(brain.ai.primaryCta.tab)}
            onSecondaryPress={
              brain.ai.secondaryCta
                ? () => handleCtaTab(brain.ai.secondaryCta!.tab)
                : undefined
            }
          />

          {isStaffHome ? (
            <StaffPrioritiesStrip items={staffPriorities} onPress={handleStaffPriority} />
          ) : null}

          {isStaffHome ? (
            <ProDayModuleGrid
              role={profile.role}
              onModulePress={handleModulePress}
              liveRecruitment={mercatoPipeline.myPostsCount > 0}
              animated
            />
          ) : null}

          {!isStaffHome ? (
            <ProDayModuleGrid
              role={profile.role}
              onModulePress={handleModulePress}
              animated
            />
          ) : null}

          {!isStaffHome ? (
            <ActivityFeedStrip items={activityFeed} onPressItem={handleActivityPress} />
          ) : null}

          {!isStaffHome ? (
            <GeoMapPreview
              userLocation={userLocation}
              markers={brain.geoMarkers}
              density={brain.geoDensity}
              radiusKm={radiusKm}
              onRadiusChange={setRadiusKm}
              onRefreshLocation={() => void refreshLocation()}
              locating={locating}
              locError={locError}
              onMarkerPress={handleGeoMarkerPress}
            />
          ) : null}

          {!isStaffHome ? (
            <MatchCarousel
              matches={brain.ai.matchRecommendations}
              onJoin={handleJoinMatch}
              onDetails={() => nav.openMatchs()}
            />
          ) : null}

          {!isStaffHome ? (
            <HealthSummaryCard
              health={brain.ai.health}
              onExplainPress={() => setHealthExplainOpen(true)}
              wearableConnected={wearable.connected}
              wearableMetrics={wearable.metrics}
              wearablePlatformLabel={wearable.platformLabel}
              wearableSyncing={wearable.syncing}
              wearableError={wearable.error}
              onWearableConnect={() => void wearable.connect()}
              onWearableRefresh={() => void wearable.refresh()}
              wearableHistory={wearable.history}
              recoverySuggestions={recoverySuggestions}
              onExportHealthReport={handleExportHealthReport}
            />
          ) : null}

          {!isStaffHome ? (
            <HealthProgramCard
              uid={profile.uid}
              healthState={brain.ai.health.state}
              onOpenHealth={() => nav.setActiveTab('sante')}
            />
          ) : null}

          {isStaffHome ? (
            <GeoMapPreview
              userLocation={userLocation}
              markers={brain.geoMarkers}
              density={brain.geoDensity}
              radiusKm={radiusKm}
              onRadiusChange={setRadiusKm}
              onRefreshLocation={() => void refreshLocation()}
              locating={locating}
              locError={locError}
              onMarkerPress={handleGeoMarkerPress}
            />
          ) : null}

          <ProgressionBlock progression={brain.progression} />

          <ReelsPreviewStrip items={brain.reelPreviews} onPress={() => nav.setActiveTab('reels')} />
        </>
      )}

      <HealthScoreExplainSheet
        visible={healthExplainOpen}
        onClose={() => setHealthExplainOpen(false)}
        health={brain.ai.health}
        input={brain.healthInput}
      />
    </ScrollView>
  );
};
