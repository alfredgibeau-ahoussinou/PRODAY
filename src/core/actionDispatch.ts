import type { User } from '../models/User';
import { computeHealthSnapshot } from './health/healthState.engine';
import { getProfileCompletion } from '../utils/profileCompletion';
import type { HealthSnapshot } from './types/health';

export type UserActionKind =
  | 'join_match'
  | 'view_reel'
  | 'send_message'
  | 'open_mercato'
  | 'complete_profile'
  | 'book_health'
  | 'publish_mercato'
  | 'review_application';

export interface ActionContext {
  upcomingEventsCount: number;
  pendingConvocations: number;
  recentMatchCount: number;
  streakDays: number;
  globalScore: number;
}

export interface ActionDispatchResult {
  health: HealthSnapshot;
  progressionDelta: { xp: number; reason: string };
  shouldRefreshRecommendations: boolean;
}

const XP_BY_ACTION: Record<UserActionKind, number> = {
  join_match: 25,
  view_reel: 3,
  send_message: 8,
  open_mercato: 5,
  complete_profile: 15,
  book_health: 12,
  publish_mercato: 18,
  review_application: 10,
};

/** RULE 3 — chaque action met à jour santé, reco, progression (spec §14). */
export function dispatchUserAction(
  user: User,
  action: UserActionKind,
  context: ActionContext
): ActionDispatchResult {
  const completion = getProfileCompletion(user).percent;
  let recentMatches = context.recentMatchCount;
  let events = context.upcomingEventsCount;

  if (action === 'join_match') {
    recentMatches += 1;
    events += 1;
  }

  const health = computeHealthSnapshot({
    globalScore: context.globalScore,
    upcomingEventsCount: events,
    pendingConvocations: context.pendingConvocations,
    recentMatchCount: recentMatches,
    streakDays: context.streakDays,
    profileCompletion: completion,
  });

  return {
    health,
    progressionDelta: {
      xp: XP_BY_ACTION[action],
      reason: action,
    },
    shouldRefreshRecommendations: true,
  };
}
