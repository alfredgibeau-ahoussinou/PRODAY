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
  const teamById = new Map(input.teams.map((t) => [t.id, t]));
  const q = input.query.trim().toLowerCase();

  return input.players
    .map((player) => {
      const membership = membershipByUid.get(player.uid);
      const team = membership ? teamById.get(membership.team_id) : undefined;
      return { player, membership, teamName: team?.name };
    })
    .filter((item) => {
      if (input.filter === 'pending' && !pendingUids.has(item.player.uid)) return false;
      if (input.filter === 'active' && !activeUids.has(item.player.uid)) return false;
      if (!q) return true;
      /**
       * On cherche **ce que la rangée affiche**, et pas seulement le nom : sans
       * la licence, la catégorie et l'équipe, le champ de recherche promettait
       * une recherche de licence qu'il ne faisait pas.
       */
      const haystack = [
        item.player.display_name,
        item.player.email,
        item.membership?.license_number,
        item.membership?.category,
        item.player.profile?.category,
        item.teamName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
}

/**
 * État d'adhésion lisible — **une seule formulation** pour la carte effectif et
 * pour la fiche joueur (elle était recopiée dans les deux).
 */
export function membershipStatusLabel(
  status: Membership['status'] | undefined,
  hasLicense: boolean,
): string {
  if (status === 'pending') return 'Adhésion en attente';
  if (status === 'suspended') return 'Suspendu';
  if (status === 'rejected') return 'Refusé';
  if (status === 'left') return 'Parti';
  if (status === 'active' && hasLicense) return 'Licencié';
  if (status === 'active') return 'Actif';
  return 'Profil club';
}

/** Teinte d'état partagée, indépendante des jetons (mappée par chaque surface). */
export function membershipStatusTone(
  status: Membership['status'] | undefined,
): 'ok' | 'warn' | 'alert' | 'neutral' {
  if (status === 'active') return 'ok';
  if (status === 'pending') return 'warn';
  if (status === 'suspended' || status === 'rejected') return 'alert';
  return 'neutral';
}

/** Initiales — repli de la pastille quand le joueur n'a pas de numéro de maillot. */
export function memberInitials(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]!.slice(0, 1)}${parts[parts.length - 1]!.slice(0, 1)}`.toUpperCase();
}

export type ClubMembershipCompliance = {
  /** Adhésions actives. */
  active: number;
  /** Adhésions en attente de validation. */
  pending: number;
  /** Adhésions actives **sans numéro de licence** — la non-conformité réelle. */
  withoutLicense: number;
  /** Suspendues ou refusées. */
  suspended: number;
};

/**
 * Baromètre de conformité des adhésions — **dérivé des adhésions réelles**.
 *
 * L'ancien baromètre comptait des champs qui n'existent nulle part dans le
 * modèle (`solvencyStatus`, `medicalCertExpiry`) sur une liste jamais alimentée :
 * il affichait donc des zéros inventés. On ne compte plus que ce qui existe.
 */
export function resolveClubMembershipCompliance(
  memberships: Membership[],
): ClubMembershipCompliance {
  const counts: ClubMembershipCompliance = { active: 0, pending: 0, withoutLicense: 0, suspended: 0 };
  memberships.forEach((membership) => {
    if (membership.status === 'active') {
      counts.active += 1;
      if (!membership.license_number?.trim()) counts.withoutLicense += 1;
      return;
    }
    if (membership.status === 'pending') {
      counts.pending += 1;
      return;
    }
    if (membership.status === 'suspended' || membership.status === 'rejected') {
      counts.suspended += 1;
    }
  });
  return counts;
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
