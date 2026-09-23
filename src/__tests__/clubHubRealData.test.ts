import {
  buildSessionCheckIns,
  buildTopScorers,
  buildClubChannels,
  buildCarpoolVehicles,
  buildPitchFacilities,
} from '../utils/clubHubRealData';
import type { TeamEvent } from '../models/TeamEvent';
import type { Team } from '../models/Team';
import type { ClubAnnouncement } from '../models/ClubAnnouncement';
import type { StandaloneCarpoolOffer } from '../models/StandaloneCarpoolOffer';

const NOW = new Date('2026-09-15T10:00:00Z').getTime();

function trainingEvent(overrides: Partial<TeamEvent>): TeamEvent {
  return {
    id: 'ev-1',
    title: 'Entraînement',
    event_type: 'training',
    organizer_uid: 'coach-1',
    organizer_name: 'Coach Martin',
    club_id: 'club-1',
    team_id: 'team-1',
    starts_at: new Date('2026-09-15T09:00:00Z'),
    ends_at: new Date('2026-09-15T10:30:00Z'),
    city: 'Paris',
    invitee_uids: ['p1', 'p2', 'p3'],
    rsvps: { p1: 'yes', p2: 'no', p3: 'pending' },
    ...overrides,
  } as TeamEvent;
}

describe('buildSessionCheckIns', () => {
  it('derives counts exclusively from persisted RSVPs and attendance marks', () => {
    const events = [
      trainingEvent({
        attendance_marks: { p1: 'present', p2: 'absent', p3: 'late' },
      }),
    ];
    const sessions = buildSessionCheckIns(events, new Map([['team-1', 'U17 R2']]), new Map(), NOW);

    expect(sessions).toHaveLength(1);
    const s = sessions[0];
    expect(s.teamName).toBe('U17 R2');
    expect(s.coachName).toBe('Coach Martin');
    expect(s.totalInvited).toBe(3);
    expect(s.presentsCount).toBe(2); // p1 present + p3 late
    expect(s.absentsCount).toBe(1);
    expect(s.injuredCount).toBe(0); // no injury note invented
    expect(s.pitchName).toBe('—'); // no location persisted
  });

  it('classifies status against the real clock and never invents attendees', () => {
    const past = trainingEvent({
      id: 'ev-past',
      starts_at: new Date(NOW - 3 * 3600_000),
      ends_at: new Date(NOW - 2 * 3600_000),
      invitee_uids: [],
      rsvps: {},
    });
    const upcoming = trainingEvent({
      id: 'ev-up',
      starts_at: new Date(NOW + 5 * 3600_000),
    });
    const sessions = buildSessionCheckIns([past, upcoming], new Map(), new Map(), NOW);

    expect(sessions.map((s) => s.status)).toEqual(['upcoming', 'completed']);
    expect(sessions.find((s) => s.sessionId === 'ev-past')?.presentsCount).toBe(0);
  });

  it('ignores non-training events', () => {
    const match = trainingEvent({ event_type: 'competition' });
    expect(buildSessionCheckIns([match], new Map(), new Map(), NOW)).toHaveLength(0);
  });
});

describe('buildTopScorers', () => {
  it('aggregates real player_match_stats only', () => {
    const match = trainingEvent({
      event_type: 'competition',
      team_id: 'team-1',
      player_match_stats: {
        p1: { uid: 'p1', player_name: 'Paul', goals: 2 } as NonNullable<
          TeamEvent['player_match_stats']
        >[string],
        p2: { uid: 'p2', player_name: 'Marc', goals: 1 } as NonNullable<
          TeamEvent['player_match_stats']
        >[string],
        p3: { uid: 'p3', player_name: 'Yanis' } as NonNullable<
          TeamEvent['player_match_stats']
        >[string],
      },
    });
    const scorers = buildTopScorers(
      [match],
      new Map([['p1', 'Paul R.'], ['p2', 'Marc D.']]),
      new Map([['team-1', 'Seniors A']]),
    );

    expect(scorers).toHaveLength(2); // p3 without goals is not ranked
    expect(scorers[0]).toMatchObject({ name: 'Paul R.', goals: 2, matches: 1, team: 'Seniors A' });
    expect(scorers[1]).toMatchObject({ name: 'Marc D.', goals: 1 });
    expect(scorers[0].rank).toBe(1);
  });

  it('returns an empty list when no stats are persisted (honest empty state)', () => {
    expect(buildTopScorers([trainingEvent({ event_type: 'friendly' })], new Map())).toEqual([]);
    expect(buildTopScorers([], new Map())).toEqual([]);
  });
});

describe('buildClubChannels', () => {
  it('builds the announcements channel from persisted announcements and one channel per team', () => {
    const teams = [
      { id: 't1', name: 'U17 R2', category: 'Formation' } as Team,
      { id: 't2', name: 'Seniors A' } as Team,
    ];
    const announcements: ClubAnnouncement[] = [
      {
        id: 'a1',
        club_id: 'club-1',
        author_uid: 'u1',
        author_name: 'Président',
        title: 'Terrain fermé',
        body: 'Détails…',
        created_at: new Date('2026-09-14T18:00:00Z'),
      },
    ];

    const channels = buildClubChannels(teams, announcements);
    expect(channels).toHaveLength(3);
    expect(channels[0]).toMatchObject({
      id: 'announcements',
      category: 'official',
      readOnlyForMembers: true,
    });
    expect(channels[0].lastMessage?.text).toBe('Terrain fermé');
    expect(channels[1]).toMatchObject({ name: 'U17 R2', category: 'team', categoryLabel: 'Formation' });
    expect(channels[2].categoryLabel).toBe('Équipe');
  });

  it('shows a neutral last message when no announcement exists (nothing invented)', () => {
    const channels = buildClubChannels([], []);
    expect(channels).toHaveLength(1);
    expect(channels[0].unreadCount).toBe(0);
    expect(channels[0].lastMessage?.author).toBe('—');
  });
});

describe('buildCarpoolVehicles', () => {
  it('maps open standalone offers with neutral values for absent fields', () => {
    const offers: StandaloneCarpoolOffer[] = [
      {
        id: 'o1',
        driver_uid: 'u1',
        driver_name: 'Stéphane M.',
        title: 'Aller au stade',
        departs_at: new Date('2026-09-16T11:45:00Z'),
        seats: 4,
        passengers: [{ uid: 'u2', name: 'Matéo D.', status: 'confirmed' }],
        status: 'open',
        meeting_place: 'Parking Gare',
        destination_label: 'Stade Montbauron',
        club_only: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 'o2',
        driver_uid: 'u2',
        driver_name: 'Nadia B.',
        title: 'Trajet complet',
        departs_at: new Date(),
        seats: 3,
        status: 'closed',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    const vehicles = buildCarpoolVehicles(offers);
    expect(vehicles).toHaveLength(1); // closed offers are excluded
    const v = vehicles[0];
    expect(v.driverName).toBe('Stéphane M.');
    expect(v.availableSeats).toBe(3);
    expect(v.totalSeats).toBe(4);
    expect(v.meetupPoint).toBe('Parking Gare');
    expect(v.destinationStadium).toBe('Stade Montbauron');
    expect(v.passengers).toEqual(['Matéo D.']);
    expect(v.contactPhone).toBe(''); // no fake phone number
  });

  it('falls back to neutral labels when optional fields are absent', () => {
    const vehicles = buildCarpoolVehicles([
      {
        id: 'o3',
        driver_uid: 'u9',
        driver_name: '',
        title: 'Trajet',
        departs_at: new Date('2026-09-16T08:30:00Z'),
        seats: 2,
        status: 'open',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
    expect(vehicles[0].driverName).toBe('Conducteur');
    expect(vehicles[0].meetupPoint).toBe('—');
    expect(vehicles[0].destinationStadium).toBe('—');
    expect(vehicles[0].vehicleModel).toBe('Véhicule');
  });
});

describe('buildPitchFacilities', () => {
  it('groups real training slots by inferred pitch and omits empty pitches', () => {
    const events = [
      trainingEvent({ id: 'e1', location_label: 'Synthétique A' }),
      trainingEvent({
        id: 'e2',
        starts_at: new Date('2026-09-16T19:00:00Z'),
        location_label: 'Synthétique A',
      }),
      trainingEvent({ id: 'e3', location_label: "Terrain d'Honneur" }),
    ];

    const facilities = buildPitchFacilities(events, new Map([['team-1', 'U17 R2']]));
    expect(facilities.map((f) => f.id)).toEqual(['synthetic_a', 'grass']);
    const synthA = facilities.find((f) => f.id === 'synthetic_a');
    expect(synthA?.slots).toHaveLength(2);
    expect(synthA?.slots[0].teamName).toBe('U17 R2'); // real team, no invented name
    expect(synthA?.slots[0].lightsRequired).toBe(false); // 09:00 < 18h
  });

  it('returns an empty list without training events', () => {
    expect(buildPitchFacilities([])).toEqual([]);
  });
});
