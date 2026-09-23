import type { CoachPlayerEvaluation } from '../models/CoachEvaluation';

export const COACH_RATING_MAX = 10;

export type CoachRatingField = 'overall' | 'technical' | 'tactical' | 'physical' | 'mental';

export type CoachOptionalRatings = CoachPlayerEvaluation['ratings'];

export const COACH_RATING_FIELDS: {
  key: CoachRatingField;
  label: string;
}[] = [
  { key: 'overall', label: 'Note générale' },
  { key: 'technical', label: 'Technique' },
  { key: 'tactical', label: 'Tactique' },
  { key: 'physical', label: 'Physique' },
  { key: 'mental', label: 'Mental' },
];

import type { EvaluationSource, EvaluationStatus } from '../models/TeamEvent';

export function clampCoachRating(value: number): number {
  return Math.min(COACH_RATING_MAX, Math.max(0, Math.round(value * 10) / 10));
}

export function hasAnyCoachRating(ratings: Partial<CoachOptionalRatings> | undefined): boolean {
  if (!ratings) return false;
  return COACH_RATING_FIELDS.some(({ key }) => typeof ratings[key] === 'number');
}

/** Anciennes notes stockées sur 5 sans dimensions — converties à l’affichage. */
export function normalizeCoachOverallRating(
  overall: number | undefined,
  ratings: Partial<CoachOptionalRatings>,
): number | undefined {
  if (overall == null || Number.isNaN(overall)) return undefined;
  const hasDims = COACH_RATING_FIELDS.some(
    ({ key }) => key !== 'overall' && typeof ratings[key] === 'number',
  );
  if (!hasDims && overall <= 5 && overall > 0) return clampCoachRating(overall * 2);
  return clampCoachRating(overall);
}

export function normalizeCoachRatings(
  raw: Partial<CoachOptionalRatings> | undefined,
): CoachOptionalRatings {
  const ratings = raw ?? {};
  const overall = normalizeCoachOverallRating(ratings.overall, ratings);
  const next: CoachOptionalRatings = {};
  if (overall != null) next.overall = overall;
  for (const { key } of COACH_RATING_FIELDS) {
    if (key === 'overall') continue;
    const v = ratings[key];
    if (typeof v === 'number' && !Number.isNaN(v)) {
      next[key] = clampCoachRating(v);
    }
  }
  return next;
}

export function formatCoachRating(value: number | undefined | null): string {
  if (value == null || Number.isNaN(value)) return '—';
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}/10` : `${rounded.toFixed(1)}/10`;
}

export function formatEvaluationSourceLabel(
  source?: EvaluationSource,
  options?: { audience?: 'coach' | 'club' },
): string {
  if (source === 'ai_generated') return 'Généré par IA';
  if (source === 'coach_reviewed') {
    return options?.audience === 'club' ? 'Validé par le staff / club' : 'Validé par le coach';
  }
  return 'Saisie manuelle';
}

export function formatEvaluationStatusLabel(status?: EvaluationStatus): string {
  if (status === 'draft') return 'Brouillon';
  return 'Publié';
}

export function formatCoachRatingsSummary(ratings: CoachOptionalRatings): string | null {
  const normalized = normalizeCoachRatings(ratings);
  const parts: string[] = [];
  for (const { key, label } of COACH_RATING_FIELDS) {
    const v = normalized[key];
    if (v != null) parts.push(`${label.toLowerCase()} ${formatCoachRating(v)}`);
  }
  return parts.length > 0 ? parts.join(', ') : null;
}

export function averageCoachRatings(
  evaluations: CoachPlayerEvaluation[],
  field: CoachRatingField = 'overall',
): number | null {
  const values = evaluations
    .map((e) => normalizeCoachRatings(e.ratings)[field])
    .filter((v): v is number => v != null);
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}
