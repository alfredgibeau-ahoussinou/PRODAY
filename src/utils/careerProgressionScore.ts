import type { PlayerActivity } from '../models/PlayerActivity';

export type CareerProgressionFacetId = 'performance' | 'activity' | 'visibility' | 'profile';

export interface CareerProgressionFacet {
  id: CareerProgressionFacetId;
  label: string;
  score: number;
}

export interface CareerProgressionInput {
  seasonStats?: { matches: number; goals: number; assists: number };
  activities: PlayerActivity[];
  profileCompletionPercent: number;
  mercatoApplicationsCount?: number;
  streakDays?: number;
  weeklySessionTarget?: number;
}

export interface CareerProgressionResult {
  total: number;
  facets: CareerProgressionFacet[];
  weeklyGoalPercent: number;
  weeklySessionCount: number;
}

const DEFAULT_WEEKLY_SESSION_TARGET = 3;

function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? 6 : day - 1;
  copy.setDate(copy.getDate() - diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function countActivitiesSince(activities: PlayerActivity[], since: Date): number {
  return activities.filter((a) => a.date >= since).length;
}

function computePerformanceScore(stats?: { matches: number; goals: number; assists: number }): number {
  if (!stats || stats.matches <= 0) return 0;
  const matchPart = Math.min(55, stats.matches * 5);
  const contribPart = Math.min(45, stats.goals * 8 + stats.assists * 5);
  return Math.round(Math.min(100, matchPart + contribPart));
}

function computeActivityScore(activities: PlayerActivity[], streakDays = 0): number {
  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);
  const count30 = countActivitiesSince(activities, since30);
  const volumePart = Math.min(70, Math.round((count30 / 12) * 70));
  const streakPart = Math.min(30, Math.round((Math.min(streakDays, 14) / 14) * 30));
  return Math.min(100, volumePart + streakPart);
}

function computeVisibilityScore(applicationsCount = 0): number {
  if (applicationsCount <= 0) return 0;
  return Math.min(100, applicationsCount * 25);
}

export function computeWeeklyGoalPercent(
  activities: PlayerActivity[],
  now = new Date(),
  weeklySessionTarget = DEFAULT_WEEKLY_SESSION_TARGET
): {
  percent: number;
  sessionCount: number;
} {
  const weekStart = startOfWeek(now);
  const sessionCount = countActivitiesSince(activities, weekStart);
  const target = Math.max(1, weeklySessionTarget);
  const percent = Math.min(100, Math.round((sessionCount / target) * 100));
  return { percent, sessionCount };
}

/** Score carrière 0–100 à partir de données réelles uniquement. */
export function computeCareerProgressionScore(input: CareerProgressionInput): CareerProgressionResult {
  const performance = computePerformanceScore(input.seasonStats);
  const activity = computeActivityScore(input.activities, input.streakDays ?? 0);
  const visibility = computeVisibilityScore(input.mercatoApplicationsCount);
  const profile = Math.round(Math.min(100, Math.max(0, input.profileCompletionPercent)));

  const total = Math.round(
    performance * 0.3 + activity * 0.3 + visibility * 0.15 + profile * 0.25
  );

  const { percent: weeklyGoalPercent, sessionCount: weeklySessionCount } =
    computeWeeklyGoalPercent(input.activities, new Date(), input.weeklySessionTarget);

  return {
    total: Math.min(100, Math.max(0, total)),
    facets: [
      { id: 'performance', label: 'Performance', score: performance },
      { id: 'activity', label: 'Activité', score: activity },
      { id: 'visibility', label: 'Visibilité Mercato', score: visibility },
      { id: 'profile', label: 'Profil', score: profile },
    ],
    weeklyGoalPercent,
    weeklySessionCount,
  };
}
