export type ExternalCompetitionId = 'ligue1' | 'd1f';

export type ExternalFixtureStatus = 'scheduled' | 'live' | 'finished';

export interface ExternalFixture {
  id: string;
  competition: ExternalCompetitionId;
  competition_label: string;
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

export interface ExternalScoresProvider {
  readonly source: ExternalScoresProviderState['source'];
  listFixtures(competition?: ExternalCompetitionId): Promise<ExternalFixture[]>;
  getState(): Promise<ExternalScoresProviderState>;
}
