import { aggregateCarpoolBalance, totalCarpoolSeats, isCarpoolDriver } from '../utils/carpoolBalance';
import type { TeamEvent } from '../models/TeamEvent';

describe('carpoolBalance', () => {
  const baseEvent = (id: string, drivers: string[], date: Date): TeamEvent =>
    ({
      id,
      title: 'Match',
      event_type: 'friendly',
      organizer_uid: 'coach1',
      organizer_name: 'Coach',
      starts_at: date,
      city: 'Paris',
      invitee_uids: drivers,
      rsvps: {},
      created_at: date,
      updated_at: date,
      carpool_slots: drivers.map((uid) => ({
        driver_uid: uid,
        driver_name: uid === 'p1' ? 'Alice' : 'Bob',
        seats: 3,
      })),
    }) as TeamEvent;

  it('agrège les trajets par conducteur', () => {
    const events = [
      baseEvent('e1', ['p1'], new Date('2026-01-10')),
      baseEvent('e2', ['p1', 'p2'], new Date('2026-02-10')),
      baseEvent('e3', ['p2'], new Date('2026-03-10')),
    ];
    const balance = aggregateCarpoolBalance(events);
    expect(balance.find((b) => b.uid === 'p1')?.trips).toBe(2);
    expect(balance.find((b) => b.uid === 'p2')?.trips).toBe(2);
    expect(balance[0].uid).toBe('p1');
  });

  it('totalise les places', () => {
    expect(totalCarpoolSeats([{ driver_uid: 'a', driver_name: 'A', seats: 3 }])).toBe(3);
    expect(totalCarpoolSeats([{ driver_uid: 'a', driver_name: 'A' }])).toBe(0);
  });

  it('détecte un conducteur', () => {
    const ev = baseEvent('e1', ['p1'], new Date());
    expect(isCarpoolDriver(ev, 'p1')).toBe(true);
    expect(isCarpoolDriver(ev, 'p9')).toBe(false);
  });
});
