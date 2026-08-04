/**
 * Scout report model — structured evaluations for clubs / agents / recruiters.
 * Inspired by industry practice (attribute frameworks, trial notes) but
 * original ProDay schema tied to Pulse, pipeline stages, and Opportunity Score.
 */

import type { ClubApplicationStage } from './ClubApplicationPipeline';

export type ScoutReportAttributeId =
  | 'technique'
  | 'tactique'
  | 'physique'
  | 'mental'
  | 'potentiel'
  | 'attitude';

export type ScoutReportRecommendation =
  | 'sign'
  | 'trial'
  | 'monitor'
  | 'pass'
  | 'need_more_data';

export type ScoutReportVisibility = 'private' | 'club' | 'shared_agents';

export interface ScoutReportAttribute {
  id: ScoutReportAttributeId;
  /** 1–5 scale. */
  rating: number;
  note?: string;
}

export interface ScoutReport {
  id: string;
  player_uid: string;
  author_uid: string;
  club_id?: string;
  match_event_id?: string;
  application_id?: string;
  /** Optional link into club kanban. */
  pipeline_stage?: ClubApplicationStage;
  title: string;
  observed_at: Date;
  created_at: Date;
  updated_at: Date;
  attributes: ScoutReportAttribute[];
  overall_rating: number;
  recommendation: ScoutReportRecommendation;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  /** Highlight / reel URLs observed (ProDay media, not third-party scrape). */
  media_urls?: string[];
  visibility: ScoutReportVisibility;
  /** Opportunity Score snapshot at report time (0–100). */
  opportunity_score_snapshot?: number;
  tags?: string[];
}

export const SCOUT_REPORT_ATTRIBUTE_LABELS: Record<ScoutReportAttributeId, string> = {
  technique: 'Technique',
  tactique: 'Tactique',
  physique: 'Physique',
  mental: 'Mental',
  potentiel: 'Potentiel',
  attitude: 'Attitude',
};

export const SCOUT_REPORT_RECOMMENDATION_LABELS: Record<ScoutReportRecommendation, string> = {
  sign: 'Signer',
  trial: 'Essai',
  monitor: 'Surveiller',
  pass: 'Passer',
  need_more_data: 'Besoin de données',
};

export const DEFAULT_SCOUT_ATTRIBUTES: ScoutReportAttributeId[] = [
  'technique',
  'tactique',
  'physique',
  'mental',
  'potentiel',
  'attitude',
];
