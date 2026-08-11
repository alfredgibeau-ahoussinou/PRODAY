import {
  buildClubTeamStadiumMap,
  normalizeStadiumLine,
} from '../utils/clubTeamStadium';
import type { Membership } from '../models/Membership';
import type { User } from '../models/User';

function mem(partial: Partial<Membership> & Pick<Membership, 'id' | 'player_uid' | 'team_id'>): Membership {
  return {
    club_id: 'club1',
    player_name: partial.player_name ?? 'Joueur',
    status: partial.status ?? 'active',
    requested_at: new Date(),
    ...partial,
  } as Membership;
}

function user(
  uid: string,
  name: string,
  position?: string,
): User {
  return {
    uid,
    display_name: name,
    email: `${uid}@test.proday`,
    role: 'player',
    is_verified: true,
    verification_status: 'VERIFIED',
    profile: position ? { position } : {},
  } as User;
}

describe('clubTeamStadium', () => {
  it('normalise les postes FR / EN', () => {
    expect(normalizeStadiumLine('Gardien')).toBe('gk');
    expect(normalizeStadiumLine('Défenseur')).toBe('def');
    expect(normalizeStadiumLine('Milieu')).toBe('mid');
    expect(normalizeStadiumLine('Attaquant')).toBe('att');
    expect(normalizeStadiumLine('goalkeeper')).toBe('gk');
    expect(normalizeStadiumLine(undefined)).toBe('mid');
  });

  it('place les joueurs d’une équipe sur le stade par poste', () => {
    const memberships = [
      mem({ id: '1', player_uid: 'a', team_id: 't1', player_name: 'Alex Gardien' }),
      mem({ id: '2', player_uid: 'b', team_id: 't1', player_name: 'Ben Def' }),
      mem({ id: '3', player_uid: 'c', team_id: 't1', player_name: 'Chloé Mil' }),
      mem({ id: '4', player_uid: 'd', team_id: 't1', player_name: 'Dan Att' }),
      mem({ id: '5', player_uid: 'e', team_id: 't2', player_name: 'Autre équipe' }),
      mem({ id: '6', player_uid: 'f', team_id: 't1', status: 'pending', player_name: 'Pending' }),
    ];
    const members = new Map<string, User>([
      ['a', user('a', 'Alex Gardien', 'Gardien')],
      ['b', user('b', 'Ben Def', 'Défenseur')],
      ['c', user('c', 'Chloé Mil', 'Milieu')],
      ['d', user('d', 'Dan Att', 'Attaquant')],
      ['e', user('e', 'Autre', 'Milieu')],
      ['f', user('f', 'Pending', 'Milieu')],
    ]);

    const map = buildClubTeamStadiumMap('t1', memberships, members);
    expect(map.onPitch).toHaveLength(4);
    expect(map.byLine.gk).toHaveLength(1);
    expect(map.byLine.def).toHaveLength(1);
    expect(map.byLine.mid).toHaveLength(1);
    expect(map.byLine.att).toHaveLength(1);
    expect(map.onPitch.find((p) => p.uid === 'a')?.depth).toBeGreaterThan(
      map.onPitch.find((p) => p.uid === 'd')!.depth,
    );
  });

  it('envoie le surplus de poste sur le banc', () => {
    const memberships = Array.from({ length: 3 }, (_, i) =>
      mem({ id: `g${i}`, player_uid: `g${i}`, team_id: 't1', player_name: `GB ${i}` }),
    );
    const members = new Map(
      memberships.map((m) => [m.player_uid, user(m.player_uid, m.player_name, 'Gardien')]),
    );
    const map = buildClubTeamStadiumMap('t1', memberships, members);
    expect(map.onPitch.filter((p) => p.line === 'gk')).toHaveLength(1);
    expect(map.bench).toHaveLength(2);
  });
});
