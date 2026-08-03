import {
  buildTripParticipantUids,
  canEndCarpoolTrip,
  canPublishLiveLocation,
  canStartCarpoolTrip,
  canViewLiveLocation,
  confirmedPassengerUids,
  eventTripId,
  isTripActive,
  nextTripStatusOnEnd,
  nextTripStatusOnStart,
  normalizeTripStatus,
  slotTripStatus,
  standaloneOfferTripStatus,
  standaloneTripId,
} from '../utils/carpoolLiveTrip';
import type { StandaloneCarpoolOffer } from '../models/StandaloneCarpoolOffer';
import type { CarpoolSlot } from '../models/TeamEvent';

describe('carpoolLiveTrip', () => {
  const offer = (overrides: Partial<StandaloneCarpoolOffer> = {}): StandaloneCarpoolOffer => ({
    id: 'o1',
    driver_uid: 'd1',
    driver_name: 'Driver',
    title: 'Match',
    departs_at: new Date('2026-08-03T18:00:00'),
    seats: 3,
    passengers: [
      { uid: 'p1', name: 'Alice', status: 'confirmed' },
      { uid: 'p2', name: 'Bob', status: 'pending' },
      { uid: 'p3', name: 'Cara', status: 'rejected' },
    ],
    status: 'open',
    trip_status: 'scheduled',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  });

  it('construit les ids de trajet stables', () => {
    expect(standaloneTripId('abc')).toBe('standalone_abc');
    expect(eventTripId('e1', 'd1')).toBe('event_e1_d1');
  });

  it('ne compte que les passagers confirmés', () => {
    expect(confirmedPassengerUids(offer().passengers)).toEqual(['p1']);
    expect(buildTripParticipantUids('d1', offer().passengers).sort()).toEqual(['d1', 'p1']);
  });

  it('autorise le démarrage uniquement au conducteur en scheduled', () => {
    expect(
      canStartCarpoolTrip({ viewerUid: 'd1', driverUid: 'd1', tripStatus: 'scheduled' }),
    ).toBe(true);
    expect(
      canStartCarpoolTrip({ viewerUid: 'p1', driverUid: 'd1', tripStatus: 'scheduled' }),
    ).toBe(false);
    expect(
      canStartCarpoolTrip({ viewerUid: 'd1', driverUid: 'd1', tripStatus: 'in_progress' }),
    ).toBe(false);
  });

  it('autorise la fin uniquement au conducteur en in_progress', () => {
    expect(
      canEndCarpoolTrip({ viewerUid: 'd1', driverUid: 'd1', tripStatus: 'in_progress' }),
    ).toBe(true);
    expect(
      canEndCarpoolTrip({ viewerUid: 'd1', driverUid: 'd1', tripStatus: 'scheduled' }),
    ).toBe(false);
  });

  it('restreint la vue live aux participants pendant in_progress', () => {
    const passengers = offer().passengers;
    expect(
      canViewLiveLocation({
        viewerUid: 'p1',
        driverUid: 'd1',
        passengers,
        tripStatus: 'in_progress',
      }),
    ).toBe(true);
    expect(
      canViewLiveLocation({
        viewerUid: 'p2',
        driverUid: 'd1',
        passengers,
        tripStatus: 'in_progress',
      }),
    ).toBe(false);
    expect(
      canViewLiveLocation({
        viewerUid: 'stranger',
        driverUid: 'd1',
        passengers,
        tripStatus: 'in_progress',
      }),
    ).toBe(false);
    expect(
      canViewLiveLocation({
        viewerUid: 'p1',
        driverUid: 'd1',
        passengers,
        tripStatus: 'scheduled',
      }),
    ).toBe(false);
    expect(
      canViewLiveLocation({
        viewerUid: 'd1',
        driverUid: 'd1',
        passengers,
        tripStatus: 'in_progress',
      }),
    ).toBe(true);
  });

  it('autorise la publication uniquement au conducteur actif', () => {
    expect(
      canPublishLiveLocation({
        viewerUid: 'd1',
        driverUid: 'd1',
        tripStatus: 'in_progress',
      }),
    ).toBe(true);
    expect(
      canPublishLiveLocation({
        viewerUid: 'p1',
        driverUid: 'd1',
        tripStatus: 'in_progress',
      }),
    ).toBe(false);
    expect(
      canPublishLiveLocation({
        viewerUid: 'd1',
        driverUid: 'd1',
        tripStatus: 'completed',
      }),
    ).toBe(false);
  });

  it('valide les transitions de statut', () => {
    expect(nextTripStatusOnStart('scheduled')).toBe('in_progress');
    expect(() => nextTripStatusOnStart('in_progress')).toThrow();
    expect(nextTripStatusOnEnd('in_progress')).toBe('completed');
    expect(() => nextTripStatusOnEnd('scheduled')).toThrow();
    expect(isTripActive('in_progress')).toBe(true);
    expect(isTripActive('completed')).toBe(false);
  });

  it('dérive le statut trajet depuis l’offre (trip_status ou legacy status)', () => {
    expect(standaloneOfferTripStatus(offer({ trip_status: 'in_progress' }))).toBe('in_progress');
    expect(
      standaloneOfferTripStatus(offer({ trip_status: undefined, status: 'in_progress' })),
    ).toBe('in_progress');
    expect(
      standaloneOfferTripStatus(offer({ trip_status: undefined, status: 'completed' })),
    ).toBe('completed');
    expect(standaloneOfferTripStatus(offer({ trip_status: undefined, status: 'open' }))).toBe(
      'scheduled',
    );
  });

  it('lit le trip_status d’un slot événement', () => {
    const slot: CarpoolSlot = {
      driver_uid: 'd1',
      driver_name: 'Driver',
      trip_status: 'in_progress',
    };
    expect(slotTripStatus(slot)).toBe('in_progress');
    expect(slotTripStatus({ driver_uid: 'd1', driver_name: 'D' })).toBe('scheduled');
    expect(normalizeTripStatus('nope')).toBe('scheduled');
  });
});
