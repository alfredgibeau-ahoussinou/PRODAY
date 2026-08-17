import type { User } from '../models/User';
import type { Membership } from '../models/Membership';
import { filterMembersForTeam } from './coachTeamTheme';
import { filterMembersByCategory, memberUidsExcluding } from './clubMembersFilter';

/** Joueurs actifs rattachés à une équipe (memberships). */
export function countActivePlayersForTeam(
  memberships: Array<{ status: string; team_id: string; player_uid: string }>,
  teamId: string,
): number {
  return memberships.filter((m) => m.status === 'active' && m.team_id === teamId).length;
}

/** Union des joueurs des équipes sélectionnées — sans doublons si un joueur est sur plusieurs équipes. */
export function resolveInviteesForTeams<T extends { uid: string }>(
  members: T[],
  memberships: Array<{ status: string; team_id: string; player_uid: string }>,
  teamIds: string[],
): T[] {
  if (teamIds.length === 0) return [];
  const seen = new Set<string>();
  const result: T[] = [];
  for (const teamId of teamIds) {
    for (const member of filterMembersForTeam(members, memberships, teamId)) {
      if (!seen.has(member.uid)) {
        seen.add(member.uid);
        result.push(member);
      }
    }
  }
  return result;
}

/**
 * team_id sur l'événement :
 * - 1 équipe sélectionnée → id explicite (tous types d'événement)
 * - plusieurs équipes → undefined ; invitee_uids porte l'union des effectifs
 */
export function resolveEventTeamId(teamIds: string[]): string | undefined {
  if (teamIds.length === 1) return teamIds[0];
  return undefined;
}

export function resolveConvocationInviteeUids(
  members: User[],
  memberships: Membership[],
  teamIds: string[],
  selectedCategories: string[],
  excludeUid?: string,
): string[] {
  const fromTeams = resolveInviteesForTeams(members, memberships, teamIds);
  const filtered =
    selectedCategories.length > 0
      ? filterMembersByCategory(fromTeams, selectedCategories)
      : fromTeams;
  return memberUidsExcluding(filtered, excludeUid);
}

export function teamConvocationChipLabel(
  name: string,
  category: string | undefined,
  playerCount: number,
): string {
  const label = category?.trim() || name;
  return `${label} · ${playerCount}`;
}
