import type {
  GenderScope,
  UnifiedCompetitionRef,
  UnifiedEventType,
  UnifiedLineupPlayer,
  UnifiedLineups,
  UnifiedMatch,
  UnifiedMatchEvent,
  UnifiedMatchStatus,
  UnifiedScore,
  UnifiedStatistics,
  UnifiedTeamRef,
} from './types';

/** Minimal Sportmonks fixture shape (v3 + includes). */
export type SmParticipant = {
  id: number;
  name: string;
  short_code?: string | null;
  image_path?: string | null;
  meta?: { location?: 'home' | 'away'; winner?: boolean | null };
};

export type SmScore = {
  id?: number;
  description?: string;
  score?: { goals?: number; participant?: string };
  goals?: number;
};

export type SmState = { id?: number; state?: string; name?: string; short_name?: string };

export type SmLeague = {
  id: number;
  name: string;
  image_path?: string | null;
  country_id?: number;
  type?: string | null;
  country?: { id?: number; name?: string | null };
};

export type SmPeriod = {
  id?: number;
  fixture_id?: number;
  type_id?: number;
  started?: number | null;
  ended?: number | null;
  counts_from?: number | null;
  ticking?: boolean | null;
  sort_order?: number | null;
  description?: string | null;
  time_added?: number | null;
  period_length?: number | null;
  minutes?: number | null;
  seconds?: number | null;
  has_timer?: boolean | null;
};

export type SmRound = {
  id?: number;
  name?: string | null;
  finished?: boolean | null;
  is_current?: boolean | null;
};

export type SmEvent = {
  id: number;
  type_id?: number;
  participant_id?: number;
  player_name?: string | null;
  related_player_name?: string | null;
  minute?: number | null;
  extra_minute?: number | null;
  result?: string | null;
  info?: string | null;
  addition?: string | null;
  type?: { id?: number; name?: string; code?: string };
};

export type SmLineupDetail = {
  type_id?: number;
  data?: { value?: number | string | null };
  type?: { id?: number; name?: string; code?: string; developer_name?: string };
};

export type SmXgRow = {
  id?: number;
  fixture_id?: number;
  type_id?: number;
  participant_id?: number;
  location?: 'home' | 'away' | string;
  data?: { value?: number | string | null };
  type?: {
    id?: number;
    name?: string;
    code?: string;
    developer_name?: string;
  };
};

export type SmLineup = {
  id?: number;
  sport_id?: number;
  fixture_id?: number;
  player_id?: number;
  team_id?: number;
  player_name?: string;
  jersey_number?: number | null;
  formation_position?: number | null;
  /** Sportmonks `"row:col"` e.g. `"1:1"`, `"3:2"` — null on bench. */
  formation_field?: string | null;
  type_id?: number;
  position_id?: number | null;
  captain?: boolean | null;
  player?: {
    id?: number;
    name?: string;
    common_name?: string | null;
    image_path?: string | null;
    display_name?: string | null;
  } | null;
  details?: SmLineupDetail[];
  /** Nested include `lineups.xGLineup` — response key often `xglineup`. */
  xglineup?: SmXgRow[] | SmXgRow | null;
  xGLineup?: SmXgRow[] | SmXgRow | null;
};

export type SmFormation = {
  id?: number;
  fixture_id?: number;
  participant_id?: number;
  formation?: string;
  location?: string;
};

export type SmStatistic = {
  id?: number;
  type_id?: number;
  participant_id?: number;
  data?: { value?: number | string | null };
  type?: { id?: number; name?: string; code?: string };
};

export type SmFixture = {
  id: number;
  name?: string;
  starting_at?: string;
  starting_at_timestamp?: number;
  result_info?: string | null;
  length?: number | null;
  state_id?: number;
  league_id?: number;
  season_id?: number;
  venue_id?: number | null;
  participants?: SmParticipant[];
  scores?: SmScore[];
  state?: SmState;
  league?: SmLeague;
  periods?: SmPeriod[];
  round?: SmRound | null;
  events?: SmEvent[];
  lineups?: SmLineup[];
  formations?: SmFormation[];
  statistics?: SmStatistic[];
  /** Include `xGFixture` — response key often `xgfixture`. */
  xgfixture?: SmXgRow[];
  xGFixture?: SmXgRow[];
  venue?: { id?: number; name?: string | null };
};

/** Sportmonks lineup type_id: starter XI. */
export const SM_LINEUP_STARTER = 11;
/** Sportmonks lineup type_id: bench. */
export const SM_LINEUP_BENCH = 12;

/** Player detail type_ids (Sportmonks). */
export const SM_DETAIL_SHOTS = 42;
export const SM_DETAIL_GOALS = 52;
export const SM_DETAIL_RATING = 118;
export const SM_DETAIL_MINUTES = 119;

/** Core Sportmonks position_id → libellé FR (réel uniquement). */
const SM_POSITION_FR: Record<number, string> = {
  24: 'Gardien',
  25: 'Défenseur',
  26: 'Milieu',
  27: 'Attaquant',
};

export function mapSmPositionLabel(positionId?: number | null): string | null {
  if (positionId == null) return null;
  return SM_POSITION_FR[positionId] ?? null;
}

/** Team / player expected metrics type_ids. */
export const SM_XG = 5304;
export const SM_XGOT = 5305;

const YOUTH_HINT = /\b(u1[0-9]|u2[0-1]|youth|jeunes?|academy|réserve|reserve)\b/i;
const WOMEN_HINT = /\b(women|woman|féminin|feminin|ladies|w\b|d1f|arkema|uwcl)\b/i;

export function inferGenderScope(label: string | undefined | null): GenderScope {
  const t = (label ?? '').trim();
  if (!t) return 'unknown';
  if (YOUTH_HINT.test(t)) return 'youth';
  if (WOMEN_HINT.test(t)) return 'women';
  if (/\b(men|homme|masculin|liga|premier|serie a|bundesliga)\b/i.test(t)) return 'men';
  return 'unknown';
}

export function mapSmStatus(
  state?: SmState | null,
  stateId?: number,
  periods?: SmPeriod[] | null,
): UnifiedMatchStatus {
  const code = (state?.short_name || state?.state || state?.name || '').toLowerCase();
  if (['inplay', 'live', '1st', '2nd', 'et', 'pen_live'].some((k) => code.includes(k))) return 'live';
  if (code.includes('ht') || code.includes('half')) return 'halftime';
  if (['ft', 'aet', 'ft_pen', 'finished', 'ended'].some((k) => code.includes(k))) return 'finished';
  if (code.includes('postpon') || code.includes('suspend')) return 'postponed';
  if (code.includes('cancel') || code.includes('abandon')) return 'cancelled';
  if (code.includes('ns') || code.includes('not started') || code.includes('scheduled')) return 'scheduled';
  // Common Sportmonks state ids (approx — never invent score from this)
  if (stateId === 2 || stateId === 3 || stateId === 4 || stateId === 22) return 'live';
  if (stateId === 5) return 'finished';
  if (stateId === 1) return 'scheduled';

  const fromPeriods = mapStatusFromPeriods(periods);
  if (fromPeriods) return fromPeriods;
  return 'unknown';
}

/** Dérive live / mi-temps depuis `periods` (include inplay sans `state`). */
export function mapStatusFromPeriods(periods?: SmPeriod[] | null): UnifiedMatchStatus | null {
  if (!periods?.length) return null;
  const ticking = periods.find((p) => p.ticking === true);
  if (ticking) {
    const desc = (ticking.description || '').toLowerCase();
    if (desc.includes('break') || desc.includes('half-time') || desc.includes('halftime')) {
      return 'halftime';
    }
    return 'live';
  }
  const open = periods.find((p) => p.ended == null && p.started != null);
  if (open) return 'live';
  return null;
}

/** Minute + libellé période depuis le period ticking (ou le plus récent). */
export function pickActivePeriod(periods?: SmPeriod[] | null): SmPeriod | null {
  if (!periods?.length) return null;
  const ticking = periods.find((p) => p.ticking === true);
  if (ticking) return ticking;
  const open = [...periods]
    .filter((p) => p.ended == null && p.started != null)
    .sort((a, b) => (b.sort_order ?? 0) - (a.sort_order ?? 0));
  if (open[0]) return open[0];
  return [...periods].sort((a, b) => (b.sort_order ?? 0) - (a.sort_order ?? 0))[0] ?? null;
}

/**
 * Parse Sportmonks `formation_field` `"row:col"` → pitch coordinates.
 * Row 1 = gardien, rows croissantes vers l’attaque ; col 1-based dans la ligne.
 */
export function parseFormationField(
  field: string | null | undefined,
): { row: number; col: number } | null {
  if (!field || typeof field !== 'string') return null;
  const m = /^(\d+)\s*:\s*(\d+)$/.exec(field.trim());
  if (!m) return null;
  const row = Number(m[1]);
  const col = Number(m[2]);
  if (!Number.isFinite(row) || !Number.isFinite(col) || row < 1 || col < 1) return null;
  return { row, col };
}

function scoreDesc(s: SmScore): string {
  return (s.description || '').toLowerCase().replace(/\s+/g, '_');
}

function pickScoreForDescription(
  scores: SmScore[] | undefined,
  side: 'home' | 'away',
  description: string,
): number | null {
  if (!scores?.length) return null;
  const want = description.toLowerCase();
  const sideRows = scores.filter((s) => (s.score?.participant || '').toLowerCase() === side);
  const match =
    sideRows.find((s) => scoreDesc(s) === want) ||
    scores.find(
      (s) =>
        scoreDesc(s) === want && (s.score?.participant || '').toLowerCase() === side,
    );
  if (typeof match?.score?.goals === 'number') return match.score.goals;
  return null;
}

function pickCurrentScore(scores: SmScore[] | undefined, side: 'home' | 'away'): number | null {
  if (!scores?.length) return null;
  const current = pickScoreForDescription(scores, side, 'current');
  if (current != null) return current;
  const second = pickScoreForDescription(scores, side, '2nd_half');
  if (second != null) return second;
  const first = pickScoreForDescription(scores, side, '1st_half');
  if (first != null) return first;
  const sideRows = scores.filter((s) => (s.score?.participant || '').toLowerCase() === side);
  const last = sideRows[sideRows.length - 1];
  if (typeof last?.score?.goals === 'number') return last.score.goals;
  return null;
}

export function mapSmParticipants(participants: SmParticipant[] | undefined): {
  home: UnifiedTeamRef;
  away: UnifiedTeamRef;
} {
  const home = participants?.find((p) => p.meta?.location === 'home') || participants?.[0];
  const away =
    participants?.find((p) => p.meta?.location === 'away') ||
    participants?.find((p) => p.id !== home?.id) ||
    participants?.[1];
  const toRef = (p: SmParticipant | undefined, fallback: string): UnifiedTeamRef => ({
    id: p ? `sm-team-${p.id}` : `sm-team-unknown-${fallback}`,
    name: p?.name || (fallback === 'home' ? 'Domicile' : 'Extérieur'),
    shortName: p?.short_code || undefined,
    logoUrl: p?.image_path || undefined,
    externalId: p?.id,
  });
  return { home: toRef(home, 'home'), away: toRef(away, 'away') };
}

function mapScore(fixture: SmFixture): UnifiedScore {
  const active = pickActivePeriod(fixture.periods);
  const minute =
    typeof active?.minutes === 'number' && Number.isFinite(active.minutes)
      ? active.minutes
      : null;
  const periodLabel =
    active?.description ||
    fixture.state?.name ||
    fixture.state?.short_name ||
    null;
  return {
    home: pickCurrentScore(fixture.scores, 'home'),
    away: pickCurrentScore(fixture.scores, 'away'),
    halfTimeHome: pickScoreForDescription(fixture.scores, 'home', '1st_half'),
    halfTimeAway: pickScoreForDescription(fixture.scores, 'away', '1st_half'),
    minute,
    period: periodLabel,
  };
}

function mapEventType(ev: SmEvent): UnifiedEventType {
  const code = (ev.type?.code || ev.type?.name || '').toLowerCase();
  if (code.includes('own')) return 'own_goal';
  if (code.includes('pen')) return 'penalty';
  if (code.includes('goal')) return 'goal';
  if (code.includes('yellow')) return 'yellow_card';
  if (code.includes('red')) return 'red_card';
  if (code.includes('subst')) return 'substitution';
  if (code.includes('var')) return 'var';
  return 'other';
}

export function mapSmEvents(events: SmEvent[] | undefined): UnifiedMatchEvent[] {
  if (!events?.length) return [];
  return events
    .map((ev) => ({
      id: `sm-ev-${ev.id}`,
      type: mapEventType(ev),
      minute: ev.minute ?? null,
      teamId: ev.participant_id != null ? `sm-team-${ev.participant_id}` : null,
      playerName: ev.player_name ?? null,
      assistName: ev.related_player_name ?? null,
      detail: ev.info || ev.addition || ev.result || null,
    }))
    .sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0));
}

function detailValue(details: SmLineupDetail[] | undefined, typeId: number): number | null {
  if (!details?.length) return null;
  const row = details.find((d) => d.type_id === typeId || d.type?.id === typeId);
  const v = row?.data?.value;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asXgRows(raw: SmXgRow[] | SmXgRow | null | undefined): SmXgRow[] {
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

function playerXg(lineup: SmLineup): number | null {
  const rows = [...asXgRows(lineup.xglineup), ...asXgRows(lineup.xGLineup)];
  if (!rows.length) return null;
  const xg =
    rows.find((r) => r.type_id === SM_XG || r.type?.id === SM_XG) ||
    rows.find((r) => {
      const code = (r.type?.code || r.type?.developer_name || r.type?.name || '').toLowerCase();
      return code.includes('expected_goals') || code.includes('expected-goals') || code === 'xg';
    }) ||
    rows[0];
  const v = xg?.data?.value;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function mapLineupRole(l: SmLineup): 'starter' | 'bench' {
  if (l.type_id === SM_LINEUP_BENCH) return 'bench';
  if (l.type_id === SM_LINEUP_STARTER) return 'starter';
  if (l.formation_field) return 'starter';
  if (l.formation_position != null && l.formation_position > 0) return 'starter';
  return 'bench';
}

function mapSmLineupPlayer(l: SmLineup): UnifiedLineupPlayer {
  const role = mapLineupRole(l);
  const field = role === 'starter' ? parseFormationField(l.formation_field) : null;
  const name =
    l.player?.display_name ||
    l.player?.common_name ||
    l.player?.name ||
    l.player_name ||
    'Joueur';
  return {
    id: `sm-player-${l.player_id ?? l.player?.id ?? l.id}`,
    name,
    number: l.jersey_number ?? null,
    position: mapSmPositionLabel(l.position_id),
    formationPosition: l.formation_position ?? null,
    pitchRow: field?.row ?? null,
    pitchCol: field?.col ?? null,
    role,
    photoUrl: l.player?.image_path || null,
    captain: l.captain === true,
    rating: detailValue(l.details, SM_DETAIL_RATING),
    minutes: detailValue(l.details, SM_DETAIL_MINUTES),
    goals: detailValue(l.details, SM_DETAIL_GOALS),
    shots: detailValue(l.details, SM_DETAIL_SHOTS),
    xg: playerXg(l),
  };
}

export function mapSmLineups(
  lineups: SmLineup[] | undefined,
  formations: SmFormation[] | undefined,
  homeId?: number,
  awayId?: number,
): UnifiedLineups | null {
  if (!lineups?.length || homeId == null || awayId == null) return null;
  const homeFormation = formations?.find((f) => f.participant_id === homeId)?.formation ?? null;
  const awayFormation = formations?.find((f) => f.participant_id === awayId)?.formation ?? null;

  const side = (teamId: number, formation: string | null) => {
    const players = lineups.filter((l) => l.team_id === teamId).map(mapSmLineupPlayer);
    return {
      teamId: `sm-team-${teamId}`,
      formation,
      players,
    };
  };

  return {
    home: side(homeId, homeFormation),
    away: side(awayId, awayFormation),
  };
}

const STAT_LABELS: Record<string, string> = {
  ball_possession: 'Possession',
  shots_total: 'Tirs',
  shots_on_target: 'Tirs cadrés',
  corners: 'Corners',
  fouls: 'Fautes',
  yellowcards: 'Cartons jaunes',
  redcards: 'Cartons rouges',
  offsides: 'Hors-jeux',
  passes_accurate: 'Passes réussies',
};

const XG_LABEL_BY_TYPE: Record<number, string> = {
  [SM_XG]: 'xG',
  [SM_XGOT]: 'xGoT',
};

function xgLabel(row: SmXgRow): string {
  const byId = row.type_id != null ? XG_LABEL_BY_TYPE[row.type_id] : undefined;
  if (byId) return byId;
  const code = (row.type?.developer_name || row.type?.code || row.type?.name || '').toLowerCase();
  if (code.includes('expected_goals_on_target') || code.includes('xgot') || code.includes('on target')) {
    return 'xGoT';
  }
  if (code.includes('expected_points') || code.includes('xpts') || /\bxpts\b/.test(code)) {
    return 'xPTS';
  }
  if (code.includes('expected_goals') || code.includes('expected-goals') || code === 'xg') {
    return 'xG';
  }
  if (row.type?.name) {
    const n = row.type.name;
    if (/\bxgot\b/i.test(n) || /on target/i.test(n)) return 'xGoT';
    if (/\bxpts\b/i.test(n) || /expected points/i.test(n)) return 'xPTS';
    if (/\bxg\b/i.test(n) || /expected goals/i.test(n)) return 'xG';
    return n;
  }
  return row.type_id != null ? `xG_${row.type_id}` : 'xG';
}

function xgKey(row: SmXgRow): string {
  const label = xgLabel(row);
  if (label === 'xG') return 'xg';
  if (label === 'xGoT') return 'xgot';
  if (label === 'xPTS') return 'xpts';
  return `xg_${row.type_id ?? label}`.toLowerCase().replace(/\s+/g, '_');
}

function roundStat(v: number | string | null): number | string | null {
  if (typeof v !== 'number' || !Number.isFinite(v)) return v;
  if (Number.isInteger(v)) return v;
  return Math.round(v * 1000) / 1000;
}

export function mapSmXgFixture(
  rows: SmXgRow[] | undefined,
  homeId?: number,
  awayId?: number,
): UnifiedStatistics['rows'] {
  if (!rows?.length || homeId == null || awayId == null) return [];
  const byKey = new Map<string, { home: number | string | null; away: number | string | null; label: string }>();
  for (const row of rows) {
    const key = xgKey(row);
    const label = xgLabel(row);
    const entry = byKey.get(key) ?? { home: null, away: null, label };
    const value = roundStat(row.data?.value ?? null);
    const loc = (row.location || '').toLowerCase();
    if (row.participant_id === homeId || loc === 'home') entry.home = value;
    if (row.participant_id === awayId || loc === 'away') entry.away = value;
    byKey.set(key, entry);
  }
  return [...byKey.entries()]
    .filter(([, v]) => v.home != null || v.away != null)
    .map(([key, v]) => ({ key, label: v.label, home: v.home, away: v.away }));
}

export function mapSmStatistics(
  stats: SmStatistic[] | undefined,
  homeId?: number,
  awayId?: number,
  xgRows?: SmXgRow[],
): UnifiedStatistics | null {
  const classic: UnifiedStatistics['rows'] = [];
  if (stats?.length && homeId != null && awayId != null) {
    const byKey = new Map<
      string,
      { home: number | string | null; away: number | string | null; label: string }
    >();
    for (const row of stats) {
      const code = (row.type?.code || row.type?.name || `type_${row.type_id}`)
        .toLowerCase()
        .replace(/\s+/g, '_');
      const label = STAT_LABELS[code] || row.type?.name || code;
      const entry = byKey.get(code) ?? { home: null, away: null, label };
      const value = row.data?.value ?? null;
      if (row.participant_id === homeId) entry.home = value;
      if (row.participant_id === awayId) entry.away = value;
      byKey.set(code, entry);
    }
    classic.push(
      ...[...byKey.entries()].map(([key, v]) => ({
        key,
        label: v.label,
        home: v.home,
        away: v.away,
      })),
    );
  }
  const xg = mapSmXgFixture(xgRows, homeId, awayId);
  const rows = [...xg, ...classic];
  return rows.length ? { rows } : null;
}

function readXgFixture(fixture: SmFixture): SmXgRow[] | undefined {
  return fixture.xgfixture ?? fixture.xGFixture;
}

export function mapSmFixtureToUnified(fixture: SmFixture): UnifiedMatch {
  const { home, away } = mapSmParticipants(fixture.participants);
  const competition: UnifiedCompetitionRef = {
    id: fixture.league ? `sm-league-${fixture.league.id}` : `sm-league-${fixture.league_id ?? 'unknown'}`,
    name: fixture.league?.name || 'Compétition',
    country: fixture.league?.country?.name || undefined,
    logoUrl: fixture.league?.image_path || undefined,
    externalId: fixture.league?.id ?? fixture.league_id,
    seasonId: fixture.season_id,
    genderScope: inferGenderScope(fixture.league?.name),
  };
  const date =
    fixture.starting_at_timestamp != null
      ? new Date(fixture.starting_at_timestamp * 1000)
      : fixture.starting_at
        ? new Date(fixture.starting_at.replace(' ', 'T') + 'Z')
        : new Date(NaN);

  const lineups = mapSmLineups(
    fixture.lineups,
    fixture.formations,
    home.externalId,
    away.externalId,
  );
  const events = mapSmEvents(fixture.events);
  const statistics = mapSmStatistics(
    fixture.statistics,
    home.externalId,
    away.externalId,
    readXgFixture(fixture),
  );
  const roundName = fixture.round?.name?.trim() || null;

  return {
    id: `external-sm-${fixture.id}`,
    source: 'external',
    homeTeam: home,
    awayTeam: away,
    competition,
    date: Number.isNaN(date.getTime()) ? new Date() : date,
    status: mapSmStatus(fixture.state, fixture.state_id, fixture.periods),
    score: mapScore(fixture),
    genderScope: competition.genderScope,
    lineup: lineups,
    statistics,
    events: events.length ? events : null,
    video: null,
    externalFixtureId: fixture.id,
    venue: fixture.venue?.name ?? null,
    round: roundName,
  };
}

export function mapSmTeam(raw: {
  id: number;
  name: string;
  short_code?: string | null;
  image_path?: string | null;
  country?: { name?: string };
}): UnifiedTeamRef {
  return {
    id: `sm-team-${raw.id}`,
    name: raw.name,
    shortName: raw.short_code || undefined,
    logoUrl: raw.image_path || undefined,
    country: raw.country?.name,
    externalId: raw.id,
  };
}

export function mapSmLeague(raw: SmLeague & { country?: { name?: string } }): UnifiedCompetitionRef {
  return {
    id: `sm-league-${raw.id}`,
    name: raw.name,
    country: raw.country?.name,
    logoUrl: raw.image_path || undefined,
    externalId: raw.id,
    genderScope: inferGenderScope(raw.name),
  };
}

export function parseExternalFixtureId(matchId: string): number | null {
  const m = /^external-sm-(\d+)$/.exec(matchId.trim());
  if (m) return Number(m[1]);
  if (/^\d+$/.test(matchId.trim())) return Number(matchId.trim());
  return null;
}

export function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
