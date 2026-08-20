import type {
  FixtureQuery,
  ProviderHealth,
  SearchResult,
  UnifiedCompetitionRef,
  UnifiedLineups,
  UnifiedMatch,
  UnifiedMatchEvent,
  UnifiedStandingRow,
  UnifiedStatistics,
  UnifiedTeamRef,
} from './types';

/** Contract for Supporter Space football data (Sportmonks / ProDay / demo). */
export interface SupporterFootballProvider {
  readonly name: string;
  getHealth(): Promise<ProviderHealth>;
  getFixtures(query?: FixtureQuery): Promise<UnifiedMatch[]>;
  getLive(): Promise<UnifiedMatch[]>;
  getUpcoming(days?: number): Promise<UnifiedMatch[]>;
  getFinished(days?: number): Promise<UnifiedMatch[]>;
  getMatch(id: string): Promise<UnifiedMatch | null>;
  getLineups(matchId: string): Promise<UnifiedLineups | null>;
  getEvents(matchId: string): Promise<UnifiedMatchEvent[]>;
  getStatistics(matchId: string): Promise<UnifiedStatistics | null>;
  getTeams(query: string): Promise<UnifiedTeamRef[]>;
  getTeam(teamId: string): Promise<UnifiedTeamRef | null>;
  getCompetitions(country?: string): Promise<UnifiedCompetitionRef[]>;
  getStandings(competitionOrSeasonId: string): Promise<UnifiedStandingRow[]>;
  search(query: string): Promise<SearchResult>;
}
