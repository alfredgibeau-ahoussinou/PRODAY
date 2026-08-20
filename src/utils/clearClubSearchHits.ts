import type { UnifiedTeamRef } from '../services/supporterFootball';

/**
 * Keep previous empty hits so setState does not schedule a re-render when a
 * search effect re-runs because an unstable facade/query dep churned.
 */
export function clearClubSearchHits(prev: UnifiedTeamRef[]): UnifiedTeamRef[] {
  return prev.length === 0 ? prev : [];
}
