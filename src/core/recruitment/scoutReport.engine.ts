/**
 * Scout report helpers — average ratings, recommendation suggestions,
 * and draft creation from Opportunity Score context.
 */

import {
  DEFAULT_SCOUT_ATTRIBUTES,
  SCOUT_REPORT_RECOMMENDATION_LABELS,
  type ScoutReport,
  type ScoutReportAttribute,
  type ScoutReportAttributeId,
  type ScoutReportRecommendation,
} from '../../models/ScoutReport';
import type { OpportunityBand } from './opportunityScore.engine';

export function clampScoutRating(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(5, Math.max(1, Math.round(value)));
}

export function averageAttributeRating(attributes: ScoutReportAttribute[]): number {
  if (attributes.length === 0) return 0;
  const sum = attributes.reduce((acc, a) => acc + clampScoutRating(a.rating), 0);
  return Math.round((sum / attributes.length) * 10) / 10;
}

export function emptyScoutAttributes(
  ids: ScoutReportAttributeId[] = DEFAULT_SCOUT_ATTRIBUTES
): ScoutReportAttribute[] {
  return ids.map((id) => ({ id, rating: 3 }));
}

/** Map Opportunity band → default scout recommendation. */
export function recommendFromOpportunityBand(band: OpportunityBand): ScoutReportRecommendation {
  switch (band) {
    case 'excellent':
      return 'sign';
    case 'strong':
      return 'trial';
    case 'fair':
      return 'monitor';
    default:
      return 'need_more_data';
  }
}

export function scoutRecommendationLabel(rec: ScoutReportRecommendation): string {
  return SCOUT_REPORT_RECOMMENDATION_LABELS[rec];
}

export interface ScoutReportDraftInput {
  playerUid: string;
  authorUid: string;
  clubId?: string;
  title: string;
  attributes?: ScoutReportAttribute[];
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  opportunityBand?: OpportunityBand;
  opportunityScore?: number;
  mediaUrls?: string[];
  recommendation?: ScoutReportRecommendation;
}

/** Build a local draft (caller persists via service). */
export function buildScoutReportDraft(input: ScoutReportDraftInput): Omit<ScoutReport, 'id'> {
  const attributes = input.attributes ?? emptyScoutAttributes();
  const overall = averageAttributeRating(attributes);
  const recommendation =
    input.recommendation ??
    (input.opportunityBand
      ? recommendFromOpportunityBand(input.opportunityBand)
      : overall >= 4.2
        ? 'sign'
        : overall >= 3.5
          ? 'trial'
          : overall >= 2.8
            ? 'monitor'
            : 'pass');

  const now = new Date();
  return {
    player_uid: input.playerUid,
    author_uid: input.authorUid,
    club_id: input.clubId,
    title: input.title.trim() || 'Rapport de scouting',
    observed_at: now,
    created_at: now,
    updated_at: now,
    attributes,
    overall_rating: overall,
    recommendation,
    summary: input.summary?.trim() ?? '',
    strengths: input.strengths ?? [],
    weaknesses: input.weaknesses ?? [],
    media_urls: input.mediaUrls,
    visibility: 'club',
    opportunity_score_snapshot: input.opportunityScore,
  };
}

export function isScoutReportComplete(report: Pick<ScoutReport, 'summary' | 'attributes' | 'recommendation'>): boolean {
  return (
    report.summary.trim().length >= 20 &&
    report.attributes.length >= 4 &&
    report.attributes.every((a) => a.rating >= 1 && a.rating <= 5) &&
    Boolean(report.recommendation)
  );
}
