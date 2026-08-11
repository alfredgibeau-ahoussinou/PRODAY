/**
 * ProDay Competition Management — season-long leagues / cups.
 * Distinct from Arena tournaments (short-format pools).
 */

export type CompetitionFormat = 'league' | 'cup';

export type CompetitionSeasonStatus = 'draft' | 'active' | 'closed';

export type CompetitionFixtureStatus =
  | 'scheduled'
  | 'live'
  | 'awaiting_validation'
  | 'validated'
  | 'contested'
  | 'void';

export type CompetitionFixtureSource = 'proday' | 'external';

export type CompetitionScheduleMode = 'round_robin' | 'home_away';

export interface CompetitionRules {
  points_win: number;
  points_draw: number;
  points_loss: number;
  /** Hours opposing club can contest after validation */
  contest_hours: number;
}

export const DEFAULT_COMPETITION_RULES: CompetitionRules = {
  points_win: 3,
  points_draw: 1,
  points_loss: 0,
  contest_hours: 48,
};

export interface Competition {
  id: string;
  name: string;
  format: CompetitionFormat;
  category?: string;
  season_label: string;
  organizer_uids: string[];
  club_ids: string[];
  rules: CompetitionRules;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface CompetitionSeason {
  id: string;
  competition_id: string;
  competition_name: string;
  label: string;
  starts_at: Date;
  ends_at?: Date | null;
  status: CompetitionSeasonStatus;
  organizer_uids: string[];
  external_provider?: string | null;
  external_season_id?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CompetitionTeam {
  id: string;
  season_id: string;
  competition_id: string;
  club_id: string;
  team_id?: string | null;
  display_name: string;
  created_at: Date;
}

export interface CompetitionFixture {
  id: string;
  season_id: string;
  competition_id: string;
  matchday: number;
  home_team_id: string;
  away_team_id: string;
  home_name: string;
  away_name: string;
  kickoff_at: Date;
  status: CompetitionFixtureStatus;
  home_score: number | null;
  away_score: number | null;
  team_event_id?: string | null;
  source: CompetitionFixtureSource;
  validated_at?: Date | null;
  validated_by?: string | null;
  contested_at?: Date | null;
  contested_by?: string | null;
  contest_reason?: string | null;
  contest_deadline_at?: Date | null;
  auto_potm_uid?: string | null;
  auto_potm_name?: string | null;
  ai_summary?: string | null;
  highlight_urls?: string[];
  external_fixture_id?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CompetitionStandingRow {
  team_id: string;
  display_name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

export interface CompetitionStandingsDoc {
  id: string;
  season_id: string;
  competition_id: string;
  rows: CompetitionStandingRow[];
  updated_at: Date;
}

export interface PlayerCompetitionStats {
  id: string;
  season_id: string;
  competition_id: string;
  uid: string;
  display_name: string;
  team_id?: string | null;
  matches: number;
  minutes: number;
  goals: number;
  assists: number;
  clean_sheets: number;
  yellow_cards: number;
  red_cards: number;
  rating_sum: number;
  rating_count: number;
  motm: number;
  updated_at: Date;
}

export type CompetitionClaimKind = 'submit' | 'validate' | 'contest' | 'resolve_contest';

export interface CompetitionResultClaim {
  id: string;
  fixture_id: string;
  season_id: string;
  kind: CompetitionClaimKind;
  actor_uid: string;
  home_score?: number | null;
  away_score?: number | null;
  note?: string | null;
  created_at: Date;
}

export interface CreateCompetitionInput {
  name: string;
  format?: CompetitionFormat;
  category?: string;
  season_label: string;
  organizer_uids: string[];
  club_ids?: string[];
  created_by: string;
  rules?: Partial<CompetitionRules>;
}

export interface CreateSeasonInput {
  competition_id: string;
  label: string;
  starts_at: Date;
  ends_at?: Date | null;
  organizer_uids: string[];
}

export interface AddCompetitionTeamInput {
  season_id: string;
  club_id: string;
  display_name: string;
  team_id?: string | null;
}
