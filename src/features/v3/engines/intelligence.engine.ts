import type { User } from '../../../models/User';
import type { DailyBriefing, SmartAction } from '../models/intelligence';
import { runAiCore } from '../../../core/ai/aiCore.engine';
import { computeHealthSnapshot } from '../../../core/health/healthState.engine';
import { buildMatchRecommendations } from '../../../core/recommendation/recommendation.engine';
import type { FriendlyMatch } from '../../../models/FriendlyMatch';
import type { SeasonCalendarItem } from '../../../utils/seasonCalendar';
import { getProfileCompletion } from '../../../utils/profileCompletion';

export function buildDailyBriefing(params: {
  user: User;
  pulseScore: number;
  openMatches: FriendlyMatch[];
  calendarItems: SeasonCalendarItem[];
  unreadMessages: number;
}): DailyBriefing {
  const health = computeHealthSnapshot({
    globalScore: params.pulseScore,
    upcomingEventsCount: params.calendarItems.length,
    pendingConvocations: 0,
    recentMatchCount: 0,
    streakDays: 1,
    profileCompletion: getProfileCompletion(params.user).percent,
  });

  const matches = buildMatchRecommendations({
    openMatches: params.openMatches,
    calendarItems: params.calendarItems,
    userLevel: params.user.profile.level,
    health,
  });

  const ai = runAiCore(
    {
      userId: params.user.uid,
      role: params.user.role,
      globalScore: params.pulseScore,
      userEnergy: 70,
      fatigueScore: health.fatigueScore,
      healthState: health.state,
      nearbyMatchCount: matches.length,
      unreadMessages: params.unreadMessages,
      applicationsCount: 0,
      upcomingEventsCount: params.calendarItems.length,
      streakDays: 1,
      lastActiveHoursAgo: 24,
      city: params.user.city,
    },
    matches,
    health
  );

  return {
    headline: ai.heroTitle,
    summary: ai.heroDescription,
    focusLabel: ai.heroState,
    insights: ai.expertVotes.map((v) => v.reason),
    habits: [],
    generatedAt: ai.generatedAt,
  };
}

export function briefingToActions(briefing: DailyBriefing): SmartAction[] {
  return briefing.insights.slice(0, 3).map((reason, i) => ({
    id: `insight-${i}`,
    kind: 'match',
    title: briefing.headline,
    subtitle: reason,
    priority: 80 - i * 10,
    reason,
  }));
}
