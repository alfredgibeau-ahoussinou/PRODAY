/**
 * Map football-data.org v4 matches → UnifiedMatch (Supporter Space V3).
 */
import { inferGenderScope } from './mappers';
import type {
  UnifiedCompetitionRef,
  UnifiedMatch,
  UnifiedMatchEvent,
  UnifiedMatchStatus,
  UnifiedScore,
  UnifiedTeamRef,
} from './types';

/** Free-tier competition codes (football-data.org, 12 comps). */
export const FOOTBALL_DATA_FREE_COMPETITION_CODES = [
  'FL1', // Ligue 1
  'PL', // Premier League
  'PD', // La Liga
  'SA', // Serie A
  'BL1', // Bundesliga
  'CL', // Champions League
  'DED', // Eredivisie
  'PPL', // Primeira Liga
  'ELC', // Championship
  'BSA', // Brasileirão
  'WC', // World Cup
  'EC', // European Championship
] as const;

export type FootballDataCompetitionCode =
  (typeof FOOTBALL_DATA_FREE_COMPETITION_CODES)[number];

/** Primary majors we surface in Ligues rails (subset of free tier). */
export const FOOTBALL_DATA_PRIMARY_CODES: readonly FootballDataCompetitionCode[] = [
  'FL1',
  'PL',
  'PD',
  'SA',
  'BL1',
  'CL',
];

/** Sportmonks preferred league id → football-data code (when FD covers it). */
export const SPORTMONKS_TO_FOOTBALL_DATA: Record<number, FootballDataCompetitionCode> = {
  301: 'FL1',
  8: 'PL',
  564: 'PD',
  384: 'SA',
  82: 'BL1',
  2: 'CL',
};

/** Sportmonks preferred IDs covered by football-data free tier. */
export const FOOTBALL_DATA_COVERED_SPORTMONKS_IDS: readonly number[] = Object.keys(
  SPORTMONKS_TO_FOOTBALL_DATA,
).map(Number);

const CODE_META: Record<
  string,
  { name: string; country?: string; sportmonksId?: number }
> = {
  FL1: { name: 'Ligue 1', country: 'France', sportmonksId: 301 },
  PL: { name: 'Premier League', country: 'England', sportmonksId: 8 },
  PD: { name: 'La Liga', country: 'Spain', sportmonksId: 564 },
  SA: { name: 'Serie A', country: 'Italy', sportmonksId: 384 },
  BL1: { name: 'Bundesliga', country: 'Germany', sportmonksId: 82 },
  CL: { name: 'UEFA Champions League', sportmonksId: 2 },
  DED: { name: 'Eredivisie', country: 'Netherlands' },
  PPL: { name: 'Primeira Liga', country: 'Portugal' },
  ELC: { name: 'Championship', country: 'England' },
  BSA: { name: 'Campeonato Brasileiro Série A', country: 'Brazil' },
  WC: { name: 'FIFA World Cup' },
  EC: { name: 'UEFA European Championship' },
};

export interface FdTeam {
  id?: number;
  name?: string;
  shortName?: string;
  tla?: string;
  crest?: string;
}

export interface FdMatch {
  id: number;
  utcDate: string;
  status: string;
  minute?: number | null;
  venue?: string | null;
  matchday?: number | null;
  homeTeam: FdTeam;
  awayTeam: FdTeam;
  score?: {
    fullTime?: { home?: number | null; away?: number | null };
    halfTime?: { home?: number | null; away?: number | null };
  };
  competition?: { id?: number; name?: string; code?: string };
}

export function mapFdStatus(status: string, minute?: number | null): UnifiedMatchStatus {
  const s = (status || '').toUpperCase();
  if (s === 'PAUSED' || s === 'HALFTIME') return 'halftime';
  if (['IN_PLAY', 'LIVE', 'EXTRA_TIME', 'PENALTY_SHOOTOUT'].includes(s)) return 'live';
  if (['FINISHED', 'AWARDED'].includes(s)) return 'finished';
  if (s === 'POSTPONED') return 'postponed';
  if (s === 'CANCELLED' || s === 'CANCELED') return 'cancelled';
  if (['SCHEDULED', 'TIMED', 'NS'].includes(s)) return 'scheduled';
  if (minute != null && minute > 0) return 'live';
  return 'unknown';
}

function mapFdTeam(team: FdTeam, side: 'home' | 'away'): UnifiedTeamRef {
  const name = team.shortName?.trim() || team.name?.trim() || (side === 'home' ? 'Domicile' : 'Extérieur');
  return {
    id: team.id != null ? `fd-team-${team.id}` : `fd-team-${side}-${name}`,
    name,
    shortName: team.tla || team.shortName || undefined,
    logoUrl: team.crest || undefined,
    externalId: team.id,
  };
}

function mapFdCompetition(comp?: FdMatch['competition']): UnifiedCompetitionRef {
  const code = (comp?.code || '').toUpperCase();
  const meta = CODE_META[code];
  const name = comp?.name?.trim() || meta?.name || code || 'Compétition';
  return {
    id: code ? `fd-comp-${code}` : `fd-comp-${comp?.id ?? 'unknown'}`,
    name,
    country: meta?.country,
    externalId: meta?.sportmonksId ?? comp?.id,
    genderScope: inferGenderScope(name),
  };
}

function mapFdScore(match: FdMatch, status: UnifiedMatchStatus): UnifiedScore {
  const ft = match.score?.fullTime;
  const ht = match.score?.halfTime;
  const home = ft?.home ?? (status === 'live' || status === 'halftime' ? ht?.home ?? null : null);
  const away = ft?.away ?? (status === 'live' || status === 'halftime' ? ht?.away ?? null : null);
  return {
    home: home ?? null,
    away: away ?? null,
    halfTimeHome: ht?.home ?? null,
    halfTimeAway: ht?.away ?? null,
    minute: status === 'live' || status === 'halftime' ? match.minute ?? null : null,
    period: status === 'halftime' ? 'HT' : status === 'live' ? 'LIVE' : null,
  };
}

/** Pure mapper — unit-tested for FL1 fixtures. */
export function mapFdMatchToUnified(match: FdMatch): UnifiedMatch {
  const status = mapFdStatus(match.status, match.minute);
  const competition = mapFdCompetition(match.competition);
  const date = new Date(match.utcDate);
  return {
    id: `external-fd-${match.id}`,
    source: 'external',
    homeTeam: mapFdTeam(match.homeTeam, 'home'),
    awayTeam: mapFdTeam(match.awayTeam, 'away'),
    competition,
    date: Number.isNaN(date.getTime()) ? new Date() : date,
    status,
    score: mapFdScore(match, status),
    genderScope: competition.genderScope,
    lineup: null,
    statistics: null,
    events: null,
    video: null,
    externalFixtureId: match.id,
    venue: match.venue ?? null,
    round: match.matchday != null ? String(match.matchday) : null,
  };
}

export function parseFootballDataMatchId(matchId: string): number | null {
  const m = /^external-fd-(\d+)$/.exec(matchId.trim());
  if (m) return Number(m[1]);
  return null;
}

/** Normalize team names for cross-provider dedupe. */
export function normalizeMatchTeamName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(fc|cf|sc|ac|as|rc|ogc|st|saint|ss|ud|cd|afc)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export function externalMatchDedupeKey(match: UnifiedMatch): string {
  const y = match.date.getUTCFullYear();
  const m = String(match.date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(match.date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}|${normalizeMatchTeamName(match.homeTeam.name)}|${normalizeMatchTeamName(match.awayTeam.name)}`;
}

/** Prefer richer payload when the same fixture appears in both providers. */
export function matchPayloadRichness(match: UnifiedMatch): number {
  let score = 0;
  if (match.events?.length) score += Math.min(match.events.length, 20);
  if (match.lineup?.home?.players?.length || match.lineup?.away?.players?.length) score += 12;
  if (match.statistics?.rows?.length) score += 8;
  if (match.score.minute != null) score += 3;
  if (match.venue) score += 1;
  if (match.round) score += 1;
  // Slight bias to Sportmonks when richness is otherwise equal (richer live feed).
  if (match.id.startsWith('external-sm-')) score += 1;
  return score;
}

export function mergeExternalMatchesPreferRicher(
  batches: UnifiedMatch[][],
): UnifiedMatch[] {
  const byKey = new Map<string, UnifiedMatch>();
  for (const list of batches) {
    for (const match of list) {
      const key = externalMatchDedupeKey(match);
      const prev = byKey.get(key);
      if (!prev || matchPayloadRichness(match) > matchPayloadRichness(prev)) {
        byKey.set(key, match);
      }
    }
  }
  return [...byKey.values()];
}

export function mapFdEventsStub(_match: FdMatch): UnifiedMatchEvent[] {
  // Free tier typically omits per-match goals/bookings; keep empty honestly.
  return [];
}
