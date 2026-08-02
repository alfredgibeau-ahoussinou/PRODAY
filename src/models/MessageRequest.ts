/**
 * Demandes de message style Instagram — joueur ↔ agent.
 * La conversation n'est active qu'après acceptation.
 */

export type MessageRequestStatus =
  | 'pending'
  | 'accepted'
  | 'refused'
  | 'cancelled';

export type MessageRequestPairKind = 'player_agent' | 'standard';

export interface MessageRequest {
  id: string;
  thread_id: string;
  /** Expéditeur de la première prise de contact. */
  requester_uid: string;
  /** Destinataire qui doit accepter / refuser. */
  recipient_uid: string;
  pair_kind: MessageRequestPairKind;
  status: MessageRequestStatus;
  intro_message?: string;
  created_at: Date;
  updated_at: Date;
  resolved_at?: Date;
}

/** État conversation dérivé de la demande. */
export type ConversationAccessState =
  | 'open'
  | 'request_pending'
  | 'request_refused'
  | 'blocked';
