import type { Follow } from '../models/Follow';
import type { ExternalFixture } from '../services/externalScores.types';
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
}

export function buildWorldFollowIndex(follows: Follow[]): WorldFollowIndex {
  const teamIds = new Set<string>();
  const teamNames = new Set<string>();
  const clubLabels = new Set<string>();
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
  }
  return { teamIds, teamNames, clubLabels };
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
  return false;
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
