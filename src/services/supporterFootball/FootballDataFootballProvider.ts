/**
 * football-data.org provider → UnifiedMatch for Supporter Space V3.
 * Free tier: FL1, PL, PD, SA, BL1, CL, … (see footballDataMappers).
 */
import {
  footballDataFetch,
  footballDataLiveTtl,
  isFootballDataTokenConfigured,
} from './footballDataClient';
import {
  FOOTBALL_DATA_FREE_COMPETITION_CODES,
  FOOTBALL_DATA_PRIMARY_CODES,
  mapFdMatchToUnified,
  parseFootballDataMatchId,
  parseFootballDataTeamId,
  type FdMatch,
} from './footballDataMappers';
import { addDays, ymd } from './mappers';
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
import { SUPPORTER_POPULAR_CLUBS } from '../../content/supporterPopularClubs';
import { FOOTBALL_DATA_TEAM_IDS } from '../externalScoresFootballData.provider';
import { normalizeTeamKey } from '../../utils/supporterWorldFollows';

type MatchesResponse = { matches?: FdMatch[] };
type MatchResponse = FdMatch;
type CompetitionsResponse = {
  competitions?: Array<{ id?: number; name?: string; code?: string; area?: { name?: string } }>;
};

function competitionsParam(codes: readonly string[] = FOOTBALL_DATA_PRIMARY_CODES): string {
  return codes.join(',');
}

/** Offline FD team hits from popular clubs (PSG → fd-team-524) — no API call. */
function curatedFootballDataTeams(query: string): UnifiedTeamRef[] {
  const q = query.trim().toLowerCase();
  const out: UnifiedTeamRef[] = [];
  for (const club of SUPPORTER_POPULAR_CLUBS) {
    if (club.apiTeamId == null) continue;
    const fdId = FOOTBALL_DATA_TEAM_IDS[club.apiTeamId];
    if (fdId == null) continue;
    if (q) {
      const nq = normalizeTeamKey(q);
      const keys = [club.name, ...(club.aliases ?? [])].map(normalizeTeamKey);
      if (
        !keys.some((k) => k.includes(nq) || nq.includes(k)) &&
        !club.name.toLowerCase().includes(q)
      ) {
        continue;
      }
    }
    out.push({
      id: `fd-team-${fdId}`,
      name: club.name,
      shortName: club.aliases?.[0],
      country: club.country,
      externalId: fdId,
    });
  }
  return out;
}

export class FootballDataFootballProvider implements SupporterFootballProvider {
  readonly name = 'football-data';

  async getHealth(): Promise<ProviderHealth> {
    if (!isFootballDataTokenConfigured()) {
      return {
        name: this.name,
        ready: false,
        mode: 'empty',
        message:
          'Token football-data.org absent — ajoute EXPO_PUBLIC_FOOTBALL_DATA_TOKEN (compte free sur football-data.org) pour Ligue 1 et top ligues.',
      };
    }
    return {
      name: this.name,
      ready: true,
      mode: 'live',
      message: 'football-data.org (gratuit) — Ligue 1, PL, Liga, Serie A, Bundesliga, C1…',
      availableLeagueIds: FOOTBALL_DATA_PRIMARY_CODES.map((_, i) => i), // placeholder; composite uses codes
    };
  }

  async getFixtures(query: FixtureQuery = {}): Promise<UnifiedMatch[]> {
    if (!isFootballDataTokenConfigured()) return [];
    if (query.liveOnly) return this.getLive();

    const from = query.from ?? ymd(new Date());
    const to = query.to ?? ymd(addDays(new Date(), 7));

    let list: UnifiedMatch[];
    if (query.teamIds?.length) {
      list = await this.fetchMatchesForTeams(query.teamIds, from, to);
    } else {
      list = await this.fetchMatchesBetween(from, to);
    }

    if (query.genderScope && query.genderScope !== 'unknown') {
      return list.filter((m) => m.genderScope === query.genderScope);
    }
    if (query.status && query.status !== 'all') {
      return list.filter((m) => m.status === query.status);
    }
    return list;
  }

  private async fetchMatchesForTeams(
    teamIds: string[],
    from: string,
    to: string,
  ): Promise<UnifiedMatch[]> {
    const nums = [
      ...new Set(
        teamIds
          .map((id) => parseFootballDataTeamId(id))
          .filter((n): n is number => n != null),
      ),
    ];
    if (!nums.length) return [];
    const batches = await Promise.all(
      nums.map((id) => this.fetchTeamMatches(id, from, to)),
    );
    const seen = new Set<string>();
    const out: UnifiedMatch[] = [];
    for (const m of batches.flat()) {
      if (seen.has(m.id)) continue;
      seen.add(m.id);
      out.push(m);
    }
    return out;
  }

  /** GET /v4/teams/{id}/matches — used when user follows an FD club (e.g. PSG = 524). */
  private async fetchTeamMatches(
    teamId: number,
    from: string,
    to: string,
  ): Promise<UnifiedMatch[]> {
    try {
      const res = await footballDataFetch<MatchesResponse>({
        path: `/teams/${teamId}/matches`,
        query: { dateFrom: from, dateTo: to },
        ttlMs: 90_000,
      });
      return (res.matches ?? []).map(mapFdMatchToUnified);
    } catch {
      return [];
    }
  }

  private async fetchMatchesBetween(from: string, to: string): Promise<UnifiedMatch[]> {
    try {
      const res = await footballDataFetch<MatchesResponse>({
        path: '/matches',
        query: {
          competitions: competitionsParam(),
          dateFrom: from,
          dateTo: to,
        },
        ttlMs: 60_000,
      });
      return (res.matches ?? []).map(mapFdMatchToUnified);
    } catch {
      return [];
    }
  }

  async getLive(): Promise<UnifiedMatch[]> {
    if (!isFootballDataTokenConfigured()) return [];
    try {
      const res = await footballDataFetch<MatchesResponse>({
        path: '/matches',
        query: {
          competitions: competitionsParam(),
          status: 'LIVE',
        },
        ttlMs: footballDataLiveTtl(),
      });
      return (res.matches ?? [])
        .map(mapFdMatchToUnified)
        .filter((m) => m.status === 'live' || m.status === 'halftime');
    } catch {
      // Free tier often has delayed scores — fall back to today's IN_PLAY window via date range.
      const today = ymd(new Date());
      const list = await this.fetchMatchesBetween(today, today);
      return list.filter((m) => m.status === 'live' || m.status === 'halftime');
    }
  }

  async getUpcoming(days = 7): Promise<UnifiedMatch[]> {
    const from = ymd(new Date());
    const to = ymd(addDays(new Date(), days));
    const list = await this.fetchMatchesBetween(from, to);
    return list.filter((m) => m.status === 'scheduled');
  }

  async getFinished(days = 3): Promise<UnifiedMatch[]> {
    const from = ymd(addDays(new Date(), -days));
    const to = ymd(new Date());
    try {
      const res = await footballDataFetch<MatchesResponse>({
        path: '/matches',
        query: {
          competitions: competitionsParam(),
          dateFrom: from,
          dateTo: to,
          status: 'FINISHED',
        },
        ttlMs: 60_000,
      });
      return (res.matches ?? []).map(mapFdMatchToUnified);
    } catch {
      const list = await this.fetchMatchesBetween(from, to);
      return list.filter((m) => m.status === 'finished');
    }
  }

  async getMatch(id: string): Promise<UnifiedMatch | null> {
    const fdId = parseFootballDataMatchId(id);
    if (fdId == null || !isFootballDataTokenConfigured()) return null;
    try {
      const res = await footballDataFetch<MatchResponse>({
        path: `/matches/${fdId}`,
        ttlMs: 45_000,
      });
      return mapFdMatchToUnified(res);
    } catch {
      return null;
    }
  }

  async getLineups(_matchId: string): Promise<UnifiedLineups | null> {
    return null; // free tier: no lineups
  }

  async getEvents(_matchId: string): Promise<UnifiedMatchEvent[]> {
    return [];
  }

  async getStatistics(_matchId: string): Promise<UnifiedStatistics | null> {
    return null;
  }

  async getTeams(query: string): Promise<UnifiedTeamRef[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const curated = curatedFootballDataTeams(q);
    if (!isFootballDataTokenConfigured()) return curated;
    const from = ymd(new Date());
    const to = ymd(addDays(new Date(), 21));
    const matches = await this.fetchMatchesBetween(from, to);
    const byId = new Map<string, UnifiedTeamRef>();
    for (const t of curated) byId.set(t.id, t);
    for (const m of matches) {
      for (const t of [m.homeTeam, m.awayTeam]) {
        const hay = `${t.name} ${t.shortName ?? ''}`.toLowerCase();
        if (hay.includes(q) && !byId.has(t.id)) byId.set(t.id, t);
      }
    }
    return [...byId.values()].slice(0, 20);
  }

  async getTeam(teamId: string): Promise<UnifiedTeamRef | null> {
    if (!teamId.startsWith('fd-team-')) return null;
    const num = parseFootballDataTeamId(teamId);
    if (num == null) return null;
    if (isFootballDataTokenConfigured()) {
      try {
        type TeamResponse = {
          id?: number;
          name?: string;
          shortName?: string;
          tla?: string;
          crest?: string;
          area?: { name?: string };
        };
        const res = await footballDataFetch<TeamResponse>({
          path: `/teams/${num}`,
          ttlMs: 6 * 60 * 60_000,
        });
        if (res.id != null || res.name) {
          return {
            id: `fd-team-${res.id ?? num}`,
            name: res.name?.trim() || res.shortName?.trim() || 'Équipe',
            shortName: res.shortName || res.tla || undefined,
            logoUrl: res.crest,
            country: res.area?.name,
            externalId: res.id ?? num,
          };
        }
      } catch {
        /* fall through */
      }
    }
    return (
      curatedFootballDataTeams('').find((t) => t.id === teamId) ?? {
        id: teamId,
        name: `Équipe ${num}`,
        externalId: num,
      }
    );
  }

  async getCompetitions(_country?: string): Promise<UnifiedCompetitionRef[]> {
    if (!isFootballDataTokenConfigured()) {
      return FOOTBALL_DATA_PRIMARY_CODES.map((code) => ({
        id: `fd-comp-${code}`,
        name: code,
        externalId: undefined,
      }));
    }
    try {
      const res = await footballDataFetch<CompetitionsResponse>({
        path: '/competitions',
        ttlMs: 6 * 60 * 60_000,
      });
      const allowed = new Set<string>(FOOTBALL_DATA_FREE_COMPETITION_CODES);
      return (res.competitions ?? [])
        .filter((c) => c.code && allowed.has(c.code.toUpperCase()))
        .map((c) => {
          const code = (c.code || '').toUpperCase();
          return {
            id: `fd-comp-${code}`,
            name: c.name || code,
            country: c.area?.name,
            externalId: c.id,
          };
        });
    } catch {
      return FOOTBALL_DATA_PRIMARY_CODES.map((code) => ({
        id: `fd-comp-${code}`,
        name: code,
      }));
    }
  }

  async getStandings(competitionOrSeasonId: string): Promise<UnifiedStandingRow[]> {
    if (!isFootballDataTokenConfigured()) return [];
    const code = competitionOrSeasonId.replace(/^fd-comp-/i, '').toUpperCase();
    if (!FOOTBALL_DATA_FREE_COMPETITION_CODES.includes(code as (typeof FOOTBALL_DATA_FREE_COMPETITION_CODES)[number])) {
      return [];
    }
    try {
      type StandingsResponse = {
        standings?: Array<{
          type?: string;
          table?: Array<{
            position: number;
            playedGames: number;
            won: number;
            draw: number;
            lost: number;
            goalsFor: number;
            goalsAgainst: number;
            points: number;
            team: { id?: number; name?: string; shortName?: string; crest?: string };
          }>;
        }>;
      };
      const res = await footballDataFetch<StandingsResponse>({
        path: `/competitions/${code}/standings`,
        ttlMs: 10 * 60_000,
      });
      const table =
        res.standings?.find((s) => s.type === 'TOTAL')?.table ?? res.standings?.[0]?.table ?? [];
      return table.map((row) => ({
        position: row.position,
        team: {
          id: row.team.id != null ? `fd-team-${row.team.id}` : `fd-team-${row.team.name}`,
          name: row.team.shortName || row.team.name || 'Équipe',
          logoUrl: row.team.crest,
          externalId: row.team.id,
        },
        played: row.playedGames,
        won: row.won,
        draw: row.draw,
        lost: row.lost,
        goalsFor: row.goalsFor,
        goalsAgainst: row.goalsAgainst,
        points: row.points,
      }));
    } catch {
      return [];
    }
  }

  async search(query: string): Promise<SearchResult> {
    const q = query.trim().toLowerCase();
    if (!q) return { matches: [], teams: [], competitions: [] };
    const [fixtures, competitions] = await Promise.all([
      this.getFixtures({ from: ymd(addDays(new Date(), -3)), to: ymd(addDays(new Date(), 14)) }),
      this.getCompetitions(),
    ]);
    const matches = fixtures.filter(
      (m) =>
        m.homeTeam.name.toLowerCase().includes(q) ||
        m.awayTeam.name.toLowerCase().includes(q) ||
        m.competition.name.toLowerCase().includes(q),
    );
    const teams = await this.getTeams(query);
    return {
      matches,
      teams,
      competitions: competitions.filter((c) => c.name.toLowerCase().includes(q)),
    };
  }
}
