/** Plan de séance d’entraînement (attaché à un TeamEvent). */
export interface TrainingSessionPlan {
  focus?: string;
  notes?: string;
  duration_min?: number;
  objective_ids?: string[];
}

export type CoachEvaluationContext = 'match' | 'training' | 'season';

/** Évaluation individuelle joueur par le coach. */
export interface CoachPlayerEvaluation {
  id: string;
  club_id: string;
  team_id?: string;
  player_uid: string;
  player_name: string;
  coach_uid: string;
  coach_name: string;
  event_id?: string;
  context: CoachEvaluationContext;
  /** Notes 1–5 par critère */
  ratings: {
    technical?: number;
    tactical?: number;
    physical?: number;
    mental?: number;
    overall: number;
  };
  notes?: string;
  visible_to_player?: boolean;
  visible_to_parent?: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCoachEvaluationInput {
  club_id: string;
  team_id?: string;
  player_uid: string;
  player_name: string;
  event_id?: string;
  context: CoachEvaluationContext;
  ratings: CoachPlayerEvaluation['ratings'];
  notes?: string;
  visible_to_player?: boolean;
  visible_to_parent?: boolean;
}
