import { useMemo } from 'react';
import type { User } from '../models/User';
import type { GeoPoint } from '../models/User';
import { useDashboardData } from './useDashboardData';
import { useUnreadMessageCount } from './useUnreadMessages';
import { useUserStateStore } from './useUserStateStore';
import { getProfileCompletion } from '../utils/profileCompletion';
import { getPulseBreakdown } from '../utils/prodayPulse';
import {
  runAiCore,
  computeHealthSnapshot,
  buildMatchRecommendations,
  buildGeoMarkers,
  summarizeDensity,
  buildNotificationCandidates,
  rankNotifications,
  mergeCalendarEntities,
  computeProgression,
} from '../core';
import { mergeProgression } from '../core/state/brainState.mapper';
import type { AiCoreOutput } from '../core/types/ai';
import type { GeoRadiusKm } from '../core/types/geo';
import type { PrioritizedNotification } from '../core/notifications/notificationPriority.engine';
import type { CalendarEntity } from '../core/calendar/calendarSync.engine';
import type { HealthEngineInput } from '../core/types/health';
import type { WearableHealthMetrics } from '../services/wearableHealth/types';
import { applyWearableToHealthInput } from '../services/wearableHealth/mergeHealthInput';
import type { GamificationState } from '../features/v3/models/gamification';
import { seedsForUniverse } from '../content/reelSeedCatalog';
import type { ProductLineId } from '../models/ProductLine';

export interface ReelPreviewItem {
  id: string;
  author: string;
  tag: string;
  usefulnessScore: number;
}

export interface ProDayBrainState {
  loading: boolean;
  ai: AiCoreOutput;
  progression: GamificationState;
  geoMarkers: ReturnType<typeof buildGeoMarkers>;
  geoDensity: ReturnType<typeof summarizeDensity>;
  notifications: { push: PrioritizedNotification[]; inbox: PrioritizedNotification[] };
  calendar: CalendarEntity[];
  reelPreviews: ReelPreviewItem[];
  userLocation?: GeoPoint;
  healthInput: HealthEngineInput;
}

export function useProDayBrain(
  profile: User | null,
  productLine: ProductLineId,
  options?: { radiusKm?: GeoRadiusKm; userLocation?: GeoPoint; wearable?: WearableHealthMetrics | null }
): ProDayBrainState {
  const { data, refresh } = useDashboardData(profile);
  const { count: unreadMessages } = useUnreadMessageCount();
  const storedState = useUserStateStore();
  const radiusKm = options?.radiusKm ?? 5;
  const userLocation = options?.userLocation ?? profile?.location;
  const wearable = options?.wearable ?? null;

  return useMemo(() => {
    const emptyHealth = computeHealthSnapshot({
      globalScore: 0,
      upcomingEventsCount: 0,
      pendingConvocations: 0,
      recentMatchCount: 0,
      streakDays: 0,
      profileCompletion: 0,
    });

    const emptyAi = runAiCore(
      {
        userId: '',
        role: 'player',
        globalScore: 0,
        userEnergy: 50,
        fatigueScore: 0,
        healthState: 'OPTIMAL',
        nearbyMatchCount: 0,
        unreadMessages: 0,
        applicationsCount: 0,
        upcomingEventsCount: 0,
        streakDays: 0,
        lastActiveHoursAgo: 0,
      },
      [],
      emptyHealth
    );

    if (!profile) {
      return {
        loading: data.loading,
        ai: emptyAi,
        progression: computeProgression({ globalScore: 0, streakDays: 0 }),
        geoMarkers: [],
        geoDensity: summarizeDensity([], radiusKm),
        notifications: { push: [], inbox: [] },
        calendar: [],
        reelPreviews: [],
        healthInput: {
          globalScore: 0,
          upcomingEventsCount: 0,
          pendingConvocations: 0,
          recentMatchCount: 0,
          streakDays: 0,
          profileCompletion: 0,
        },
      };
    }

    const completion = getProfileCompletion(profile).percent;
    const breakdown = getPulseBreakdown(profile, {
      pendingConvocations: data.pendingConvocations.length,
      applicationsCount: data.myApplications.length,
      upcomingEvents: data.calendarItems.length,
    });
    const streakDays = Math.max(
      1,
      Math.min(14, breakdown.filter((b) => b.points > 0).length + Math.floor(data.pulse.score / 25))
    );

    const computedProgression = computeProgression({ globalScore: data.pulse.score, streakDays });
    const progression = mergeProgression(computedProgression, storedState?.progression);
    const healthInput: HealthEngineInput = applyWearableToHealthInput(
      {
        globalScore: data.pulse.score,
        upcomingEventsCount: data.calendarItems.length,
        pendingConvocations: data.pendingConvocations.length,
        recentMatchCount: Math.min(5, data.myUpcomingEvents.length),
        streakDays,
        profileCompletion: completion,
      },
      wearable
    );

    const health = computeHealthSnapshot(healthInput);

    const matchRecommendations = buildMatchRecommendations({
      openMatches: data.openMatches,
      calendarItems: data.calendarItems,
      userLocation,
      userLevel: profile.profile.level,
      health,
      radiusKm,
    });

    const nearbyMatchCount = matchRecommendations.filter(
      (m) => m.distanceKm == null || m.distanceKm <= radiusKm
    ).length;

    const userEnergy = Math.round(100 - health.fatigueScore * 0.6 + health.recoveryScore * 0.2);

    const ai = runAiCore(
      {
        userId: profile.uid,
        role: profile.role,
        globalScore: data.pulse.score,
        userEnergy,
        fatigueScore: health.fatigueScore,
        healthState: health.state,
        nearbyMatchCount,
        unreadMessages,
        applicationsCount: data.myApplications.length,
        upcomingEventsCount: data.calendarItems.length,
        streakDays,
        lastActiveHoursAgo: 12,
        city: profile.city,
      },
      matchRecommendations,
      health
    );

    const geoMarkers = buildGeoMarkers({
      userLocation,
      openMatches: data.openMatches,
      calendarItems: data.calendarItems,
      events: data.myUpcomingEvents,
      radiusKm,
    });

    const notifCandidates = buildNotificationCandidates({
      pendingConvocations: data.pendingConvocations.length,
      unreadMessages,
      healthAlert: health.state === 'OVERLOADED' || health.state === 'INJURY_RISK',
      mercatoOpportunities: data.stats?.recruitment_posts_open ?? 0,
    });

    const calendar = mergeCalendarEntities({
      seasonItems: data.calendarItems,
      aiGoals: ai.expertVotes.slice(0, 2).map((v) => ({
        id: v.expert,
        title: v.reason,
        reason: v.expert,
        tab: v.primaryTab ?? 'home',
      })),
    });

    const seeds = seedsForUniverse(productLine).slice(0, 12);
    const reelPreviews: ReelPreviewItem[] = seeds.slice(0, 3).map((s, i) => ({
      id: `${s.source}-${s.externalId}`,
      author: s.authorName,
      tag: s.tags[0] ?? '#football',
      usefulnessScore: 0.5 + (i === 0 ? 0.3 : 0.1) - health.fatigueScore * 0.002,
    })).filter((r) => r.usefulnessScore >= ai.contentFilter.reelsUsefulnessMin);

    return {
      loading: data.loading,
      ai,
      progression,
      geoMarkers,
      geoDensity: summarizeDensity(geoMarkers, radiusKm),
      notifications: rankNotifications(notifCandidates),
      calendar,
      reelPreviews,
      userLocation,
      healthInput,
    };
  }, [profile, data, unreadMessages, productLine, radiusKm, userLocation, storedState?.refreshToken, wearable]);
}
