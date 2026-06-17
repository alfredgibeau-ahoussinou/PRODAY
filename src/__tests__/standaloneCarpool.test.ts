import {
  parseFrenchDeparture,
  standaloneAvailableSeats,
  isStandalonePassenger,
} from '../utils/standaloneCarpool';
import type { StandaloneCarpoolOffer } from '../models/StandaloneCarpoolOffer';

describe('standaloneCarpool', () => {
  const offer: StandaloneCarpoolOffer = {
    id: 'o1',
    driver_uid: 'd1',
    driver_name: 'Driver',
    title: 'Trajet stade',
    departs_at: new Date('2026-06-15T14:30:00'),
    seats: 3,
    passengers: [{ uid: 'p1', name: 'Passager' }],
    status: 'open',
    created_at: new Date(),
    updated_at: new Date(),
  };

  it('calcule les places restantes', () => {
    expect(standaloneAvailableSeats(offer)).toBe(2);
  });

  it('détecte un passager', () => {
    expect(isStandalonePassenger(offer, 'p1')).toBe(true);
    expect(isStandalonePassenger(offer, 'x')).toBe(false);
  });

  it('parse une date française', () => {
    const d = parseFrenchDeparture('15/06/2026', '14:30');
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2026);
    expect(d!.getMonth()).toBe(5);
    expect(d!.getDate()).toBe(15);
  });
});
