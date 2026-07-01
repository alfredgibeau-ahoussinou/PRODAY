import {
  countRemainingCarpoolSeats,
  getNextMatchEvent,
  getNextTeamEvent,
  getUpcomingTeamEvents,
  isAmateurPlayerWithoutClub,
} from '../utils/amateurPlayerHome';
import type { User } from '../models/User';
import type { Membership } from '../models/Membership';
import type { TeamEvent } from '../models/TeamEvent';
import {
  getContractDaysRemaining,
  estimateProfileViews7d,
  hasCoachValidatedStats,
} from '../utils/proPlayerCareerMetrics';

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

describe('amateurPlayerHome helpers', () => {
  it('détecte joueur sans club ni adhésion', () => {
    expect(isAmateurPlayerWithoutClub(player(), null)).toBe(true);
    expect(isAmateurPlayerWithoutClub(player({ club_id: 'c1' }), null)).toBe(false);
    expect(isAmateurPlayerWithoutClub(player(), membership('active'))).toBe(false);
    expect(isAmateurPlayerWithoutClub(player(), membership('pending'))).toBe(false);
  });

  it('trie les événements à venir et trouve le prochain match', () => {
    const past = event({ id: 'past', starts_at: new Date(Date.now() - 86400000) });
    const training = event({
      id: 'tr',
      starts_at: new Date(Date.now() + 86400000),
      event_type: 'training',
    });
    const match = event({
      id: 'm',
      starts_at: new Date(Date.now() + 172800000),
      event_type: 'friendly',
    });
    const upcoming = getUpcomingTeamEvents([past, match, training]);
    expect(upcoming.map((e) => e.id)).toEqual(['tr', 'm']);
    expect(getNextTeamEvent([past, match, training])?.id).toBe('tr');
    expect(getNextMatchEvent([past, match, training])?.id).toBe('m');
  });

  it('calcule les places covoiturage restantes', () => {
    const ev = event({
      id: 'e1',
      starts_at: new Date(Date.now() + 1000),
      carpool_slots: [
        { driver_uid: 'd1', driver_name: 'Driver', seats: 3, passengers: [{ uid: 'p2', name: 'P2' }] },
      ],
    });
    expect(countRemainingCarpoolSeats(ev)).toBe(2);
    expect(countRemainingCarpoolSeats(event({ id: 'e2', starts_at: new Date() }))).toBeNull();
  });
});

describe('proPlayerCareerMetrics helpers', () => {
  it('interprète la disponibilité contractuelle', () => {
    expect(getContractDaysRemaining(player({ availability: 'available' })).kind).toBe('free');
    expect(getContractDaysRemaining(player({ availability: 'negotiating' })).kind).toBe('negotiating');
    expect(getContractDaysRemaining(player()).kind).toBe('unknown');
  });

  it('estime les consultations profil sur 7 jours', () => {
    const views = estimateProfileViews7d(player());
    expect(views).toBeGreaterThanOrEqual(0);
  });

  it('détecte stats validées coach', () => {
    expect(hasCoachValidatedStats(player())).toBe(false);
    expect(
      hasCoachValidatedStats(
        player({
          club_id: 'c1',
          season_stats: { matches: 5, goals: 1, assists: 0 },
        }),
      ),
    ).toBe(true);
  });
});
