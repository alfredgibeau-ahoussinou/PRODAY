/**
 * Helpers purs Joueurs Club — filtres effectif, adhésions (testables).
 */
import type { Membership } from '../../../models/Membership';
import type { User } from '../../../models/User';
import type { Team } from '../../../models/Team';

export type ClubPlayersFilterId = 'all' | 'pending' | 'active';

export type ClubPlayerListItem = {
  player: User;
  membership?: Membership;
  teamName?: string;
};

export function resolveClubPlayersBaseList(input: {
  players: User[];
  members: User[];
  memberships: Membership[];
}): User[] {
  let list =
    input.players.length > 0
      ? input.players
      : input.members.filter((m) => m.role === 'player');
  if (list.length === 0) {
    const byUid = new Map(input.members.map((m) => [m.uid, m]));
    list = input.memberships
      .map((m) => byUid.get(m.player_uid))
      .filter(Boolean) as User[];
    const map = new Map(list.map((u) => [u.uid, u]));
    list = Array.from(map.values());
  }
  return list;
}

export function filterClubPlayersList(input: {
  players: User[];
  memberships: Membership[];
  teams: Team[];
  query: string;
  filter: ClubPlayersFilterId;
}): ClubPlayerListItem[] {
  const pendingUids = new Set(
    input.memberships.filter((m) => m.status === 'pending').map((m) => m.player_uid),
  );
  const activeUids = new Set(
    input.memberships.filter((m) => m.status === 'active').map((m) => m.player_uid),
  );
  const membershipByUid = new Map(input.memberships.map((m) => [m.player_uid, m]));
  const q = input.query.trim().toLowerCase();

  return input.players
    .filter((p) => {
      if (input.filter === 'pending' && !pendingUids.has(p.uid)) return false;
      if (input.filter === 'active' && !activeUids.has(p.uid)) return false;
      if (!q) return true;
      return (
        p.display_name?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q)
      );
    })
    .map((player) => {
      const membership = membershipByUid.get(player.uid);
      const team = input.teams.find((t) => t.id === membership?.team_id);
      return {
        player,
        membership,
        teamName: team?.name,
      };
    });
}

export function resolveClubPlayersSubtitle(input: {
  visibleCount: number;
  pendingCount: number;
  activeCount: number;
}): string {
  if (input.pendingCount > 0) {
    return `${input.visibleCount} profil${input.visibleCount > 1 ? 's' : ''} · ${input.pendingCount} adhésion${input.pendingCount > 1 ? 's' : ''} en attente`;
  }
  if (input.activeCount > 0) {
    return `${input.activeCount} actif${input.activeCount > 1 ? 's' : ''} · ${input.visibleCount} affiché${input.visibleCount > 1 ? 's' : ''}`;
  }
  return input.visibleCount > 0
    ? `${input.visibleCount} profil${input.visibleCount > 1 ? 's' : ''}`
    : 'Effectif & adhésions';
}

export function listPendingMembershipPlayers(input: {
  memberships: Membership[];
  playersByUid: Map<string, User>;
}): { membership: Membership; player?: User; name: string }[] {
  return input.memberships
    .filter((m) => m.status === 'pending')
    .map((membership) => {
      const player = input.playersByUid.get(membership.player_uid);
      return {
        membership,
        player,
        name:
          player?.display_name?.trim() ||
          membership.player_name?.trim() ||
          'Joueur',
      };
    });
}
