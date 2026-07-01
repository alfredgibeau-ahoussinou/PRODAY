import {
  canApproveMembership,
  canRequestClubMembership,
  hasActiveClubMembership,
} from '../utils/membershipValidation';
import type { Membership } from '../models/Membership';

function membership(partial: Partial<Membership> & Pick<Membership, 'id' | 'club_id' | 'status'>): Membership {
  return {
    team_id: 'team-1',
    player_uid: 'player-1',
    player_name: 'Joueur',
    requested_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
    ...partial,
  };
}

describe('membershipValidation', () => {
  it('refuse une nouvelle demande si affiliation active', () => {
    const list = [membership({ id: 'm1', club_id: 'club-a', status: 'active' })];
    expect(canRequestClubMembership(list, 'club-a').allowed).toBe(false);
    expect(canRequestClubMembership(list, 'club-b').allowed).toBe(true);
  });

  it('refuse une demande si pending existe', () => {
    const list = [membership({ id: 'm1', club_id: 'club-a', status: 'pending' })];
    expect(canRequestClubMembership(list, 'club-a').allowed).toBe(false);
  });

  it('autorise une nouvelle demande après rejet', () => {
    const list = [membership({ id: 'm1', club_id: 'club-a', status: 'rejected' })];
    expect(canRequestClubMembership(list, 'club-a').allowed).toBe(true);
  });

  it('détecte affiliation active ou pending', () => {
    expect(hasActiveClubMembership([], 'club-a')).toBe(false);
    expect(
      hasActiveClubMembership([membership({ id: 'm1', club_id: 'club-a', status: 'pending' })], 'club-a'),
    ).toBe(true);
  });

  it('valide approbation par staff du même club', () => {
    const pending = membership({ id: 'm1', club_id: 'club-a', status: 'pending' });
    expect(canApproveMembership(pending, 'club-a')).toBe(true);
    expect(canApproveMembership(pending, 'club-b')).toBe(false);
    expect(canApproveMembership({ ...pending, status: 'active' }, 'club-a')).toBe(false);
  });
});
