/**
 * Modèles pour le système de progression et quêtes football de l'Espace Joueur ProDay.
 * Inspiré de la sensation de progression par quêtes (Solo Leveling), centré sur le football réel,
 * sans copie de marque, d'illustrations fantastiques ni d'éléments arbitraires.
 */

export type ProgressionRank =
  | 'wood'
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond';

export type ObjectiveCategory =
  | 'technical'
  | 'tactical'
  | 'physical'
  | 'mental'
  | 'match_preparation'
  | 'reflection';

export type ObjectiveStatus =
  | 'available'
  | 'active'
  | 'submitted'
  | 'awaiting_validation'
  | 'completed'
  | 'paused'
  | 'cancelled'
  | 'needs_revision';

export type ObjectivePositionFamily =
  | 'universal'
  | 'goalkeeper'
  | 'defender'
  | 'midfielder'
  | 'forward';

export type ObjectiveActionKind =
  | 'open_individual_program'
  | 'open_tactical_role'
  | 'open_video_clips'
  | 'open_journal'
  | 'open_mid_season_review'
  | 'open_checklist'
  | 'open_feedback'
  | 'open_calendar';

export interface ProgressionObjective {
  id: string;
  template_id: string;
  player_uid: string;
  club_id?: string;
  team_id?: string;

  title: string;
  action_description: string;
  purpose: string; // Finalité sportive explicite
  measurable_condition: string; // Condition mesurable de réussite

  category: ObjectiveCategory;
  target_position: ObjectivePositionFamily;

  due_date?: Date;
  period_label?: string; // ex: 'Cette semaine', 'Cycle 1', 'Avant le 15 Nov'

  is_coach_assigned: boolean;
  coach_uid?: string;
  coach_name?: string;
  requires_coach_validation: boolean;

  xp_reward: number;
  milestone_key?: string; // Si lié à un jalon de rang

  status: ObjectiveStatus;
  progress_current: number;
  progress_target: number;
  progress_unit: string; // ex: 'séances', 'clips', 'recherches', 'validé'

  player_notes?: string;
  player_submitted_at?: Date;

  coach_feedback?: string;
  coach_validated_at?: Date;

  safety_or_participation_conditions?: string;

  action_kind: ObjectiveActionKind;
  action_target_id?: string;

  created_at: Date;
  updated_at: Date;
}

export interface XpLedgerEntry {
  id: string;
  player_uid: string;
  source_event: string; // ex: 'objective_completed', 'coach_validated_program', 'clip_analyzed'
  objective_id?: string;
  amount: number;
  rule_version: string;
  completion_status: 'self_reported' | 'system_observed' | 'coach_validated';
  awarded_at: Date;
  idempotency_key: string;
  is_reversed?: boolean;
  reversal_reason?: string;
}

export interface RankMilestoneRequirement {
  milestone_key: string;
  title: string;
  description: string;
  target_count: number;
  requires_coach_validation: boolean;
  independent_alternative?: string; // Parcours pour joueur sans club
}

export interface RankDefinition {
  rank: ProgressionRank;
  name_fr: string;
  name_en: string;
  order: number; // 0 = Bois, 5 = Diamant
  required_level: number;
  min_total_xp: number;
  emblem_symbol: string;
  material_description: string;
  title_unlocked: string;
  milestones: RankMilestoneRequirement[];
}

export interface PlayerProgressionProfile {
  player_uid: string;
  rank: ProgressionRank;
  level: number;
  total_xp: number;
  xp_into_level: number;
  xp_for_next_level: number;
  active_objective_ids: string[];
  completed_objective_ids: string[];
  completed_milestones: Record<string, number>; // milestone_key -> count
  unlocked_titles: string[];
  current_title: string;
  rule_version: string;
  last_activity_date?: string;
  updated_at: Date;
}

export interface LevelThreshold {
  level: number;
  xp_required_total: number;
  xp_for_this_level: number;
  rank_cap: ProgressionRank;
}
