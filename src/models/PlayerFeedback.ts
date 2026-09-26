/**
 * Modèle pour les demandes de feedback sur événement et demandes d'entraînement spécifique.
 */

export type FeedbackRequestStatus = 'pending' | 'answered' | 'closed';

export type FeedbackRequestKind = 'event_feedback' | 'specific_skill';

export interface PlayerFeedbackRequest {
  id: string;
  kind: FeedbackRequestKind;
  player_uid: string;
  player_name: string;
  coach_uid: string;
  coach_name: string;
  club_id?: string;
  team_id?: string;

  // Si lié à un match ou entraînement
  event_id?: string;
  event_title?: string;
  event_date?: Date;

  // Si demande d'entraînement spécifique
  skill_topic?: string; // ex: 'Pied faible', 'Jeu de tête', 'Prise de balle orientée'

  question: string;
  status: FeedbackRequestStatus;

  // Fil de messagerie lié (utilise messagesService)
  thread_id?: string;

  // Réponse synthétique ou clôture par le coach
  coach_response?: string;
  coach_responded_at?: Date;
  closed_at?: Date;

  // Clé d'idempotence pour éviter les doublons sur multi-clic
  idempotency_key?: string;

  created_at: Date;
  updated_at: Date;
}

export interface CreateFeedbackRequestInput {
  kind: FeedbackRequestKind;
  player_uid: string;
  player_name: string;
  coach_uid: string;
  coach_name: string;
  club_id?: string;
  team_id?: string;
  event_id?: string;
  event_title?: string;
  event_date?: Date;
  skill_topic?: string;
  question: string;
  idempotency_key?: string;
}
