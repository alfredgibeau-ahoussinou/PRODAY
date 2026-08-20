export type ExternalCompetitionId =
  | 'ligue1'
  | 'd1f'
  | 'pl'
  | 'laliga'
  | 'seriea'
  | 'bundesliga'
  | 'ucl'
  | 'uel'
  | 'ligue2'
  | 'world_cup'
  | 'other';

export type ExternalFixtureStatus = 'scheduled' | 'live' | 'finished';

export interface ExternalFixture {
  id: string;
  /** Slug interne (ligue1, pl, …) ou `other` si ligue inconnue. */
  competition: ExternalCompetitionId;
  /** Nom affiché — provient de l’API (`league.name`). */
  competition_label: string;
  /** Identifiant ligue API-Football. */
  league_id?: number;
  /** Identifiant fixture API-Football (pour lineups/events). */
  api_fixture_id?: number;
  home_team: string;
  away_team: string;
  home_team_id?: number;
  away_team_id?: number;
  starts_at: Date;
  status: ExternalFixtureStatus;
  score_home?: number;
  score_away?: number;
  minute?: number;
  venue?: string;
  /** Canal / URL si l’API les fournit — jamais inventé. */
  broadcast_listed?: boolean;
  broadcast_label?: string;
  broadcast_url?: string;
}

export interface ExternalTeamHit {
  id: string;
  apiTeamId?: number;
  name: string;
  country?: string;
}

export interface ExternalFixtureLineupsResult {
  lineups: import('../utils/supporterMatchDetail').ExternalFixtureLineup[];
}

export interface ExternalFixtureEventsResult {
  events: import('../models/TeamEvent').LiveMatchAction[];
}

export type ExternalScoresSource = 'mock' | 'api_football' | 'api_stub';

export interface ExternalScoresProviderState {
  source: ExternalScoresSource;
  last_sync_at: Date;
  healthy: boolean;
  message?: string;
}

export interface ListUpcomingFixturesOptions {
  days?: number;
  leagueIds?: number[];
}

export interface ListTeamFixturesOptions {
  /** Nombre de prochains matchs (API `next`). */
  next?: number;
  /** Fenêtre calendaire pour filtrer les matchs programmés. */
  days?: number;
  status?: ExternalFixtureStatus;
}

export interface ExternalScoresProvider {
  readonly source: ExternalScoresProviderState['source'];
  listFixtures(competition?: ExternalCompetitionId): Promise<ExternalFixture[]>;
  listLiveFixtures(): Promise<ExternalFixture[]>;
  listUpcomingFixtures(options?: ListUpcomingFixturesOptions): Promise<ExternalFixture[]>;
  listTeamFixtures?(teamId: number, options?: ListTeamFixturesOptions): Promise<ExternalFixture[]>;
  listRecentFinishedFixtures?(): Promise<ExternalFixture[]>;
  getFixtureLineups?(fixtureId: string): Promise<ExternalFixtureLineupsResult>;
  getFixtureEvents?(fixtureId: string): Promise<ExternalFixtureEventsResult>;
  searchTeams?(query: string): Promise<ExternalTeamHit[]>;
  getState(): Promise<ExternalScoresProviderState>;
}
