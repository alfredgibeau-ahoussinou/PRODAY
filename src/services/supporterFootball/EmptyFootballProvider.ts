import type { SupporterFootballProvider } from './provider';
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

/**
 * Empty external provider — used when Sportmonks isn’t configured and demo isn’t forced.
 * Never invents fixtures; lists stay honestly empty.
 */
export class EmptyFootballProvider implements SupporterFootballProvider {
  readonly name = 'empty';

  async getHealth(): Promise<ProviderHealth> {
    return {
      name: this.name,
      ready: true,
      mode: 'empty',
      message:
        'Scores ligues indisponibles. Configure EXPO_PUBLIC_SPORTMONKS_API_TOKEN et/ou EXPO_PUBLIC_FOOTBALL_DATA_TOKEN — aucun match fictif.',
    };
  }

  async getFixtures(_query?: FixtureQuery): Promise<UnifiedMatch[]> {
    return [];
  }

  async getLive(): Promise<UnifiedMatch[]> {
    return [];
  }

  async getUpcoming(_days?: number): Promise<UnifiedMatch[]> {
    return [];
  }

  async getFinished(_days?: number): Promise<UnifiedMatch[]> {
    return [];
  }

  async getMatch(_id: string): Promise<UnifiedMatch | null> {
    return null;
  }

  async getLineups(_matchId?: string): Promise<UnifiedLineups | null> {
    return null;
  }

  async getEvents(_matchId?: string): Promise<UnifiedMatchEvent[]> {
    return [];
  }

  async getStatistics(_matchId?: string): Promise<UnifiedStatistics | null> {
    return null;
  }

  async getTeams(_query: string): Promise<UnifiedTeamRef[]> {
    return [];
  }

  async getTeam(_teamId: string): Promise<UnifiedTeamRef | null> {
    return null;
  }

  async getCompetitions(): Promise<UnifiedCompetitionRef[]> {
    return [];
  }

  async getStandings(): Promise<UnifiedStandingRow[]> {
    return [];
  }

  async search(_query: string): Promise<SearchResult> {
    return { matches: [], teams: [], competitions: [] };
  }
}
