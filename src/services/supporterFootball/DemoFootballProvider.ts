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
import { addDays, ymd } from './mappers';

/**
 * Demo provider — ONLY when EXPO_PUBLIC_SUPPORTER_FOOTBALL_DEMO=1 or no token.
 * All matches tagged source: 'demo'. Never mixed silently with live API data.
 */
function buildDemoMatches(): UnifiedMatch[] {
  const now = Date.now();
  const mk = (
    offsetH: number,
    status: UnifiedMatch['status'],
    score: UnifiedMatch['score'],
    label: string,
  ): UnifiedMatch => ({
    id: `demo-${label}`,
    source: 'demo',
    homeTeam: {
      id: 'demo-team-home',
      name: 'ProDay United',
      shortName: 'PDU',
    },
    awayTeam: {
      id: 'demo-team-away',
      name: 'Demo FC',
      shortName: 'DEM',
    },
    competition: {
      id: 'demo-league',
      name: 'Démo Supporter Space',
      country: 'FR',
      genderScope: 'men',
    },
    date: new Date(now + offsetH * 3600_000),
    status,
    score,
    genderScope: 'men',
    lineup: null,
    statistics: null,
    events: null,
    video: null,
  });

  return [
    mk(-1, 'live', { home: 1, away: 0, minute: 67, period: '2nd' }, 'live'),
    mk(24, 'scheduled', { home: null, away: null }, 'upcoming'),
    mk(-26, 'finished', { home: 2, away: 2 }, 'finished'),
  ];
}

export class DemoFootballProvider implements SupporterFootballProvider {
  readonly name = 'demo';

  async getHealth(): Promise<ProviderHealth> {
    return {
      name: this.name,
      ready: true,
      mode: 'demo',
      message: 'Mode démo — scores fictifs étiquetés source: demo (pas de données Sportmonks).',
    };
  }

  private all(): UnifiedMatch[] {
    return buildDemoMatches();
  }

  async getFixtures(query: FixtureQuery = {}): Promise<UnifiedMatch[]> {
    let list = this.all();
    if (query.liveOnly) list = list.filter((m) => m.status === 'live' || m.status === 'halftime');
    return list;
  }

  async getLive(): Promise<UnifiedMatch[]> {
    return this.all().filter((m) => m.status === 'live' || m.status === 'halftime');
  }

  async getUpcoming(_days?: number): Promise<UnifiedMatch[]> {
    return this.all().filter((m) => m.status === 'scheduled');
  }

  async getFinished(_days?: number): Promise<UnifiedMatch[]> {
    return this.all().filter((m) => m.status === 'finished');
  }

  async getMatch(id: string): Promise<UnifiedMatch | null> {
    return this.all().find((m) => m.id === id) ?? null;
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

  async getTeams(query: string): Promise<UnifiedTeamRef[]> {
    if (!query.trim()) return [];
    return [
      { id: 'demo-team-home', name: 'ProDay United', shortName: 'PDU' },
      { id: 'demo-team-away', name: 'Demo FC', shortName: 'DEM' },
    ].filter((t) => t.name.toLowerCase().includes(query.toLowerCase()));
  }

  async getTeam(teamId: string): Promise<UnifiedTeamRef | null> {
    const teams = await this.getTeams(' ');
    return teams.find((t) => t.id === teamId) ?? { id: teamId, name: 'Club démo' };
  }

  async getCompetitions(): Promise<UnifiedCompetitionRef[]> {
    return [
      {
        id: 'demo-league',
        name: 'Démo Supporter Space',
        country: 'FR',
        genderScope: 'men',
      },
    ];
  }

  async getStandings(): Promise<UnifiedStandingRow[]> {
    return [];
  }

  async search(query: string): Promise<SearchResult> {
    return {
      matches: this.all().filter(
        (m) =>
          m.homeTeam.name.toLowerCase().includes(query.toLowerCase()) ||
          m.awayTeam.name.toLowerCase().includes(query.toLowerCase()),
      ),
      teams: await this.getTeams(query),
      competitions: (await this.getCompetitions()).filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase()),
      ),
    };
  }
}

export function demoDateRangeLabel(): string {
  return `${ymd(new Date())} → ${ymd(addDays(new Date(), 7))}`;
}
