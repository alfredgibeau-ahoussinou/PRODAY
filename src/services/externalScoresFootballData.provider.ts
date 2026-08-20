/**
 * Provider gratuit football-data.org (tier free).
 * Token : https://www.football-data.org/client/register → EXPO_PUBLIC_FOOTBALL_DATA_TOKEN
 */
import type {
  ExternalCompetitionId,
  ExternalFixture,
  ExternalFixtureStatus,
  ExternalScoresProvider,
  ExternalScoresProviderState,
  ExternalTeamHit,
  ListTeamFixturesOptions,
  ListUpcomingFixturesOptions,
} from './externalScores.types';
import type { LiveMatchAction } from '../models/TeamEvent';
import type { ExternalFixtureLineup } from '../utils/supporterMatchDetail';
import {
  mergeTeamSearchHits,
  resolvePopularClubApiIdByName,
  searchCuratedPopularClubs,
  SUPPORTER_POPULAR_CLUBS,
} from '../content/supporterPopularClubs';

const DEFAULT_BASE_URL = 'https://api.football-data.org/v4';
const LIVE_CACHE_TTL_MS = 30_000;
const UPCOMING_CACHE_TTL_MS = 5 * 60_000;
const TEAM_CACHE_TTL_MS = 5 * 60_000;
const LEAGUE_CACHE_TTL_MS = 60_000;

/** Codes compétition football-data.org (tier free). */
export const FOOTBALL_DATA_COMPETITION_CODES: Record<
  Exclude<ExternalCompetitionId, 'd1f' | 'uel' | 'ligue2' | 'world_cup' | 'other'>,
  string
> = {
  ligue1: 'FL1',
  pl: 'PL',
  laliga: 'PD',
  seriea: 'SA',
  bundesliga: 'BL1',
  ucl: 'CL',
};

/** Alignement league_id API-Football pour filtres existants. */
const COMPETITION_TO_API_LEAGUE: Record<string, { slug: ExternalCompetitionId; leagueId: number; label: string }> = {
  FL1: { slug: 'ligue1', leagueId: 61, label: 'Ligue 1' },
  PL: { slug: 'pl', leagueId: 39, label: 'Premier League' },
  PD: { slug: 'laliga', leagueId: 140, label: 'La Liga' },
  SA: { slug: 'seriea', leagueId: 135, label: 'Serie A' },
  BL1: { slug: 'bundesliga', leagueId: 78, label: 'Bundesliga' },
  CL: { slug: 'ucl', leagueId: 2, label: 'UEFA Champions League' },
};

/** apiTeamId (API-Football / popular clubs) → id équipe football-data.org. */
export const FOOTBALL_DATA_TEAM_IDS: Record<number, number> = {
  85: 524, // PSG
  81: 516, // OM
  80: 523, // OL
  91: 548, // Monaco
  79: 521, // Lille
  84: 522, // Nice
  116: 526, // Lens
  541: 86, // Real Madrid
  529: 81, // Barcelona
  530: 78, // Atlético
  33: 66, // Man United
  50: 65, // Man City
  40: 64, // Liverpool
  49: 61, // Chelsea
  42: 57, // Arsenal
  157: 5, // Bayern
  165: 4, // Dortmund
  496: 109, // Juventus
  505: 108, // Inter
  489: 98, // Milan
};

interface FdMatchTeam {
  id?: number;
  name?: string;
  shortName?: string;
  tla?: string;
  formation?: string | null;
  lineup?: Array<{
    id?: number;
    name?: string;
    position?: string | null;
    shirtNumber?: number | null;
  }>;
  bench?: Array<{
    id?: number;
    name?: string;
    position?: string | null;
    shirtNumber?: number | null;
  }>;
}

interface FdMatchGoal {
  minute?: number | null;
  injuryTime?: number | null;
  type?: string | null;
  scorer?: { id?: number; name?: string | null } | null;
  assist?: { id?: number; name?: string | null } | null;
  team?: FdMatchTeam | null;
}

interface FdMatchBooking {
  minute?: number | null;
  card?: string | null;
  player?: { id?: number; name?: string | null } | null;
  team?: FdMatchTeam | null;
}

interface FdMatchSubstitution {
  minute?: number | null;
  playerOut?: { id?: number; name?: string | null } | null;
  playerIn?: { id?: number; name?: string | null } | null;
  team?: FdMatchTeam | null;
}

interface FdMatchRow {
  id: number;
  utcDate: string;
  status: string;
  minute?: number | null;
  venue?: string | null;
  homeTeam: FdMatchTeam;
  awayTeam: FdMatchTeam;
  score?: {
    fullTime?: { home?: number | null; away?: number | null };
    halfTime?: { home?: number | null; away?: number | null };
  };
  competition?: { id?: number; name?: string; code?: string };
  goals?: FdMatchGoal[];
  bookings?: FdMatchBooking[];
  substitutions?: FdMatchSubstitution[];
}

interface CacheEntry {
  expiresAt: number;
  fixtures: ExternalFixture[];
}

const cache = new Map<string, CacheEntry>();

let lastSyncAt: Date | null = null;
let lastHealthy = false;
let lastMessage: string | undefined;

function readToken(): string | undefined {
  const token = process.env.EXPO_PUBLIC_FOOTBALL_DATA_TOKEN?.trim();
  return token || undefined;
}

function readBaseUrl(): string {
  return process.env.EXPO_PUBLIC_FOOTBALL_DATA_URL?.trim() || DEFAULT_BASE_URL;
}

export function hasFootballDataToken(): boolean {
  return Boolean(readToken());
}

function mapStatus(status: string): ExternalFixtureStatus {
  const s = status.toUpperCase();
  if (['IN_PLAY', 'LIVE', 'PAUSED', 'HALFTIME', 'EXTRA_TIME', 'PENALTY_SHOOTOUT'].includes(s)) {
    return 'live';
  }
  if (['FINISHED', 'AWARDED'].includes(s)) return 'finished';
  return 'scheduled';
}

function resolveCompetition(code?: string, name?: string): {
  competition: ExternalCompetitionId;
  competition_label: string;
  league_id?: number;
} {
  const mapped = code ? COMPETITION_TO_API_LEAGUE[code] : undefined;
  if (mapped) {
    return {
      competition: mapped.slug,
      competition_label: name?.trim() || mapped.label,
      league_id: mapped.leagueId,
    };
  }
  return {
    competition: 'other',
    competition_label: name?.trim() || code || 'Compétition',
  };
}

function teamDisplayName(team: FdMatchTeam): string {
  return team.shortName?.trim() || team.name?.trim() || 'Équipe';
}

function resolveAppTeamId(team: FdMatchTeam): number | undefined {
  const name = teamDisplayName(team);
  const fromName = resolvePopularClubApiIdByName(name) ?? resolvePopularClubApiIdByName(team.name ?? '');
  if (fromName != null) return fromName;
  if (team.id == null) return undefined;
  const entry = Object.entries(FOOTBALL_DATA_TEAM_IDS).find(([, fdId]) => fdId === team.id);
  return entry ? Number(entry[0]) : undefined;
}

export function mapFootballDataMatch(row: FdMatchRow): ExternalFixture {
  const { competition, competition_label, league_id } = resolveCompetition(
    row.competition?.code,
    row.competition?.name,
  );
  const status = mapStatus(row.status);
  const scoreHome = row.score?.fullTime?.home ?? row.score?.halfTime?.home ?? undefined;
  const scoreAway = row.score?.fullTime?.away ?? row.score?.halfTime?.away ?? undefined;

  return {
    id: `fd_${row.id}`,
    competition,
    competition_label,
    league_id,
    api_fixture_id: row.id,
    home_team: teamDisplayName(row.homeTeam),
    away_team: teamDisplayName(row.awayTeam),
    home_team_id: resolveAppTeamId(row.homeTeam),
    away_team_id: resolveAppTeamId(row.awayTeam),
    starts_at: new Date(row.utcDate),
    status,
    score_home: scoreHome ?? undefined,
    score_away: scoreAway ?? undefined,
    minute: status === 'live' ? row.minute ?? undefined : undefined,
    venue: row.venue ?? undefined,
  };
}

function mapFdTeamLineup(team: FdMatchTeam): ExternalFixtureLineup | null {
  const teamName = teamDisplayName(team);
  const formation = (team.formation ?? '').trim() || '4-4-2';
  const starters = (team.lineup ?? [])
    .map((player, index) => {
      const name = player.name?.trim();
      if (!name) return null;
      return {
        uid: player.id != null ? String(player.id) : `fd-starter-${index}`,
        display_name: name,
        role: 'starter' as const,
        position_label:
          [player.position, player.shirtNumber != null ? String(player.shirtNumber) : undefined]
            .filter(Boolean)
            .join(' · ') || undefined,
      };
    })
    .filter((slot): slot is NonNullable<typeof slot> => Boolean(slot));
  const subs = (team.bench ?? [])
    .map((player, index) => {
      const name = player.name?.trim();
      if (!name) return null;
      return {
        uid: player.id != null ? String(player.id) : `fd-sub-${index}`,
        display_name: name,
        role: 'sub' as const,
        position_label:
          [player.position, player.shirtNumber != null ? String(player.shirtNumber) : undefined]
            .filter(Boolean)
            .join(' · ') || undefined,
      };
    })
    .filter((slot): slot is NonNullable<typeof slot> => Boolean(slot));
  if (starters.length === 0 && subs.length === 0) return null;
  return {
    teamName,
    teamId: resolveAppTeamId(team),
    formation,
    lineup: { formation, slots: [...starters, ...subs] },
  };
}

export function mapFootballDataLineups(row: FdMatchRow): ExternalFixtureLineup[] {
  return [mapFdTeamLineup(row.homeTeam), mapFdTeamLineup(row.awayTeam)].filter(
    (row): row is ExternalFixtureLineup => Boolean(row),
  );
}

export function mapFootballDataEvents(row: FdMatchRow): LiveMatchAction[] {
  const events: LiveMatchAction[] = [];
  let index = 0;
  for (const goal of row.goals ?? []) {
    const name = goal.scorer?.name?.trim();
    if (!name) continue;
    events.push({
      id: `fd-goal-${goal.scorer?.id ?? index}-${goal.minute ?? index}`,
      type: 'goal',
      player_uid: goal.scorer?.id != null ? String(goal.scorer.id) : `fd-g-${index}`,
      player_name: name,
      minute: goal.minute ?? 0,
      created_at: new Date(),
    });
    index += 1;
  }
  for (const booking of row.bookings ?? []) {
    const name = booking.player?.name?.trim();
    if (!name) continue;
    const card = (booking.card ?? '').toLowerCase();
    events.push({
      id: `fd-card-${booking.player?.id ?? index}-${booking.minute ?? index}`,
      type: card.includes('red') ? 'red_card' : 'yellow_card',
      player_uid: booking.player?.id != null ? String(booking.player.id) : `fd-c-${index}`,
      player_name: name,
      minute: booking.minute ?? 0,
      created_at: new Date(),
    });
    index += 1;
  }
  for (const sub of row.substitutions ?? []) {
    const outName = sub.playerOut?.name?.trim();
    const inName = sub.playerIn?.name?.trim();
    if (outName) {
      events.push({
        id: `fd-sub-out-${sub.playerOut?.id ?? index}-${sub.minute ?? index}`,
        type: 'sub_out',
        player_uid: sub.playerOut?.id != null ? String(sub.playerOut.id) : `fd-so-${index}`,
        player_name: outName,
        minute: sub.minute ?? 0,
        created_at: new Date(),
      });
      index += 1;
    }
    if (inName) {
      events.push({
        id: `fd-sub-in-${sub.playerIn?.id ?? index}-${sub.minute ?? index}`,
        type: 'sub_in',
        player_uid: sub.playerIn?.id != null ? String(sub.playerIn.id) : `fd-si-${index}`,
        player_name: inName,
        minute: sub.minute ?? 0,
        created_at: new Date(),
      });
      index += 1;
    }
  }
  return events;
}

async function fetchMatchDetail(matchId: number): Promise<FdMatchRow | null> {
  const token = readToken();
  if (!token) return null;
  const cacheKey = `fd:match:${matchId}`;
  const cached = readCached(cacheKey);
  if (cached?.[0]) {
    /* fixture cache only — detail fetched fresh below when needed */
  }
  const url = `${readBaseUrl()}/matches/${matchId}`;
  const response = await fetch(url, {
    headers: { 'X-Auth-Token': token },
  });
  if (response.status === 429) {
    throw new Error('Quota football-data.org dépassé.');
  }
  if (!response.ok) {
    throw new Error(`football-data.org indisponible (${response.status}).`);
  }
  const row = (await response.json()) as FdMatchRow;
  if (!row?.id) return null;
  writeCache(cacheKey, [mapFootballDataMatch(row)], TEAM_CACHE_TTL_MS);
  lastSyncAt = new Date();
  lastHealthy = true;
  lastMessage = undefined;
  return row;
}

function parseFdNumericId(fixtureId: string): number | null {
  const raw = fixtureId.startsWith('fd_')
    ? fixtureId.slice(3)
    : fixtureId.startsWith('api_')
      ? null
      : fixtureId;
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function cloneFixtures(fixtures: ExternalFixture[]): ExternalFixture[] {
  return fixtures.map((fixture) => ({
    ...fixture,
    starts_at: new Date(fixture.starts_at),
  }));
}

function readCached(key: string): ExternalFixture[] | null {
  const cached = cache.get(key);
  if (!cached || cached.expiresAt <= Date.now()) return null;
  return cloneFixtures(cached.fixtures);
}

function writeCache(key: string, fixtures: ExternalFixture[], ttlMs: number): void {
  cache.set(key, {
    expiresAt: Date.now() + ttlMs,
    fixtures: fixtures.map((fixture) => ({
      ...fixture,
      starts_at: new Date(fixture.starts_at),
    })),
  });
}

function formatApiDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function fetchMatches(
  pathAndQuery: string,
  cacheKey: string,
  cacheTtlMs: number,
): Promise<ExternalFixture[]> {
  const cached = readCached(cacheKey);
  if (cached) return cached;

  const token = readToken();
  if (!token) {
    lastHealthy = false;
    lastMessage = 'Token football-data.org absent.';
    return [];
  }

  const url = `${readBaseUrl()}${pathAndQuery.startsWith('/') ? pathAndQuery : `/${pathAndQuery}`}`;
  const response = await fetch(url, {
    headers: { 'X-Auth-Token': token },
  });

  if (response.status === 429) {
    const stale = cache.get(cacheKey);
    if (stale) {
      lastHealthy = true;
      lastMessage = 'Quota football-data.org — cache.';
      return cloneFixtures(stale.fixtures);
    }
    throw new Error('Quota football-data.org dépassé.');
  }

  if (!response.ok) {
    throw new Error(`football-data.org indisponible (${response.status}).`);
  }

  const payload = (await response.json()) as { matches?: FdMatchRow[] };
  const fixtures = (payload.matches ?? []).map(mapFootballDataMatch);
  writeCache(cacheKey, fixtures, cacheTtlMs);
  lastSyncAt = new Date();
  lastHealthy = true;
  lastMessage = undefined;
  return fixtures;
}

function competitionCodeForSlug(competition: ExternalCompetitionId): string | null {
  if (competition in FOOTBALL_DATA_COMPETITION_CODES) {
    return FOOTBALL_DATA_COMPETITION_CODES[
      competition as keyof typeof FOOTBALL_DATA_COMPETITION_CODES
    ];
  }
  return null;
}

function slugForLeagueId(leagueId: number): ExternalCompetitionId | null {
  const entry = Object.entries(COMPETITION_TO_API_LEAGUE).find(([, v]) => v.leagueId === leagueId);
  return entry ? entry[1].slug : null;
}

function teamTouchesApiId(fixture: ExternalFixture, teamId: number): boolean {
  if (fixture.home_team_id === teamId || fixture.away_team_id === teamId) return true;
  const club = SUPPORTER_POPULAR_CLUBS.find((c) => c.apiTeamId === teamId);
  if (!club) return false;
  const names = [club.name, ...(club.aliases ?? [])].map((n) => n.toLowerCase());
  const home = fixture.home_team.toLowerCase();
  const away = fixture.away_team.toLowerCase();
  return names.some((n) => home.includes(n.toLowerCase()) || away.includes(n.toLowerCase()) || n.includes(home) || n.includes(away));
}

export function createFootballDataProvider(): ExternalScoresProvider {
  return {
    source: 'football_data',
    async listFixtures(competition?: ExternalCompetitionId): Promise<ExternalFixture[]> {
      const codes = competition
        ? [competitionCodeForSlug(competition)].filter(Boolean)
        : Object.values(FOOTBALL_DATA_COMPETITION_CODES);

      const from = new Date();
      const to = new Date(from);
      to.setDate(from.getDate() + 14);
      const fromStr = formatApiDate(from);
      const toStr = formatApiDate(to);

      const batches = await Promise.all(
        (codes as string[]).map(async (code) => {
          if (!code) return [] as ExternalFixture[];
          try {
            return await fetchMatches(
              `/competitions/${code}/matches?dateFrom=${fromStr}&dateTo=${toStr}`,
              `fd:league:${code}:${fromStr}:${toStr}`,
              LEAGUE_CACHE_TTL_MS,
            );
          } catch {
            return readCached(`fd:league:${code}:${fromStr}:${toStr}`) ?? [];
          }
        }),
      );

      return batches
        .flat()
        .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
    },

    async listLiveFixtures(): Promise<ExternalFixture[]> {
      try {
        const fixtures = await fetchMatches('/matches?status=LIVE', 'fd:live', LIVE_CACHE_TTL_MS);
        return fixtures
          .filter((f) => f.status === 'live')
          .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
      } catch {
        return readCached('fd:live')?.filter((f) => f.status === 'live') ?? [];
      }
    },

    async listUpcomingFixtures(options?: ListUpcomingFixturesOptions): Promise<ExternalFixture[]> {
      const days = options?.days ?? 14;
      const from = new Date();
      const to = new Date(from);
      to.setDate(from.getDate() + days);
      const fromStr = formatApiDate(from);
      const toStr = formatApiDate(to);

      let codes = Object.values(FOOTBALL_DATA_COMPETITION_CODES);
      if (options?.leagueIds?.length) {
        codes = options.leagueIds
          .map((id) => {
            const slug = slugForLeagueId(id);
            return slug ? competitionCodeForSlug(slug) : null;
          })
          .filter((c): c is string => Boolean(c));
      }

      const batches = await Promise.all(
        codes.map(async (code) => {
          try {
            return await fetchMatches(
              `/competitions/${code}/matches?dateFrom=${fromStr}&dateTo=${toStr}&status=SCHEDULED`,
              `fd:up:${code}:${fromStr}:${toStr}`,
              UPCOMING_CACHE_TTL_MS,
            );
          } catch {
            return readCached(`fd:up:${code}:${fromStr}:${toStr}`) ?? [];
          }
        }),
      );

      const now = Date.now();
      return batches
        .flat()
        .filter((f) => f.status === 'scheduled' && f.starts_at.getTime() >= now)
        .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
    },

    async listTeamFixtures(teamId: number, options?: ListTeamFixturesOptions): Promise<ExternalFixture[]> {
      const status = options?.status ?? 'scheduled';
      const fdTeamId = FOOTBALL_DATA_TEAM_IDS[teamId];
      const days = options?.days ?? 14;
      const next = options?.next ?? 15;

      if (fdTeamId != null) {
        const statusParam =
          status === 'live' ? 'LIVE' : status === 'finished' ? 'FINISHED' : 'SCHEDULED';
        const cacheKey = `fd:team:${fdTeamId}:${statusParam}:${next}`;
        try {
          let fixtures = await fetchMatches(
            `/teams/${fdTeamId}/matches?status=${statusParam}&limit=${Math.max(next, 10)}`,
            cacheKey,
            status === 'live' ? LIVE_CACHE_TTL_MS : TEAM_CACHE_TTL_MS,
          );
          fixtures = fixtures.filter((f) => f.status === status);
          if (status === 'scheduled') {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() + days);
            const now = Date.now();
            fixtures = fixtures.filter(
              (f) => f.starts_at.getTime() >= now && f.starts_at <= cutoff,
            );
          }
          return fixtures.slice(0, next).sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
        } catch {
          /* fallback name filter below */
        }
      }

      const pool =
        status === 'live'
          ? await this.listLiveFixtures()
          : status === 'finished'
            ? (await this.listFixtures()).filter((f) => f.status === 'finished')
            : await this.listUpcomingFixtures({ days });

      return pool
        .filter((f) => f.status === status && teamTouchesApiId(f, teamId))
        .slice(0, next)
        .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
    },

    async listRecentFinishedFixtures(): Promise<ExternalFixture[]> {
      const from = new Date();
      from.setDate(from.getDate() - 7);
      const to = new Date();
      const fromStr = formatApiDate(from);
      const toStr = formatApiDate(to);
      try {
        const fixtures = await fetchMatches(
          `/matches?dateFrom=${fromStr}&dateTo=${toStr}&status=FINISHED`,
          `fd:finished:${fromStr}:${toStr}`,
          UPCOMING_CACHE_TTL_MS,
        );
        return fixtures
          .filter((f) => f.status === 'finished')
          .sort((a, b) => b.starts_at.getTime() - a.starts_at.getTime())
          .slice(0, 30);
      } catch {
        return [];
      }
    },

    async getFixtureById(fixtureId: string): Promise<ExternalFixture | null> {
      const numericId = parseFdNumericId(fixtureId);
      if (numericId == null) return null;
      try {
        const row = await fetchMatchDetail(numericId);
        return row ? mapFootballDataMatch(row) : null;
      } catch {
        return readCached(`fd:match:${numericId}`)?.[0] ?? null;
      }
    },

    async getFixtureLineups(fixtureId: string) {
      const numericId = parseFdNumericId(fixtureId);
      if (numericId == null) return { lineups: [] };
      try {
        const row = await fetchMatchDetail(numericId);
        return { lineups: row ? mapFootballDataLineups(row) : [] };
      } catch {
        return { lineups: [] };
      }
    },

    async getFixtureEvents(fixtureId: string) {
      const numericId = parseFdNumericId(fixtureId);
      if (numericId == null) return { events: [] };
      try {
        const row = await fetchMatchDetail(numericId);
        return { events: row ? mapFootballDataEvents(row) : [] };
      } catch {
        return { events: [] };
      }
    },

    async getFixtureStatistics() {
      // Stats avancées hors tier free — ne pas inventer.
      return { statistics: null };
    },

    async searchTeams(query: string): Promise<ExternalTeamHit[]> {
      const curated = searchCuratedPopularClubs(query, 12);
      return mergeTeamSearchHits(curated, [], 12);
    },

    async getState(): Promise<ExternalScoresProviderState> {
      return {
        source: 'football_data',
        last_sync_at: lastSyncAt ?? new Date(),
        healthy: lastHealthy || Boolean(readToken()),
        message:
          lastMessage ??
          (readToken()
            ? 'football-data.org (gratuit)'
            : 'Ajoutez EXPO_PUBLIC_FOOTBALL_DATA_TOKEN (compte free)'),
      };
    },
  };
}

/** Vide le cache (tests). */
export function resetFootballDataCache(): void {
  cache.clear();
  lastSyncAt = null;
  lastHealthy = false;
  lastMessage = undefined;
}
