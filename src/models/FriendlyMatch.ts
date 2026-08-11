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
  | 'CANCELLED';

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
  location?: GeoPoint;
  city: string;
  date: Date;
  time_label?: string;
  category: string;
  level: string;
  level_type: 'loisir' | 'competition' | 'mixte';
  match_kind?: FriendlyMatchKind;
  venue_side?: FriendlyVenueSide;
  has_pitch: boolean;
  message?: string;
  status: FriendlyMatchStatus;
  counter_proposal?: FriendlyMatchCounterProposal;
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
  city: string;
  date: Date;
  time_label: string;
  category: string;
  level: string;
  level_type: 'loisir' | 'competition' | 'mixte';
  match_kind?: FriendlyMatchKind;
  venue_side?: FriendlyVenueSide;
  message?: string;
  /** OPEN = tableau public · INVITED = invitation ciblée. */
  mode?: 'open' | 'direct';
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
};
