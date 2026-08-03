import type { PlayerActivity } from '../models/PlayerActivity';

export type MatchResult = 'win' | 'draw' | 'loss';

export interface MatchRatingInput {
  goals?: number;
  assists?: number;
  yellow_cards?: number;
  red_cards?: number;
  minutes_played?: number;
  clean_sheet?: boolean;
  match_result?: MatchResult;
  rating_self?: number;
  is_goalkeeper?: boolean;
  performance_tags_count?: number;
}

/**
 * Note Pulse ProDay (style Tonsser) — score 1.0–10.0 par match.
 * Basée uniquement sur des données déclarées (pas de tracking GPS).
 */
export function computeMatchPulseRating(input: MatchRatingInput): number {
  let score = 5.5;

  const minutes = Math.max(0, Math.min(120, input.minutes_played ?? 90));
  score += Math.min(1.2, (minutes / 90) * 1.2 - 0.6);

  const goals = Math.max(0, input.goals ?? 0);
  const assists = Math.max(0, input.assists ?? 0);
  score += Math.min(2.5, goals * 0.85);
  score += Math.min(1.8, assists * 0.55);

  if (input.clean_sheet) {
    score += input.is_goalkeeper ? 1.2 : 0.45;
  }

  if (input.match_result === 'win') score += 0.4;
  if (input.match_result === 'loss') score -= 0.25;

  score -= Math.min(1.5, (input.yellow_cards ?? 0) * 0.35);
  score -= Math.min(3, (input.red_cards ?? 0) * 1.8);

  const tags = Math.max(0, input.performance_tags_count ?? 0);
  score += Math.min(0.6, tags * 0.15);

  if (input.rating_self != null && Number.isFinite(input.rating_self)) {
    const self = Math.max(1, Math.min(10, input.rating_self));
    score = score * 0.85 + self * 0.15;
  }

  return Math.round(Math.max(1, Math.min(10, score)) * 10) / 10;
}

export function averagePulseRating(activities: PlayerActivity[], maxMatches = 20): number | null {
  const matches = activities
    .filter((a) => a.type === 'match' && a.rating_pulse != null)
    .slice(0, maxMatches);
  if (!matches.length) return null;
  const sum = matches.reduce((acc, a) => acc + (a.rating_pulse ?? 0), 0);
  return Math.round((sum / matches.length) * 10) / 10;
}

export function formatPulseRating(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return value.toFixed(1);
}
