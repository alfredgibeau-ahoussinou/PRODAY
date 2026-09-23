import type {
  EvaluationSource,
  EvaluationStatus,
  PlayerStatAuditEntry,
  PlayerStatClip,
} from './TeamEvent';

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
  /** Notes optionnelles /10 par critère — 0 est une note valide, undefined = non noté. */
  ratings: {
    overall?: number;
    technical?: number;
    tactical?: number;
    physical?: number;
    mental?: number;
  };
  notes?: string;
  rating_explanation?: string;

  // Provenance & publication status
  source?: EvaluationSource;
  status?: EvaluationStatus;

  // AI evaluation metadata
  ai_confidence?: number;
  ai_uncertainty_reason?: string;
  ai_clips?: PlayerStatClip[];

  // Audit trail
  history?: PlayerStatAuditEntry[];

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
  rating_explanation?: string;
  source?: EvaluationSource;
  status?: EvaluationStatus;
  ai_confidence?: number;
  ai_uncertainty_reason?: string;
  ai_clips?: PlayerStatClip[];
  history?: PlayerStatAuditEntry[];
  visible_to_player?: boolean;
  visible_to_parent?: boolean;
}
