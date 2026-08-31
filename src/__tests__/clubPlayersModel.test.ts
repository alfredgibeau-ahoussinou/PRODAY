import {
  filterClubPlayersList,
  listPendingMembershipPlayers,
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
});
