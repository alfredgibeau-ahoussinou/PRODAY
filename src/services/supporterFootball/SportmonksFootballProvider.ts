import type { SupporterFootballProvider } from './provider';
import {
  isSportmonksTokenConfigured,
  sportmonksFetch,
  sportmonksLiveTtl,
  type SportmonksListResponse,
  type SportmonksItemResponse,
} from './sportmonksClient';
import {
  addDays,
  mapSmFixtureToUnified,
  mapSmLeague,
  mapSmTeam,
  parseExternalFixtureId,
  ymd,
  type SmFixture,
} from './mappers';
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

/** Includes légers pour listes fixtures-by-date (upcoming / finished). */
export const FIXTURE_LIST_INCLUDES =
  'participants;scores;state;league;events;lineups;formations;statistics;venue';

/**
 * Includes pour `GET /livescores/inplay` — minute via periods, scores CURRENT,
 * ligue+pays, round. Pas de lineups/stats (payload live allégé).
 */
export const LIVE_INPLAY_INCLUDES =
  'participants;scores;periods;events;league.country;round';

/**
 * Includes riches pour le Match Center / getMatch.
 * Syntaxe Sportmonks v3 (docs) : `xGFixture`, `lineups.xGLineup`, nested `.player` / `.details`.
 * La réponse JSON utilise souvent les clés minuscules `xgfixture` / `xglineup`.
 */
export const FIXTURE_DETAIL_INCLUDES =
  'participants;scores;state;league;venue;events;lineups.player;lineups.details;lineups.xGLineup;formations;statistics.type;xGFixture';

export class SportmonksFootballProvider implements SupporterFootballProvider {
  readonly name = 'sportmonks';

  async getHealth(): Promise<ProviderHealth> {
    if (!isSportmonksTokenConfigured()) {
      return {
        name: this.name,
        ready: false,
        mode: 'empty',
        message: 'Token Sportmonks absent — configure EXPO_PUBLIC_SPORTMONKS_API_TOKEN ou le proxy Cloud Function.',
      };
    }
    return { name: this.name, ready: true, mode: 'live' };
  }

  async getFixtures(query: FixtureQuery = {}): Promise<UnifiedMatch[]> {
    if (query.liveOnly) return this.getLive();
    const from = query.from ?? ymd(new Date());
    const to = query.to ?? ymd(addDays(new Date(), 7));
    const res = await sportmonksFetch<SportmonksListResponse<SmFixture>>({
      path: `/fixtures/between/${from}/${to}`,
      query: { include: FIXTURE_LIST_INCLUDES, per_page: 50 },
      ttlMs: 60_000,
    });
    let list = (res.data ?? []).map(mapSmFixtureToUnified);
    if (query.genderScope && query.genderScope !== 'unknown') {
      list = list.filter((m) => m.genderScope === query.genderScope);
    }
    if (query.status && query.status !== 'all') {
      list = list.filter((m) => m.status === query.status);
    }
    return list;
  }

  async getLive(): Promise<UnifiedMatch[]> {
    const res = await sportmonksFetch<SportmonksListResponse<SmFixture>>({
      path: '/livescores/inplay',
      query: { include: LIVE_INPLAY_INCLUDES },
      ttlMs: sportmonksLiveTtl(),
    });
    // Endpoint inplay = matchs en cours uniquement ; pas de fallback démo.
    return (res.data ?? []).map((fixture) => {
      const match = mapSmFixtureToUnified(fixture);
      if (match.status === 'unknown' || match.status === 'scheduled') {
        return { ...match, status: 'live' as const };
      }
      return match;
    });
  }

  async getUpcoming(days = 7): Promise<UnifiedMatch[]> {
    const from = ymd(new Date());
    const to = ymd(addDays(new Date(), days));
    const list = await this.getFixtures({ from, to });
    return list.filter((m) => m.status === 'scheduled' || m.status === 'unknown');
  }

  async getFinished(days = 3): Promise<UnifiedMatch[]> {
    const from = ymd(addDays(new Date(), -days));
    const to = ymd(new Date());
    const list = await this.getFixtures({ from, to });
    return list.filter((m) => m.status === 'finished');
  }

  async getMatch(id: string): Promise<UnifiedMatch | null> {
    const fixtureId = parseExternalFixtureId(id);
    if (fixtureId == null) return null;
    const res = await sportmonksFetch<SportmonksItemResponse<SmFixture>>({
      path: `/fixtures/${fixtureId}`,
      query: { include: FIXTURE_DETAIL_INCLUDES },
      ttlMs: sportmonksLiveTtl(),
    });
    if (!res.data) return null;
    return mapSmFixtureToUnified(res.data);
  }

  async getLineups(matchId: string): Promise<UnifiedLineups | null> {
    const match = await this.getMatch(matchId);
    return match?.lineup ?? null;
  }

  async getEvents(matchId: string): Promise<UnifiedMatchEvent[]> {
    const match = await this.getMatch(matchId);
    return match?.events ?? [];
  }

  async getStatistics(matchId: string): Promise<UnifiedStatistics | null> {
    const match = await this.getMatch(matchId);
    return match?.statistics ?? null;
  }

  async getTeams(query: string): Promise<UnifiedTeamRef[]> {
    const q = query.trim();
    if (q.length < 2) return [];
    const res = await sportmonksFetch<SportmonksListResponse<{
      id: number;
      name: string;
      short_code?: string | null;
      image_path?: string | null;
      country?: { name?: string };
    }>>({
      path: `/teams/search/${encodeURIComponent(q)}`,
      ttlMs: 120_000,
    });
    return (res.data ?? []).slice(0, 20).map(mapSmTeam);
  }

  async getTeam(teamId: string): Promise<UnifiedTeamRef | null> {
    const num = Number(teamId.replace(/^sm-team-/, ''));
    if (!Number.isFinite(num)) return null;
    const res = await sportmonksFetch<SportmonksItemResponse<{
      id: number;
      name: string;
      short_code?: string | null;
      image_path?: string | null;
      country?: { name?: string };
    }>>({
      path: `/teams/${num}`,
      ttlMs: 300_000,
    });
    return res.data ? mapSmTeam(res.data) : null;
  }

  async getCompetitions(_country?: string): Promise<UnifiedCompetitionRef[]> {
    const res = await sportmonksFetch<
      SportmonksListResponse<{
        id: number;
        name: string;
        image_path?: string | null;
        country?: { name?: string };
      }>
    >({
      path: '/leagues',
      query: { include: 'country', per_page: 50 },
      ttlMs: 600_000,
    });
    return (res.data ?? []).map(mapSmLeague);
  }

  async getStandings(competitionOrSeasonId: string): Promise<UnifiedStandingRow[]> {
    const seasonId = Number(String(competitionOrSeasonId).replace(/\D/g, ''));
    if (!Number.isFinite(seasonId) || seasonId <= 0) return [];
    try {
      const res = await sportmonksFetch<
        SportmonksListResponse<{
          position?: number;
          points?: number;
          participant?: { id: number; name: string; image_path?: string | null };
          details?: Array<{ type?: { code?: string }; value?: number }>;
        }>
      >({
        path: `/standings/seasons/${seasonId}`,
        query: { include: 'participant;details.type' },
        ttlMs: 300_000,
      });
      return (res.data ?? []).map((row, idx) => {
        const detail = (code: string) =>
          row.details?.find((d) => d.type?.code === code)?.value ?? 0;
        return {
          position: row.position ?? idx + 1,
          team: {
            id: row.participant ? `sm-team-${row.participant.id}` : `sm-team-unk-${idx}`,
            name: row.participant?.name || 'Équipe',
            logoUrl: row.participant?.image_path || undefined,
            externalId: row.participant?.id,
          },
          played: detail('overall_matches_played') || detail('games_played') || 0,
          won: detail('overall_won') || 0,
          draw: detail('overall_draw') || 0,
          lost: detail('overall_lost') || 0,
          goalsFor: detail('overall_goals_for') || 0,
          goalsAgainst: detail('overall_goals_against') || 0,
          points: row.points ?? detail('overall_points') ?? 0,
        };
      });
    } catch {
      return [];
    }
  }

  async search(query: string): Promise<SearchResult> {
    const q = query.trim();
    if (q.length < 2) return { matches: [], teams: [], competitions: [] };
    const [teams, leagues] = await Promise.all([
      this.getTeams(q),
      sportmonksFetch<
        SportmonksListResponse<{
          id: number;
          name: string;
          image_path?: string | null;
          country?: { name?: string };
        }>
      >({
        path: `/leagues/search/${encodeURIComponent(q)}`,
        ttlMs: 120_000,
      }).then((r) => (r.data ?? []).map(mapSmLeague)).catch(() => [] as UnifiedCompetitionRef[]),
    ]);
    return { matches: [], teams, competitions: leagues };
  }
}
