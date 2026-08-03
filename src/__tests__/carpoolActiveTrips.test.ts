import { findActiveCarpoolTripsForUser } from '../utils/carpoolActiveTrips';
import type { StandaloneCarpoolOffer } from '../models/StandaloneCarpoolOffer';
import type { CarpoolSlot, TeamEvent } from '../models/TeamEvent';

const HOUR = 60 * 60 * 1000;

const offer = (o: Partial<StandaloneCarpoolOffer> = {}): StandaloneCarpoolOffer => ({
  id: 'o1',
  driver_uid: 'd1',
  driver_name: 'Driver',
  title: 'Trajet',
  departs_at: new Date(Date.now() + HOUR),
  seats: 3,
  passengers: [{ uid: 'p1', name: 'Alice', status: 'confirmed' }],
  status: 'open',
  trip_status: 'scheduled',
  created_at: new Date(),
  updated_at: new Date(),
  ...o,
});

const eventWith = (slot: CarpoolSlot, startsInMs = HOUR): TeamEvent =>
  ({
    id: 'e1',
    title: 'Match',
    event_type: 'match',
    organizer_uid: 'org',
    organizer_name: 'Org',
    starts_at: new Date(Date.now() + startsInMs),
    city: 'Lyon',
    invitee_uids: [],
    rsvps: {},
    carpool_slots: [slot],
  } as unknown as TeamEvent);

describe('findActiveCarpoolTripsForUser', () => {
  it('surface le trajet libre en cours pour le conducteur', () => {
    const res = findActiveCarpoolTripsForUser('d1', [], [offer({ trip_status: 'in_progress' })]);
    expect(res).toHaveLength(1);
    expect(res[0]).toMatchObject({ kind: 'standalone', role: 'driver', tripStatus: 'in_progress' });
  });

  it('surface le trajet en cours pour un passager confirmé, pas pour un tiers', () => {
    const list = [offer({ trip_status: 'in_progress' })];
    expect(findActiveCarpoolTripsForUser('p1', [], list)).toHaveLength(1);
    expect(findActiveCarpoolTripsForUser('stranger', [], list)).toHaveLength(0);
  });

  it('ignore un passager en attente (non confirmé)', () => {
    const list = [
      offer({
        trip_status: 'in_progress',
        passengers: [{ uid: 'p2', name: 'Bob', status: 'pending' }],
      }),
    ];
    expect(findActiveCarpoolTripsForUser('p2', [], list)).toHaveLength(0);
  });

  it('n’affiche un trajet programmé que dans la fenêtre de départ (±3h)', () => {
    const soon = offer({ trip_status: 'scheduled', departs_at: new Date(Date.now() + HOUR) });
    const far = offer({ trip_status: 'scheduled', departs_at: new Date(Date.now() + 5 * HOUR) });
    expect(findActiveCarpoolTripsForUser('d1', [], [soon])).toHaveLength(1);
    expect(findActiveCarpoolTripsForUser('d1', [], [far])).toHaveLength(0);
  });

  it('exclut les trajets terminés', () => {
    const done = offer({ trip_status: 'completed', status: 'completed' });
    expect(findActiveCarpoolTripsForUser('d1', [], [done])).toHaveLength(0);
  });

  it('surface un slot événement en cours pour le conducteur', () => {
    const event = eventWith({ driver_uid: 'd1', driver_name: 'Driver', trip_status: 'in_progress' });
    const res = findActiveCarpoolTripsForUser('d1', [event], []);
    expect(res).toHaveLength(1);
    expect(res[0]).toMatchObject({ kind: 'event', role: 'driver', tripStatus: 'in_progress' });
  });

  it('classe les trajets en cours avant les programmés', () => {
    const scheduled = offer({ id: 'o-sched', trip_status: 'scheduled' });
    const live = offer({ id: 'o-live', trip_status: 'in_progress' });
    const res = findActiveCarpoolTripsForUser('d1', [], [scheduled, live]);
    expect(res.map((r) => r.tripStatus)).toEqual(['in_progress', 'scheduled']);
  });
});
