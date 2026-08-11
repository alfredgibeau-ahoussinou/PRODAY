import type { Membership } from '../models/Membership';
import type { User } from '../models/User';

/** Lignes du stade (vue attaque en haut / fond). */
export type StadiumLineId = 'att' | 'mid' | 'def' | 'gk';

export type ClubStadiumPlayer = {
  uid: string;
  displayName: string;
  shortName: string;
  positionLabel: string;
  jerseyNumber?: number;
  photoUrl?: string;
  line: StadiumLineId;
};

export type ClubStadiumMarker = ClubStadiumPlayer & {
  /** 0 = fond (attaque), 1 = premier plan (gardien) — perspective */
  depth: number;
  /** 0..1 gauche → droite */
  x: number;
  indexInLine: number;
  countInLine: number;
};

export type ClubTeamStadiumMap = {
  teamId: string;
  onPitch: ClubStadiumMarker[];
  bench: ClubStadiumPlayer[];
  byLine: Record<StadiumLineId, ClubStadiumPlayer[]>;
};

const LINE_DEPTH: Record<StadiumLineId, number> = {
  att: 0.2,
  mid: 0.42,
  def: 0.68,
  gk: 0.9,
};

const LINE_ORDER: StadiumLineId[] = ['att', 'mid', 'def', 'gk'];

/** Max joueurs affichés sur une ligne avant bascule banc. */
export const STADIUM_MAX_PER_LINE = 7;

export function normalizeStadiumLine(raw?: string | null): StadiumLineId {
  const p = (raw ?? '').trim().toLowerCase();
  if (!p) return 'mid';
  if (
    p.includes('gardien') ||
    p === 'gb' ||
    p === 'gk' ||
    p.includes('goalkeeper') ||
    p.includes('keeper')
  ) {
    return 'gk';
  }
  if (
    p.includes('défense') ||
    p.includes('defense') ||
    p.includes('défenseur') ||
    p.includes('defenseur') ||
    p === 'def' ||
    p.includes('back') ||
    p.includes('centre-back') ||
    p.includes('latéral') ||
    p.includes('lateral')
  ) {
    return 'def';
  }
  if (
    p.includes('attaquant') ||
    p.includes('attaque') ||
    p === 'att' ||
    p.includes('forward') ||
    p.includes('striker') ||
    p.includes('ailier') ||
    p.includes('winger')
  ) {
    return 'att';
  }
  if (
    p.includes('milieu') ||
    p === 'mil' ||
    p.includes('midfield') ||
    p.includes('relayeur') ||
    p.includes('meneur')
  ) {
    return 'mid';
  }
  return 'mid';
}

function shortName(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  if (parts.length === 1) return parts[0].slice(0, 10);
  return `${parts[0].slice(0, 1)}. ${parts[parts.length - 1]}`.slice(0, 12);
}

export function clubStadiumPlayersFromRoster(
  teamId: string,
  memberships: Membership[],
  membersByUid: Map<string, User>,
): ClubStadiumPlayer[] {
  const active = memberships.filter(
    (m) =>
      m.status === 'active' &&
      m.team_id === teamId &&
      m.team_id !== 'unassigned',
  );

  return active.map((m) => {
    const user = membersByUid.get(m.player_uid);
    const displayName = user?.display_name || m.player_name || 'Joueur';
    const positionLabel = user?.profile?.position?.trim() || 'Milieu';
    const jerseyNumber = user?.profile?.jersey_number;
    return {
      uid: m.player_uid,
      displayName,
      shortName: shortName(displayName),
      positionLabel,
      jerseyNumber: typeof jerseyNumber === 'number' ? jerseyNumber : undefined,
      photoUrl: user?.avatar_url,
      line: normalizeStadiumLine(positionLabel),
    };
  });
}

function placeLine(players: ClubStadiumPlayer[], line: StadiumLineId): ClubStadiumMarker[] {
  const count = players.length;
  if (count === 0) return [];
  const depth = LINE_DEPTH[line];
  return players.map((p, indexInLine) => {
    const x = count === 1 ? 0.5 : (indexInLine + 1) / (count + 1);
    return {
      ...p,
      depth,
      x,
      indexInLine,
      countInLine: count,
    };
  });
}

/**
 * Carte stade pour une équipe : joueurs placés par poste (perspective),
 * surplus par ligne → banc.
 */
export function buildClubTeamStadiumMap(
  teamId: string,
  memberships: Membership[],
  membersByUid: Map<string, User>,
  maxPerLine = STADIUM_MAX_PER_LINE,
): ClubTeamStadiumMap {
  const roster = clubStadiumPlayersFromRoster(teamId, memberships, membersByUid);
  const byLine: Record<StadiumLineId, ClubStadiumPlayer[]> = {
    att: [],
    mid: [],
    def: [],
    gk: [],
  };
  for (const p of roster) {
    byLine[p.line].push(p);
  }

  // GB : un seul sur le terrain si plusieurs
  const onPitch: ClubStadiumMarker[] = [];
  const bench: ClubStadiumPlayer[] = [];

  for (const line of LINE_ORDER) {
    const list = byLine[line];
    const cap = line === 'gk' ? 1 : maxPerLine;
    const starters = list.slice(0, cap);
    const overflow = list.slice(cap);
    onPitch.push(...placeLine(starters, line));
    bench.push(...overflow);
  }

  onPitch.sort((a, b) => a.depth - b.depth || a.x - b.x);

  return { teamId, onPitch, bench, byLine };
}
