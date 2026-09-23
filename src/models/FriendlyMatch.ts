import type { GeoPoint } from './User';

/**
 * Matchs amicaux / invitations club ↔ club.
 * OPEN = tableau public · INVITED = invitation dirigée · COUNTERED = contre-proposition
 */
export type FriendlyMatchStatus =
  | 'OPEN'
  | 'INVITED'
  | 'COUNTERED'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'PLAYED'
  | 'CANCELLED'
  | 'DRAFT';

export type FriendlyMatchKind =
  | 'amical'
  | 'preparation'
  | 'tournament'
  | 'other';

export type FriendlyVenueSide = 'home' | 'away' | 'neutral';

export interface FriendlyMatchCounterProposal {
  proposed_by_club_id: string;
  proposed_by_club_name: string;
  date: Date;
  time_label: string;
  city: string;
  venue_side?: FriendlyVenueSide;
  team_label?: string;
  message?: string;
  created_at: Date;
}

export interface FriendlyMatch {
  id: string;
  requester_uid?: string;
  requester_club_id: string;
  requester_club_name: string;
  /** Club destinataire (invitation dirigée). */
  opponent_club_id?: string;
  opponent_club_name?: string;
  /** Équipe / catégorie côté demandeur. */
  requester_team_id?: string;
  requester_team_label?: string;
  /** Équipe adverse ciblée si connue */
  opponent_team_id?: string;
  opponent_team_label?: string;
  location?: GeoPoint;
  city: string;
  date: Date;
  time_label?: string;
  meeting_time_label?: string;
  timezone?: string;
  category: string;
  game_format?: 'foot_11' | 'foot_8' | 'futsal' | string;
  level: string;
  level_type: 'loisir' | 'competition' | 'mixte';
  match_kind?: FriendlyMatchKind;
  venue_side?: FriendlyVenueSide;
  venue_address?: string;
  has_pitch: boolean;
  message?: string;
  status: FriendlyMatchStatus;
  counter_proposal?: FriendlyMatchCounterProposal;
  rules_half_duration_min?: number;
  rules_jerseys?: string;
  rules_refereeing?: string;
  rules_hosting_notes?: string;
  is_external_opponent?: boolean;
  external_opponent_club_name?: string;
  external_opponent_city?: string;
  external_opponent_contact_name?: string;
  external_opponent_contact_phone?: string;
  external_opponent_contact_email?: string;
  linked_event_id?: string;
  created_at: Date;
  updated_at?: Date;
}

export interface CreateFriendlyMatchInput {
  requester_uid: string;
  requester_club_id: string;
  requester_club_name: string;
  /** Invitation dirigée : id du club destinataire. */
  opponent_club_id?: string;
  opponent_club_name?: string;
  requester_team_id?: string;
  requester_team_label?: string;
  opponent_team_id?: string;
  opponent_team_label?: string;
  city: string;
  date: Date;
  time_label: string;
  meeting_time_label?: string;
  timezone?: string;
  category: string;
  game_format?: 'foot_11' | 'foot_8' | 'futsal' | string;
  level: string;
  level_type: 'loisir' | 'competition' | 'mixte';
  match_kind?: FriendlyMatchKind;
  venue_side?: FriendlyVenueSide;
  venue_address?: string;
  message?: string;
  /** OPEN = tableau public · INVITED = invitation ciblée · DRAFT = brouillon. */
  mode?: 'open' | 'direct' | 'draft';
  status?: FriendlyMatchStatus;
  rules_half_duration_min?: number;
  rules_jerseys?: string;
  rules_refereeing?: string;
  rules_hosting_notes?: string;
  is_external_opponent?: boolean;
  external_opponent_club_name?: string;
  external_opponent_city?: string;
  external_opponent_contact_name?: string;
  external_opponent_contact_phone?: string;
  external_opponent_contact_email?: string;
  linked_event_id?: string;
  location?: GeoPoint;
}

export interface CounterProposeFriendlyMatchInput {
  matchId: string;
  clubId: string;
  clubName: string;
  date: Date;
  time_label: string;
  city: string;
  venue_side?: FriendlyVenueSide;
  team_label?: string;
  message?: string;
}

export const FRIENDLY_MATCH_KIND_LABELS: Record<FriendlyMatchKind, string> = {
  amical: 'Amical',
  preparation: 'Préparation',
  tournament: 'Tournoi',
  other: 'Autre',
};

export const FRIENDLY_VENUE_LABELS: Record<FriendlyVenueSide, string> = {
  home: 'Domicile',
  away: 'Extérieur',
  neutral: 'Terrain neutre',
};

export const FRIENDLY_STATUS_LABELS: Record<FriendlyMatchStatus, string> = {
  OPEN: 'Ouvert',
  INVITED: 'Invitation envoyée',
  COUNTERED: 'Contre-proposition',
  ACCEPTED: 'Confirmé',
  DECLINED: 'Refusé',
  PLAYED: 'Joué',
  CANCELLED: 'Annulé',
  DRAFT: 'Brouillon',
};
