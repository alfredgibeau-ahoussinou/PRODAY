/**
 * ProDay exclusives — AI summaries, talent radar, recruitment form signals, highlights.
 */
import type { CompetitionFixture, PlayerCompetitionStats } from '../models/Competition';

export interface TalentRadarEntry {
  uid: string;
  display_name: string;
  score: number;
  minutes: number;
  rating_avg: number | null;
  goals: number;
  assists: number;
  trajectory: 'rising' | 'stable' | 'cooling';
}

export interface RecruitmentFormSignal {
  uid: string;
  display_name: string;
  recent_goals: number;
  recent_assists: number;
  form_spike: boolean;
  signal_strength: number;
  note: string;
}

/** Heuristic talent radar from season aggregates (minutes + rating trajectory proxy). */
export function buildTalentRadar(
  stats: PlayerCompetitionStats[],
  categoryMinutesFloor = 180,
  limit = 15,
): TalentRadarEntry[] {
  return stats
    .filter((s) => s.minutes >= categoryMinutesFloor)
    .map((s) => {
      const ratingAvg = s.rating_count > 0 ? s.rating_sum / s.rating_count : null;
      const per90Goals = s.minutes > 0 ? (s.goals * 90) / s.minutes : 0;
      const per90Assists = s.minutes > 0 ? (s.assists * 90) / s.minutes : 0;
      const score =
        (ratingAvg ?? 6) * 10 +
        per90Goals * 8 +
        per90Assists * 5 +
        Math.min(s.minutes / 90, 20) +
        s.motm * 3;
      const trajectory: TalentRadarEntry['trajectory'] =
        score >= 85 ? 'rising' : score <= 55 ? 'cooling' : 'stable';
      return {
        uid: s.uid,
        display_name: s.display_name,
        score: Math.round(score * 10) / 10,
        minutes: s.minutes,
        rating_avg: ratingAvg != null ? Math.round(ratingAvg * 10) / 10 : null,
        goals: s.goals,
        assists: s.assists,
        trajectory,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Form spike signals for Mercato / recruiter matching.
 * Uses season totals as proxy for "last N matches" when detailed match logs unavailable.
 */
export function buildRecruitmentFormSignals(
  stats: PlayerCompetitionStats[],
  opts?: { minGoals?: number; minAssists?: number; limit?: number },
): RecruitmentFormSignal[] {
  const minGoals = opts?.minGoals ?? 3;
  const minAssists = opts?.minAssists ?? 3;
  const limit = opts?.limit ?? 20;

  return stats
    .map((s) => {
      const perMatchGoals = s.matches > 0 ? s.goals / s.matches : 0;
      const perMatchAssists = s.matches > 0 ? s.assists / s.matches : 0;
      const form_spike =
        (s.goals >= minGoals && perMatchGoals >= 0.4) ||
        (s.assists >= minAssists && perMatchAssists >= 0.35);
      const signal_strength = Math.round(
        (s.goals * 2 + s.assists * 1.5 + (form_spike ? 5 : 0) + s.motm) * 10,
      ) / 10;
      return {
        uid: s.uid,
        display_name: s.display_name,
        recent_goals: s.goals,
        recent_assists: s.assists,
        form_spike,
        signal_strength,
        note: form_spike
          ? `Pic de forme — ${s.goals} buts / ${s.assists} PD sur ${s.matches} matchs`
          : `Volume correct — ${s.goals}G ${s.assists}PD`,
      };
    })
    .filter((s) => s.form_spike || s.signal_strength >= 8)
    .sort((a, b) => b.signal_strength - a.signal_strength)
    .slice(0, limit);
}

/** Deterministic local AI-style match summary (client / CF can replace with LLM). */
export function buildFixtureAiSummary(fixture: CompetitionFixture): string {
  const hs = fixture.home_score;
  const as = fixture.away_score;
  if (hs == null || as == null) {
    return `${fixture.home_name} reçoit ${fixture.away_name} (J${fixture.matchday}).`;
  }
  const winner =
    hs > as ? fixture.home_name : as > hs ? fixture.away_name : null;
  const margin = Math.abs(hs - as);
  const potm = fixture.auto_potm_name ? ` Homme du match : ${fixture.auto_potm_name}.` : '';
  if (!winner) {
    return `Match nul ${hs}-${as} entre ${fixture.home_name} et ${fixture.away_name}.${potm}`;
  }
  const tone =
    margin >= 3
      ? 'large victoire'
      : margin === 1
        ? 'succès serré'
        : 'victoire maîtrisée';
  return `${winner} s'impose (${tone}) ${hs}-${as} face à ${
    winner === fixture.home_name ? fixture.away_name : fixture.home_name
  }.${potm}`;
}

export function attachHighlightLinks(
  existing: string[] | undefined,
  urls: string[],
): string[] {
  const set = new Set([...(existing ?? []), ...urls.map((u) => u.trim()).filter(Boolean)]);
  return [...set];
}

/** Boost recruiter matching score when form spike present. */
export function competitionFormMatchingBoost(signal: RecruitmentFormSignal | undefined): number {
  if (!signal) return 0;
  if (signal.form_spike) return Math.min(25, 10 + signal.signal_strength);
  return Math.min(10, signal.signal_strength / 2);
}
