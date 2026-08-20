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
  home_team: string;
  away_team: string;
  starts_at: Date;
  status: ExternalFixtureStatus;
  score_home?: number;
  score_away?: number;
  minute?: number;
  venue?: string;
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

export interface ExternalScoresProvider {
  readonly source: ExternalScoresProviderState['source'];
  listFixtures(competition?: ExternalCompetitionId): Promise<ExternalFixture[]>;
  listLiveFixtures(): Promise<ExternalFixture[]>;
  listUpcomingFixtures(options?: ListUpcomingFixturesOptions): Promise<ExternalFixture[]>;
  getState(): Promise<ExternalScoresProviderState>;
}
