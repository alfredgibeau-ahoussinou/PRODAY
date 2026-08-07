/**
 * Bourse de recrutement interne (club) + propositions entre équipes.
 * L’IA aide à identifier des profils — elle ne décide pas.
 */

export type RosterNeedScope = 'internal' | 'external';

export type RosterNeedStatus = 'open' | 'filled' | 'closed';

export type InternalMoveStatus =
  | 'proposed'
  | 'discussing'
  | 'accepted'
  | 'declined'
  | 'pending_club'
  | 'completed';

export type RosterPositionId =
  | 'goalkeeper'
  | 'defender'
  | 'fullback'
  | 'midfielder'
  | 'winger'
  | 'forward'
  | 'striker'
  | 'other';

export const ROSTER_POSITION_LABELS: Record<RosterPositionId, string> = {
  goalkeeper: 'Gardien',
  defender: 'Défenseur central',
  fullback: 'Latéral',
  midfielder: 'Milieu',
  winger: 'Ailier',
  forward: 'Attaquant',
  striker: 'Buteur',
  other: 'Autre',
};

export const INTERNAL_MOVE_STATUS_LABELS: Record<InternalMoveStatus, string> = {
  proposed: 'Proposition envoyée',
  discussing: 'En discussion',
  accepted: 'Acceptée',
  declined: 'Refusée',
  pending_club: 'En attente de validation du club',
  completed: 'Intégration effectuée',
};

export interface ClubRosterNeed {
  id: string;
  club_id: string;
  team_id: string;
  team_label: string;
  category: string;
  position: RosterPositionId;
  position_detail?: string;
  level?: string;
  preferred_foot?: 'left' | 'right' | 'both' | 'any';
  profile_notes?: string;
  players_needed: number;
  needed_by?: Date;
  scope: RosterNeedScope;
  status: RosterNeedStatus;
  created_by_uid: string;
  created_by_name: string;
  created_at: Date;
  updated_at?: Date;
}

export interface CreateClubRosterNeedInput {
  club_id: string;
  team_id: string;
  team_label: string;
  category: string;
  position: RosterPositionId;
  position_detail?: string;
  level?: string;
  preferred_foot?: ClubRosterNeed['preferred_foot'];
  profile_notes?: string;
  players_needed: number;
  needed_by?: Date;
  scope?: RosterNeedScope;
  created_by_uid: string;
  created_by_name: string;
}

export interface InternalMoveProposal {
  id: string;
  club_id: string;
  need_id?: string;
  player_uid: string;
  player_name: string;
  from_team_id: string;
  from_team_label: string;
  to_team_id: string;
  to_team_label: string;
  proposed_by_uid: string;
  proposed_by_name: string;
  current_coach_uid?: string;
  match_score?: number;
  match_reasons?: string[];
  message?: string;
  status: InternalMoveStatus;
  created_at: Date;
  updated_at?: Date;
}

export interface CreateInternalMoveInput {
  club_id: string;
  need_id?: string;
  player_uid: string;
  player_name: string;
  from_team_id: string;
  from_team_label: string;
  to_team_id: string;
  to_team_label: string;
  proposed_by_uid: string;
  proposed_by_name: string;
  current_coach_uid?: string;
  match_score?: number;
  match_reasons?: string[];
  message?: string;
}

export interface RosterMatchCandidate {
  player_uid: string;
  display_name: string;
  team_id?: string;
  team_label: string;
  category?: string;
  position?: string;
  preferred_foot?: string;
  score: number;
  reasons: string[];
  tier: 'strong' | 'good' | 'possible';
}

export type CreateExternalRosterPostInput = CreateClubRosterNeedInput & {
  contact_label?: string;
};
