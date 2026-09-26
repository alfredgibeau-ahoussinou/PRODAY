/**
 * Modèle pour le bilan de mi-saison et l'auto-évaluation du joueur avec son coach.
 * Sépare clairement l'auto-évaluation du joueur des observations du coach.
 */

export type ReviewStatus = 'draft' | 'submitted_by_player' | 'completed_by_coach';

export interface PlayerSelfAssessment {
  reflections: string; // Ressenti sur la première partie de saison
  strengths: string[]; // Points forts perçus
  areas_to_improve: string[]; // Axes de travail prioritaires
  self_rating_mental?: number; // 1 à 10
  self_rating_technical?: number;
  self_rating_physical?: number;
  satisfaction_rating?: number;
  submitted_at?: Date;
}

export interface CoachReviewObservations {
  coach_uid: string;
  coach_name: string;
  general_feedback: string;
  confirmed_strengths: string[];
  recommended_work_axes: string[];
  agreed_goals: string[]; // Objectifs convenus d'ici la fin de saison
  next_review_date?: Date; // Prochain point d'étape planifié
  reviewed_at?: Date;
}

export interface PlayerMidSeasonReview {
  id: string;
  club_id: string;
  team_id?: string;
  player_uid: string;
  player_name: string;
  season_label: string; // ex: '2025-2026'

  status: ReviewStatus;

  self_assessment: PlayerSelfAssessment;
  coach_review?: CoachReviewObservations;

  created_at: Date;
  updated_at: Date;
}

export interface CreatePlayerMidSeasonReviewInput {
  club_id: string;
  team_id?: string;
  player_uid: string;
  player_name: string;
  season_label: string;
  self_assessment: PlayerSelfAssessment;
  is_draft?: boolean;
}
