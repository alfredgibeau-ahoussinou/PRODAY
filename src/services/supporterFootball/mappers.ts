import type {
  GenderScope,
  UnifiedCompetitionRef,
  UnifiedEventType,
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

export type SmLineup = {
  id?: number;
  sport_id?: number;
  fixture_id?: number;
  player_id?: number;
  team_id?: number;
  player_name?: string;
  jersey_number?: number | null;
  formation_position?: number | null;
  type_id?: number;
  position_id?: number | null;
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
  events?: SmEvent[];
  lineups?: SmLineup[];
  formations?: SmFormation[];
  statistics?: SmStatistic[];
  venue?: { id?: number; name?: string | null };
};

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

export function mapSmStatus(state?: SmState | null, stateId?: number): UnifiedMatchStatus {
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
  return 'unknown';
}

function pickCurrentScore(scores: SmScore[] | undefined, side: 'home' | 'away'): number | null {
  if (!scores?.length) return null;
  const current =
    scores.find((s) => (s.description || '').toLowerCase() === 'current') ||
    scores.find((s) => (s.description || '').toLowerCase() === '2nd_half') ||
    scores.find((s) => (s.description || '').toLowerCase() === '1st_half') ||
    scores[scores.length - 1];
  const participant = (current?.score?.participant || '').toLowerCase();
  if (participant === side && typeof current?.score?.goals === 'number') return current.score.goals;
  // Fallback: description CURRENT with nested goals per participant rows
  const sideRows = scores.filter((s) => (s.score?.participant || '').toLowerCase() === side);
  const best = sideRows.find((s) => (s.description || '').toLowerCase() === 'current') || sideRows[0];
  if (typeof best?.score?.goals === 'number') return best.score.goals;
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
  return {
    home: pickCurrentScore(fixture.scores, 'home'),
    away: pickCurrentScore(fixture.scores, 'away'),
    minute: null,
    period: fixture.state?.name || fixture.state?.short_name || null,
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
    const players = lineups
      .filter((l) => l.team_id === teamId)
      .map((l) => ({
        id: `sm-player-${l.player_id ?? l.id}`,
        name: l.player_name || 'Joueur',
        number: l.jersey_number ?? null,
        position: null as string | null,
        formationPosition: l.formation_position ?? null,
        role: (l.formation_position != null && l.formation_position > 0 ? 'starter' : 'bench') as
          | 'starter'
          | 'bench',
      }));
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

export function mapSmStatistics(
  stats: SmStatistic[] | undefined,
  homeId?: number,
  awayId?: number,
): UnifiedStatistics | null {
  if (!stats?.length || homeId == null || awayId == null) return null;
  const byKey = new Map<string, { home: number | string | null; away: number | string | null; label: string }>();
  for (const row of stats) {
    const code = (row.type?.code || row.type?.name || `type_${row.type_id}`).toLowerCase().replace(/\s+/g, '_');
    const label = STAT_LABELS[code] || row.type?.name || code;
    const entry = byKey.get(code) ?? { home: null, away: null, label };
    const value = row.data?.value ?? null;
    if (row.participant_id === homeId) entry.home = value;
    if (row.participant_id === awayId) entry.away = value;
    byKey.set(code, entry);
  }
  const rows = [...byKey.entries()].map(([key, v]) => ({
    key,
    label: v.label,
    home: v.home,
    away: v.away,
  }));
  return rows.length ? { rows } : null;
}

export function mapSmFixtureToUnified(fixture: SmFixture): UnifiedMatch {
  const { home, away } = mapSmParticipants(fixture.participants);
  const competition: UnifiedCompetitionRef = {
    id: fixture.league ? `sm-league-${fixture.league.id}` : `sm-league-${fixture.league_id ?? 'unknown'}`,
    name: fixture.league?.name || 'Compétition',
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
  const statistics = mapSmStatistics(fixture.statistics, home.externalId, away.externalId);

  return {
    id: `external-sm-${fixture.id}`,
    source: 'external',
    homeTeam: home,
    awayTeam: away,
    competition,
    date: Number.isNaN(date.getTime()) ? new Date() : date,
    status: mapSmStatus(fixture.state, fixture.state_id),
    score: mapScore(fixture),
    genderScope: competition.genderScope,
    lineup: lineups,
    statistics,
    events: events.length ? events : null,
    video: null,
    externalFixtureId: fixture.id,
    venue: fixture.venue?.name ?? null,
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
