import {
  filterClubPlayersList,
  listPendingMembershipPlayers,
  memberInitials,
  membershipStatusLabel,
  membershipStatusTone,
  resolveClubMembershipCompliance,
  resolveClubPlayersBaseList,
  resolveClubPlayersSubtitle,
} from '../features/club/ui/clubPlayersModel';
import type { Membership } from '../models/Membership';
import type { User } from '../models/User';
import type { Team } from '../models/Team';

function user(partial: Partial<User> & Pick<User, 'uid' | 'display_name'>): User {
  return {
    email: `${partial.uid}@test.fr`,
    role: 'player',
    created_at: new Date(),
    updated_at: new Date(),
    profile: {},
    ...partial,
  } as User;
}

function membership(
  partial: Partial<Membership> & Pick<Membership, 'id' | 'player_uid' | 'status'>,
): Membership {
  const now = new Date();
  return {
    club_id: 'c1',
    team_id: 't1',
    player_name: 'Joueur',
    requested_at: now,
    created_at: now,
    updated_at: now,
    ...partial,
  };
}

describe('clubPlayersModel', () => {
  const players = [
    user({ uid: 'a', display_name: 'Alice' }),
    user({ uid: 'b', display_name: 'Bruno' }),
  ];
  const teams = [
    { id: 't1', club_id: 'c1', name: 'U15', coach_uids: [], is_default: false },
  ] as unknown as Team[];
  const memberships = [
    membership({ id: 'm1', player_uid: 'a', status: 'active' }),
    membership({ id: 'm2', player_uid: 'b', status: 'pending', player_name: 'Bruno' }),
  ];

  it('filtre actifs / pending / recherche', () => {
    const active = filterClubPlayersList({
      players,
      memberships,
      teams,
      query: '',
      filter: 'active',
    });
    expect(active.map((i) => i.player.uid)).toEqual(['a']);
    expect(active[0].teamName).toBe('U15');

    const pending = filterClubPlayersList({
      players,
      memberships,
      teams,
      query: 'bru',
      filter: 'pending',
    });
    expect(pending.map((i) => i.player.uid)).toEqual(['b']);
  });

  it('liste les adhésions pending', () => {
    const map = new Map(players.map((p) => [p.uid, p]));
    const pending = listPendingMembershipPlayers({
      memberships,
      playersByUid: map,
    });
    expect(pending).toHaveLength(1);
    expect(pending[0].name).toBe('Bruno');
  });

  it('résume le sous-titre', () => {
    expect(
      resolveClubPlayersSubtitle({ visibleCount: 2, pendingCount: 1, activeCount: 1 }),
    ).toContain('adhésion');
    expect(resolveClubPlayersBaseList({ players, members: [], memberships })).toHaveLength(2);
  });

  it('cherche aussi ce que la rangée affiche : licence, catégorie, équipe', () => {
    const licensed = [
      membership({
        id: 'm1',
        player_uid: 'a',
        status: 'active',
        license_number: '512004',
        category: 'U17',
      }),
      memberships[1]!,
    ];
    const base = { players, memberships: licensed, teams, filter: 'all' as const };

    expect(
      filterClubPlayersList({ ...base, query: '512004' }).map((i) => i.player.uid),
    ).toEqual(['a']);
    expect(filterClubPlayersList({ ...base, query: 'u17' }).map((i) => i.player.uid)).toEqual([
      'a',
    ]);
    /** L'équipe est cherchable parce qu'elle est affichée dans la ligne secondaire. */
    expect(filterClubPlayersList({ ...base, query: 'u15' })).toHaveLength(2);
    /** La recherche par nom continue de fonctionner. */
    expect(filterClubPlayersList({ ...base, query: 'alice' }).map((i) => i.player.uid)).toEqual([
      'a',
    ]);
  });

  it('formule l’état d’adhésion une seule fois, pour la carte et la fiche', () => {
    expect(membershipStatusLabel('active', true)).toBe('Licencié');
    expect(membershipStatusLabel('active', false)).toBe('Actif');
    expect(membershipStatusLabel('pending', false)).toBe('Adhésion en attente');
    expect(membershipStatusLabel('suspended', true)).toBe('Suspendu');
    expect(membershipStatusLabel(undefined, false)).toBe('Profil club');

    expect(membershipStatusTone('active')).toBe('ok');
    expect(membershipStatusTone('pending')).toBe('warn');
    expect(membershipStatusTone('rejected')).toBe('alert');
    expect(membershipStatusTone('left')).toBe('neutral');
  });

  it('replie la pastille sur les initiales quand il n’y a pas de numéro', () => {
    expect(memberInitials('Alice Durand')).toBe('AD');
    expect(memberInitials('Alice')).toBe('AL');
    expect(memberInitials('  ')).toBe('—');
    expect(memberInitials(null)).toBe('—');
  });

  it('compte la conformité sur les adhésions réelles, sans champ inventé', () => {
    const counts = resolveClubMembershipCompliance([
      membership({ id: 'm1', player_uid: 'a', status: 'active', license_number: '512004' }),
      membership({ id: 'm2', player_uid: 'b', status: 'active' }),
      membership({ id: 'm3', player_uid: 'c', status: 'pending' }),
      membership({ id: 'm4', player_uid: 'd', status: 'suspended' }),
      membership({ id: 'm5', player_uid: 'e', status: 'left' }),
    ]);
    expect(counts).toEqual({ active: 2, pending: 1, withoutLicense: 1, suspended: 1 });
  });
});
