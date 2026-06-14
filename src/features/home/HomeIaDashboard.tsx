import React, { useState, useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, RefreshControl, Alert } from 'react-native';
import type { User } from '../../models/User';
import type { ProductLineId } from '../../models/ProductLine';
import { useProDayBrain } from '../../hooks/useProDayBrain';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { useAppTheme } from '../../context/ProductLineContext';
import { validateMatchJoin } from '../../core';
import { trackV3Event } from '../../core/analytics/v3Events';
import type { GeoRadiusKm } from '../../core/types/geo';
import type { MatchRecommendation } from '../../core/types/recommendation';
import { SkeletonList } from '../../components/motion';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { spacing } from '../../theme/designTokens';
import { HomeIaHeader } from './components/HomeIaHeader';
import { TransversalNavBar } from './components/TransversalNavBar';
import { HeroIaBlock } from './components/HeroIaBlock';
import { GeoMapPreview } from './components/GeoMapPreview';
import { MatchCarousel } from './components/MatchCarousel';
import { HealthSummaryCard } from './components/HealthSummaryCard';
import { ProgressionBlock } from './components/ProgressionBlock';
import { ReelsPreviewStrip } from './components/ReelsPreviewStrip';
import { SmartCalendarPeek } from '../v3/components/SmartCalendarPeek';
import { SmartNotificationsPeek } from '../v3/components/SmartNotificationsPeek';
import { V3WelcomeBanner } from '../v3/components/V3WelcomeBanner';
import { peekCalendar } from '../v3/engines/smartCalendar.engine';
import { peekNotifications } from '../v3/engines/smartNotifications.engine';
import { StaffPrioritiesStrip } from '../v3/components/StaffPrioritiesStrip';
import { buildStaffPriorities } from '../v3/engines/staffHome.engine';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useStaffMercatoPipeline } from '../../hooks/useStaffMercatoPipeline';
import { ActivityFeedStrip } from './components/ActivityFeedStrip';
import { HealthProgramCard } from './components/HealthProgramCard';
import { buildActivityFeed } from '../v3/engines/activityFeed.engine';
import { HealthScoreExplainSheet } from '../../components/health/HealthScoreExplainSheet';

interface HomeIaDashboardProps {
  profile: User;
  productLine: ProductLineId;
  unreadMessages: number;
  onRefresh?: () => Promise<void>;
  refreshing?: boolean;
}

const pagePad = {
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
  const brain = useProDayBrain(profile, productLine, { radiusKm });
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
  const calendarPeek = useMemo(() => peekCalendar(brain.calendar), [brain.calendar]);
  const notifPeek = useMemo(() => peekNotifications(brain.notifications), [brain.notifications]);

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

      <V3WelcomeBanner uid={profile.uid} />

      <TransversalNavBar
        actions={[
          {
            id: 'notif',
            icon: 'notifications',
            label: 'Alertes',
            badge: notifCount,
            onPress: () => nav.setActiveTab('messages'),
          },
          {
            id: 'chat',
            icon: 'chat',
            label: 'Chat',
            badge: unreadMessages,
            onPress: () => nav.setActiveTab('messages'),
          },
          {
            id: 'calendar',
            icon: 'calendar',
            label: 'Agenda',
            onPress: () => nav.openMatchs(),
          },
          {
            id: 'search',
            icon: 'search',
            label: 'Recherche',
            onPress: () => nav.openMercato(),
          },
        ]}
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
            <StaffPrioritiesStrip
              items={staffPriorities}
              onPress={(tab) => handleCtaTab(tab)}
            />
          ) : null}

          {!isStaffHome ? (
            <ActivityFeedStrip items={activityFeed} onPressItem={handleActivityPress} />
          ) : null}

          {!isStaffHome ? (
            <GeoMapPreview
              markers={brain.geoMarkers}
              density={brain.geoDensity}
              onRadiusChange={setRadiusKm}
              onMarkerPress={() => nav.openMatchs()}
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
              markers={brain.geoMarkers}
              density={brain.geoDensity}
              onRadiusChange={setRadiusKm}
              onMarkerPress={() => nav.openMatchs()}
            />
          ) : null}

          <ProgressionBlock progression={brain.progression} />

          <SmartCalendarPeek
            today={calendarPeek.today}
            upcoming={calendarPeek.upcoming}
            onPress={() => nav.openMatchs()}
          />

          <SmartNotificationsPeek
            push={notifPeek.push}
            inboxPreview={notifPeek.inboxPreview}
            total={notifPeek.total}
            onPress={() => nav.setActiveTab('messages')}
          />

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

const styles = StyleSheet.create({});
