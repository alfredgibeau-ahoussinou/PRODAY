import { canApproveMembership, canRequestClubMembership } from '../utils/membershipValidation';
import type { Membership } from '../models/Membership';
import { listPendingMembershipPlayers } from '../features/club/ui/clubPlayersModel';

function mem(partial: Partial<Membership> & Pick<Membership, 'id' | 'club_id' | 'player_uid'>): Membership {
  return {
    team_id: 'unassigned',
    player_name: 'Test',
    status: 'pending',
    requested_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
    ...partial,
  };
}

describe('club membership confirmation flow', () => {
  it('staff ne peut confirmer que les pending de son club', () => {
    const m = mem({ id: 'm1', club_id: 'club-a', player_uid: 'u1', status: 'pending' });
    expect(canApproveMembership(m, 'club-a')).toBe(true);
    expect(canApproveMembership(m, 'club-b')).toBe(false);
    expect(canApproveMembership({ ...m, status: 'active' }, 'club-a')).toBe(false);
  });

  it('bloque une 2e demande pending sur le même club', () => {
    const existing = [mem({ id: 'm1', club_id: 'c1', player_uid: 'u1', status: 'pending' })];
    expect(canRequestClubMembership(existing, 'c1').allowed).toBe(false);
    expect(canRequestClubMembership(existing, 'c2').allowed).toBe(true);
  });

  it('liste les pending avec nom (RGPD : pas d’email forcé)', () => {
    const rows = listPendingMembershipPlayers({
      memberships: [
        mem({
          id: 'm1',
          club_id: 'c1',
          player_uid: 'u1',
          player_name: 'Alex Dupont',
          role: 'coach',
          status: 'pending',
        }),
      ],
      playersByUid: new Map(),
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.name).toBe('Alex Dupont');
    expect(rows[0]?.membership.role).toBe('coach');
  });
});
