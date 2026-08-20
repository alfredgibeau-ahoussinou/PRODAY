import type { Follow } from '../../models/Follow';
import type { TeamEvent } from '../../models/TeamEvent';
import type { Tournament } from '../../models/Tournament';
import type { LiveMatchAction } from '../../models/TeamEvent';
import type { ExternalFixture, ExternalScoresProviderState, ExternalTeamHit } from '../externalScores.types';
import type { ExternalFixtureLineup } from '../../utils/supporterMatchDetail';
import type { SupporterMatchViewItem } from '../../utils/supporterMatchFilters';

export type FootballMatchSource = 'proday' | 'world';

export interface FootballTeamHit {
  id: string;
  name: string;
  apiTeamId?: number;
  country?: string;
  source: FootballMatchSource | 'curated';
}

export interface FootballCompetitionEntry {
  id: string;
  label: string;
  country: string;
  countryCode: string;
  leagueId?: number;
}

export interface FootballMatchStatistics {
  home: Record<string, string | number>;
  away: Record<string, string | number>;
}

export interface FootballMatchDetail {
  item: SupporterMatchViewItem;
  source: FootballMatchSource;
  lineups: ExternalFixtureLineup[];
  events: LiveMatchAction[];
  statistics: FootballMatchStatistics | null;
  prodayEvent: TeamEvent | null;
}

export interface FootballDataProvider {
  readonly name: string;
  listLiveFixtures(): Promise<ExternalFixture[]>;
  listUpcomingFixtures(days?: number, leagueIds?: number[]): Promise<ExternalFixture[]>;
  /** Alias Phase 1 — getFixtures = live + upcoming. */
  getFixtures?(opts?: { live?: boolean; days?: number; leagueIds?: number[] }): Promise<ExternalFixture[]>;
  getFixture?(fixtureId: string): Promise<ExternalFixture | null>;
  getTeams?(query: string): Promise<FootballTeamHit[]>;
  getTeam?(teamId: string): Promise<FootballTeamHit | null>;
  getCompetitions?(countryCode?: string): Promise<FootballCompetitionEntry[]>;
  getStandings?(leagueId: number): Promise<unknown | null>;
  getLineups?(fixtureId: string): Promise<ExternalFixtureLineup[]>;
  getEvents?(fixtureId: string): Promise<LiveMatchAction[]>;
  getStatistics?(fixtureId: string): Promise<FootballMatchStatistics | null>;
  getPlayers?(teamId: string): Promise<unknown[]>;
  searchTeams(query: string): Promise<FootballTeamHit[]>;
  getMatchDetail(
    matchId: string,
    seedItem?: SupporterMatchViewItem | null,
  ): Promise<FootballMatchDetail | null>;
  getFixtureStatistics(fixtureId: string): Promise<FootballMatchStatistics | null>;
  listCompetitionsByCountry(countryCode?: string): Promise<FootballCompetitionEntry[]>;
  getProviderState(): Promise<ExternalScoresProviderState>;
}

export interface ProDayFootballContext {
  calendarEvents: TeamEvent[];
  tournaments: Tournament[];
  follows: Follow[];
}
