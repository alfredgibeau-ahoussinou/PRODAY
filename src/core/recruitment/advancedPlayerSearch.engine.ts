/**
 * Advanced player directory filters — staff search beyond basic Mercato chips.
 */

import type { RecruitmentFilters } from '../../models/Player';
import type { User } from '../../models/User';
import { playerLevelMatchesFilter, resolvePlayerLevel } from '../../utils/playerLevelBadge';
import { hasJoueurVerifieBadge } from '../../utils/proPlayerVerification';
import { getProfileCompletion } from '../../utils/profileCompletion';
import { distanceBetween } from '../../utils/geoLocation';
import { computeOpportunityScore } from './opportunityScore.engine';

export interface AdvancedPlayerSearchFilters extends RecruitmentFilters {
  availability?: Array<'available' | 'unavailable' | 'negotiating'>;
  verified_only?: boolean;
  min_profile_completion?: number;
  min_pulse?: number;
  has_highlights?: boolean;
  strong_foot?: 'left' | 'right' | 'both';
  min_age?: number;
  max_age?: number;
  min_opportunity_score?: number;
  /** Viewer for Opportunity Score / geo. */
  viewer?: User;
  pulseByUid?: Record<string, number>;
  /** Origin for distance filter when post location absent. */
  origin?: { latitude: number; longitude: number };
}

function normalize(value?: string | null): string {
  return value?.trim().toLowerCase() ?? '';
}

function matchesText(hay?: string, needle?: string): boolean {
  if (!needle) return true;
  if (!hay) return false;
  return normalize(hay).includes(normalize(needle));
}

export function playerMatchesAdvancedFilters(
  player: User,
  filters: AdvancedPlayerSearchFilters
): boolean {
  if (player.role !== 'player') return false;
  const profile = player.profile;

  if (filters.position && !matchesText(profile.position, filters.position)) return false;
  if (filters.category && !matchesText(profile.category, filters.category)) return false;
  if (filters.level && !matchesText(profile.level, filters.level)) return false;
  if (filters.city && !matchesText(player.city, filters.city)) return false;

  if (filters.player_level) {
    const levelId = resolvePlayerLevel(player);
    if (!playerLevelMatchesFilter(levelId, filters.player_level)) return false;
  }

  if (filters.availability?.length) {
    const a = profile.availability;
    if (!a || !filters.availability.includes(a)) return false;
  }

  if (filters.verified_only && !hasJoueurVerifieBadge(player)) return false;

  if (filters.min_profile_completion != null) {
    if (getProfileCompletion(player).percent < filters.min_profile_completion) return false;
  }

  if (filters.has_highlights) {
    const n = profile.highlight_video_urls?.filter(Boolean).length ?? 0;
    if (n < 1) return false;
  }

  if (filters.strong_foot && profile.strong_foot !== filters.strong_foot) return false;

  if (filters.min_age != null && (profile.age == null || profile.age < filters.min_age)) {
    return false;
  }
  if (filters.max_age != null && (profile.age == null || profile.age > filters.max_age)) {
    return false;
  }

  if (filters.min_pulse != null) {
    const pulse = filters.pulseByUid?.[player.uid];
    if (pulse == null || pulse < filters.min_pulse) return false;
  }

  if (filters.max_distance_km != null && filters.origin) {
    const dist = distanceBetween(player.location, filters.origin);
    if (dist == null || dist > filters.max_distance_km) return false;
  }

  if (filters.min_opportunity_score != null && filters.viewer) {
    const opp = computeOpportunityScore({
      player,
      viewer: filters.viewer,
      pulseScore: filters.pulseByUid?.[player.uid],
    });
    if (opp.score < filters.min_opportunity_score) return false;
  }

  return true;
}

export function filterPlayersAdvanced(
  players: User[],
  filters: AdvancedPlayerSearchFilters
): User[] {
  return players.filter((p) => playerMatchesAdvancedFilters(p, filters));
}

export function countActiveAdvancedFilters(filters: AdvancedPlayerSearchFilters): number {
  let n = 0;
  if (filters.position) n += 1;
  if (filters.category) n += 1;
  if (filters.level) n += 1;
  if (filters.city) n += 1;
  if (filters.player_level && filters.player_level !== 'all') n += 1;
  if (filters.availability?.length) n += 1;
  if (filters.verified_only) n += 1;
  if (filters.min_profile_completion != null) n += 1;
  if (filters.min_pulse != null) n += 1;
  if (filters.has_highlights) n += 1;
  if (filters.strong_foot) n += 1;
  if (filters.min_age != null || filters.max_age != null) n += 1;
  if (filters.max_distance_km != null) n += 1;
  if (filters.min_opportunity_score != null) n += 1;
  return n;
}
