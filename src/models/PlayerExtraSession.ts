/**
 * Modèle pour les séances d'entraînement extra organisées entre coéquipiers.
 * IMPORTANT : Ces séances sont distinctes des séances officielles du club.
 * Elles ne comptent pas dans l'assiduité officielle et n'engagent pas la responsabilité club.
 */

export interface ExtraSessionParticipant {
  uid: string;
  display_name: string;
  avatar_url?: string;
  is_minor?: boolean;
  parent_notified?: boolean;
  parent_approved?: boolean;
  joined_at: Date;
}

export interface PlayerExtraSession {
  id: string;
  club_id: string;
  team_id?: string;
  organizer_uid: string;
  organizer_name: string;

  title: string;
  description: string;
  location_name: string; // terrain d'entraînement agréé ou lieu public sûr
  location_address?: string;

  starts_at: Date;
  ends_at: Date;
  max_participants: number;

  participants: ExtraSessionParticipant[];

  is_cancelled: boolean;
  cancellation_reason?: string;

  // Règle de supervision mineurs du club
  requires_parent_supervision: boolean;
  supervising_adult_name?: string;

  created_at: Date;
  updated_at: Date;
}

export interface CreatePlayerExtraSessionInput {
  club_id: string;
  team_id?: string;
  organizer_uid: string;
  organizer_name: string;
  title: string;
  description: string;
  location_name: string;
  location_address?: string;
  starts_at: Date;
  ends_at: Date;
  max_participants: number;
  requires_parent_supervision?: boolean;
}
