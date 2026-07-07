import type { User } from '../models/User';
import type { Membership } from '../models/Membership';
import type { TeamEvent } from '../models/TeamEvent';
import {
  canRespondToTeamEvent,
  canViewTeamEventAsPlayer,
  hasActiveClubMembership,
  hasPendingClubMembership,
} from '../utils/membershipAccess';

function player(overrides: Partial<User['profile']> = {}): User {
  return {
    uid: 'p1',
    display_name: 'Joueur',
    email: 'j@test.com',
    role: 'player',
    is_verified: false,
    verification_status: 'NOT_REQUIRED',
    profile: { ...overrides },
    documents: [],
    created_at: new Date(),
    updated_at: new Date(),
    is_active: true,
  };
}

function membership(status: Membership['status']): Membership {
  return {
    id: 'm1',
    club_id: 'club-a',
    team_id: 't1',
    player_uid: 'p1',
    player_name: 'Joueur',
    status,
    requested_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  };
}

function event(partial: Partial<TeamEvent> & Pick<TeamEvent, 'id' | 'starts_at'>): TeamEvent {
  return {
    title: 'Event',
    event_type: 'training',
    organizer_uid: 'coach',
    organizer_name: 'Coach',
    city: 'Paris',
    invitee_uids: ['p1'],
    rsvps: { p1: 'pending' },
    created_at: new Date(),
    updated_at: new Date(),
    ...partial,
  };
}

describe('membershipAccess', () => {
  it('n’autorise les convocations qu’avec membership active', () => {
    expect(hasActiveClubMembership(player(), null)).toBe(false);
    expect(hasActiveClubMembership(player(), membership('pending'))).toBe(false);
    expect(hasActiveClubMembership(player(), membership('active'))).toBe(true);
    expect(hasPendingClubMembership(membership('pending'))).toBe(true);
  });

  it('autorise la visibilité événement via invitee_uids sans membership active', () => {
    const ev = event({ id: 'e1', starts_at: new Date() });
    expect(canViewTeamEventAsPlayer(player(), null, ev)).toBe(true);
    expect(canRespondToTeamEvent(player(), null, ev)).toBe(true);
  });

  it('bloque RSVP sans membership active ni convocation', () => {
    const ev = event({ id: 'e1', starts_at: new Date(), invitee_uids: ['other'] });
    expect(canRespondToTeamEvent(player(), null, ev)).toBe(false);
    expect(canViewTeamEventAsPlayer(player(), null, ev)).toBe(false);
  });
});
