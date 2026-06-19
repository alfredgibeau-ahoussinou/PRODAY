export type TournamentStatus = 'open' | 'in_progress' | 'finished';

export interface TournamentRegistration {
  id: string;
  club_id: string;
  club_name: string;
  captain_uid: string;
  captain_name: string;
  player_uids: string[];
  player_names: string[];
  paid: boolean;
  registered_at: Date;
}

export interface TournamentPool {
  id: string;
  name: string;
  registration_ids: string[];
}

export interface TournamentFixture {
  id: string;
  pool_id: string;
  home_registration_id: string;
  away_registration_id: string;
  home_name: string;
  away_name: string;
  home_score: number | null;
  away_score: number | null;
  played: boolean;
}

export interface PoolStandingRow {
  registration_id: string;
  club_name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  points: number;
}

export interface Tournament {
  id: string;
  title: string;
  description?: string;
  city: string;
  starts_at: Date;
  ends_at?: Date;
  max_teams: number;
  entry_fee_cents: number;
  categories: string[];
  organizer_uid: string;
  organizer_name: string;
  status: TournamentStatus;
  registrations: TournamentRegistration[];
  pools: TournamentPool[];
  fixtures: TournamentFixture[];
  standings: Record<string, PoolStandingRow[]>;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTournamentInput {
  title: string;
  description?: string;
  city: string;
  starts_at: Date;
  ends_at?: Date;
  max_teams: number;
  entry_fee_cents: number;
  categories: string[];
  organizer_uid: string;
  organizer_name: string;
}

export interface RegisterTournamentTeamInput {
  tournament_id: string;
  club_id: string;
  club_name: string;
  captain_uid: string;
  captain_name: string;
  player_uids: string[];
  player_names: string[];
}
