import type { Follow } from '../models/Follow';
import type { ExternalFixture } from '../services/externalScores.types';
import { SUPPORTER_POPULAR_CLUBS } from '../content/supporterPopularClubs';
import type { SupporterFollowContext } from './supporterMatchFilters';

export const WORLD_TEAM_ID_PREFIX = 'wt:id:';
export const WORLD_TEAM_NAME_PREFIX = 'wt:name:';

export function normalizeTeamKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Résout l’identifiant API-Football d’un suivi club monde. */
export function resolveWorldTeamApiId(follow: Follow): number | undefined {
  if (follow.target_type !== 'club') return undefined;

  if (follow.target_id.startsWith(WORLD_TEAM_ID_PREFIX)) {
    const raw = Number(follow.target_id.slice(WORLD_TEAM_ID_PREFIX.length));
    return Number.isFinite(raw) ? raw : undefined;
  }

  const nameKeys = new Set<string>();
  if (follow.target_id.startsWith(WORLD_TEAM_NAME_PREFIX)) {
    nameKeys.add(follow.target_id.slice(WORLD_TEAM_NAME_PREFIX.length));
  }
  if (follow.target_label) {
    nameKeys.add(normalizeTeamKey(follow.target_label));
  }

  for (const club of SUPPORTER_POPULAR_CLUBS) {
    if (club.apiTeamId == null) continue;
    const keys = [club.name, ...(club.aliases ?? [])].map(normalizeTeamKey);
    if (keys.some((key) => nameKeys.has(key))) return club.apiTeamId;
  }

  return undefined;
}

function aliasKeysForApiTeamId(apiTeamId: number): string[] {
  const club = SUPPORTER_POPULAR_CLUBS.find((row) => row.apiTeamId === apiTeamId);
  if (!club) return [];
  return [club.name, ...(club.aliases ?? [])].map(normalizeTeamKey);
}

export function worldTeamFollowIdFromApiId(apiTeamId: number): string {
  return `${WORLD_TEAM_ID_PREFIX}${apiTeamId}`;
}

export function worldTeamFollowIdFromName(name: string): string {
  return `${WORLD_TEAM_NAME_PREFIX}${normalizeTeamKey(name)}`;
}

export function isWorldTeamFollowId(targetId: string): boolean {
  return (
    targetId.startsWith(WORLD_TEAM_ID_PREFIX) || targetId.startsWith(WORLD_TEAM_NAME_PREFIX)
  );
}

export function worldFollowTargetForTeam(input: {
  apiTeamId?: number;
  name: string;
}): { type: 'club'; id: string; label: string } {
  const id =
    input.apiTeamId != null
      ? worldTeamFollowIdFromApiId(input.apiTeamId)
      : worldTeamFollowIdFromName(input.name);
  return { type: 'club', id, label: input.name };
}

export interface WorldFollowIndex {
  teamIds: Set<string>;
  teamNames: Set<string>;
  clubLabels: Set<string>;
  /** Noms normalisés (alias catalogue) des équipes suivies par id API. */
  aliasKeys: Set<string>;
}

export function buildWorldFollowIndex(follows: Follow[]): WorldFollowIndex {
  const teamIds = new Set<string>();
  const teamNames = new Set<string>();
  const clubLabels = new Set<string>();
  const aliasKeys = new Set<string>();
  for (const follow of follows) {
    if (follow.target_type !== 'club') continue;
    if (follow.target_id.startsWith(WORLD_TEAM_ID_PREFIX)) {
      teamIds.add(follow.target_id.slice(WORLD_TEAM_ID_PREFIX.length));
    } else if (follow.target_id.startsWith(WORLD_TEAM_NAME_PREFIX)) {
      teamNames.add(follow.target_id.slice(WORLD_TEAM_NAME_PREFIX.length));
    }
    if (follow.target_label) {
      clubLabels.add(normalizeTeamKey(follow.target_label));
    }
    if (!isWorldTeamFollowId(follow.target_id) && follow.target_label) {
      clubLabels.add(normalizeTeamKey(follow.target_label));
    }
    const apiId = resolveWorldTeamApiId(follow);
    if (apiId != null) {
      teamIds.add(String(apiId));
      for (const key of aliasKeysForApiTeamId(apiId)) {
        aliasKeys.add(key);
      }
    }
  }
  return { teamIds, teamNames, clubLabels, aliasKeys };
}

export function fixtureMatchesWorldFollows(
  fixture: Pick<ExternalFixture, 'home_team' | 'away_team' | 'home_team_id' | 'away_team_id'>,
  index: WorldFollowIndex,
): boolean {
  const ids = [fixture.home_team_id, fixture.away_team_id]
    .filter((id): id is number => id != null)
    .map(String);
  if (ids.some((id) => index.teamIds.has(id))) return true;

  const names = [fixture.home_team, fixture.away_team].map(normalizeTeamKey);
  if (names.some((name) => index.teamNames.has(name))) return true;
  if (names.some((name) => index.clubLabels.has(name))) return true;
  if (names.some((name) => index.aliasKeys.has(name))) return true;
  return false;
}

/** Identifiants API des équipes monde suivies (max 8, dédupliqués). */
export function collectFollowedWorldTeamIds(follows: Follow[], max = 8): number[] {
  const ids = new Set<number>();
  for (const follow of follows) {
    const apiId = resolveWorldTeamApiId(follow);
    if (apiId != null) ids.add(apiId);
  }
  return Array.from(ids).slice(0, max);
}

export function matchItemTouchesFollows(
  item: {
    source: 'proday' | 'world';
    clubId?: string;
    tournamentId?: string;
    homeLabel: string;
    awayLabel: string;
    homeTeamId?: number;
    awayTeamId?: number;
  },
  ctx: SupporterFollowContext,
  worldIndex: WorldFollowIndex,
): boolean {
  if (item.clubId && ctx.clubIds.has(item.clubId)) return true;
  if (item.tournamentId && ctx.tournamentIds.has(item.tournamentId)) return true;
  if (item.source !== 'world') return false;
  return fixtureMatchesWorldFollows(
    {
      home_team: item.homeLabel,
      away_team: item.awayLabel,
      home_team_id: item.homeTeamId,
      away_team_id: item.awayTeamId,
    },
    worldIndex,
  );
}

export function hasClubOrWorldTeamFollows(follows: Follow[]): boolean {
  return follows.some((follow) => follow.target_type === 'club');
}
