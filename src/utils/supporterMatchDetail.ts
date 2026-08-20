import type { EventLineup, LiveMatchAction, MatchLiveState, TeamEvent } from '../models/TeamEvent';
import type { SupporterMatchViewItem } from './supporterMatchFilters';

export interface ApiFootballLineupPlayer {
  id?: number | null;
  name?: string | null;
  number?: number | null;
  pos?: string | null;
  /** Grille API-Football « row:col » (ex. 1:1 = gardien). */
  grid?: string | null;
}

export interface ApiFootballLineupRow {
  team?: { id?: number | null; name?: string | null };
  formation?: string | null;
  startXI?: Array<{ player?: ApiFootballLineupPlayer }>;
  substitutes?: Array<{ player?: ApiFootballLineupPlayer }>;
}

export interface ApiFootballEventRow {
  time?: { elapsed?: number | null };
  team?: { name?: string | null };
  player?: { id?: number | null; name?: string | null };
  type?: string | null;
  detail?: string | null;
}

export interface ExternalFixtureLineup {
  teamName: string;
  teamId?: number;
  formation: string;
  lineup: EventLineup;
}

/** Ordre terrain : ligne puis colonne (gardien → attaque). */
export function compareApiFootballGrid(a?: string | null, b?: string | null): number {
  const parse = (grid?: string | null) => {
    const m = (grid ?? '').match(/^(\d+)\s*:\s*(\d+)$/);
    if (!m) return { row: 99, col: 99 };
    return { row: Number(m[1]), col: Number(m[2]) };
  };
  const left = parse(a);
  const right = parse(b);
  if (left.row !== right.row) return left.row - right.row;
  return left.col - right.col;
}

export function mapApiFootballLineup(row: ApiFootballLineupRow): ExternalFixtureLineup | null {
  const teamName = row.team?.name?.trim();
  if (!teamName) return null;
  const formation = (row.formation ?? '').trim() || '4-4-2';
  const orderedStart = [...(row.startXI ?? [])].sort((x, y) =>
    compareApiFootballGrid(x.player?.grid, y.player?.grid),
  );
  const starters = orderedStart
    .map((entry, index) => mapLineupPlayer(entry.player, 'starter', index))
    .filter((slot): slot is EventLineup['slots'][number] => Boolean(slot));
  const subs = (row.substitutes ?? [])
    .map((entry, index) => mapLineupPlayer(entry.player, 'sub', 100 + index))
    .filter((slot): slot is EventLineup['slots'][number] => Boolean(slot));
  if (starters.length === 0 && subs.length === 0) return null;
  return {
    teamName,
    teamId: row.team?.id ?? undefined,
    formation,
    lineup: { formation, slots: [...starters, ...subs] },
  };
}

function mapLineupPlayer(
  player: ApiFootballLineupPlayer | undefined,
  role: 'starter' | 'sub',
  fallbackIndex: number,
): EventLineup['slots'][number] | null {
  const name = player?.name?.trim();
  if (!name) return null;
  const uid = player?.id != null ? String(player.id) : `anon-${role}-${fallbackIndex}`;
  const pos = [player?.pos, player?.number != null ? String(player.number) : undefined]
    .filter(Boolean)
    .join(' · ');
  return {
    uid,
    display_name: name,
    role,
    position_label: pos || undefined,
  };
}

export function mapApiFootballEvent(row: ApiFootballEventRow, index: number): LiveMatchAction | null {
  const typeRaw = (row.type ?? '').toLowerCase();
  const detail = (row.detail ?? '').toLowerCase();
  let type: LiveMatchAction['type'] | null = null;
  if (typeRaw === 'goal') type = 'goal';
  else if (typeRaw === 'card' && detail.includes('red')) type = 'red_card';
  else if (typeRaw === 'card') type = 'yellow_card';
  else if (typeRaw === 'subst' && detail.includes('out')) type = 'sub_out';
  else if (typeRaw === 'subst') type = 'sub_in';
  if (!type) return null;
  const playerName = row.player?.name?.trim() ?? row.team?.name?.trim();
  if (!playerName) return null;
  return {
    id: `api-evt-${row.player?.id ?? index}-${row.time?.elapsed ?? index}`,
    type,
    player_uid: row.player?.id != null ? String(row.player.id) : `evt-${index}`,
    player_name: playerName,
    minute: row.time?.elapsed ?? 0,
    created_at: new Date(),
  };
}

export function liveStateFromMatchItem(item: SupporterMatchViewItem): MatchLiveState {
  const status =
    item.status === 'live' ? 'live' : item.status === 'finished' ? 'finished' : 'scheduled';
  return {
    status,
    minute: item.minute,
    home_score: item.scoreHome ?? 0,
    away_score: item.scoreAway ?? 0,
    home_label: item.homeLabel,
    opponent_name: item.awayLabel,
  };
}

export function syntheticEventFromLineup(
  item: SupporterMatchViewItem,
  teamName: string,
  lineup: EventLineup,
  actions: LiveMatchAction[],
): TeamEvent {
  const live = liveStateFromMatchItem(item);
  return {
    id: `${item.id}:${teamName}`,
    title: `${item.homeLabel} – ${item.awayLabel}`,
    event_type: 'competition',
    organizer_uid: 'world',
    organizer_name: item.competitionLabel ?? 'Monde',
    club_name: teamName,
    starts_at: item.startsAt,
    city: item.meta ?? '',
    invitee_uids: [],
    rsvps: {},
    created_at: new Date(),
    updated_at: new Date(),
    lineup,
    live_state: live,
    live_actions: actions,
  };
}

export type WorldFixtureRef =
  | { provider: 'api_football'; numericId: number; fixtureKey: string }
  | { provider: 'football_data'; numericId: number; fixtureKey: string };

/**
 * Parse les ids Match Center / provider :
 * `world-fixture-api_123`, `api_123`, `123`, `world-fixture-fd_456`, `fd_456`.
 */
export function parseWorldFixtureRef(itemId: string): WorldFixtureRef | null {
  const trimmed = itemId.trim();
  const bare = trimmed.startsWith('world-fixture-')
    ? trimmed.slice('world-fixture-'.length)
    : trimmed;

  if (/^\d+$/.test(bare)) {
    const numericId = Number(bare);
    if (!Number.isFinite(numericId)) return null;
    return { provider: 'api_football', numericId, fixtureKey: `api_${numericId}` };
  }

  const api = bare.match(/^api_(\d+)$/);
  if (api) {
    const numericId = Number(api[1]);
    if (!Number.isFinite(numericId)) return null;
    return { provider: 'api_football', numericId, fixtureKey: `api_${numericId}` };
  }

  const fd = bare.match(/^fd_(\d+)$/);
  if (fd) {
    const numericId = Number(fd[1]);
    if (!Number.isFinite(numericId)) return null;
    return { provider: 'football_data', numericId, fixtureKey: `fd_${numericId}` };
  }
  return null;
}

/** Clé provider depuis n’importe quel id Match Center (`world-fixture-…` / `api_…` / slug mock). */
export function extractWorldFixtureKey(itemId: string): string {
  const trimmed = itemId.trim();
  const ref = parseWorldFixtureRef(trimmed);
  if (ref) return ref.fixtureKey;
  if (trimmed.startsWith('world-fixture-')) return trimmed.slice('world-fixture-'.length);
  return trimmed;
}

/** @deprecated Prefer `parseWorldFixtureRef` — ne gère que les ids API-Football. */
export function parseWorldFixtureApiId(itemId: string): number | null {
  const ref = parseWorldFixtureRef(itemId);
  return ref?.provider === 'api_football' ? ref.numericId : null;
}

export function parseProdayEventId(itemId: string): string | null {
  const match = itemId.match(/^proday-event-(.+)$/);
  return match?.[1] ?? null;
}
