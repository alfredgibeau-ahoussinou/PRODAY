import type { TeamEvent, CarpoolSlot } from '../models/TeamEvent';
import type { StandaloneCarpoolOffer } from '../models/StandaloneCarpoolOffer';
import type { CarpoolTripStatus } from '../models/CarpoolLiveTrip';
import {
  eventTripId,
  isTripActive,
  slotTripStatus,
  standaloneOfferTripStatus,
  standaloneTripId,
} from './carpoolLiveTrip';
import { isPassengerConfirmed, isStandaloneConfirmedPassenger } from './standaloneCarpool';

export type ActiveCarpoolTripRef =
  | {
      kind: 'standalone';
      tripId: string;
      offer: StandaloneCarpoolOffer;
      driverUid: string;
      driverName: string;
      tripStatus: CarpoolTripStatus;
      role: 'driver' | 'passenger';
    }
  | {
      kind: 'event';
      tripId: string;
      event: TeamEvent;
      slot: CarpoolSlot;
      driverUid: string;
      driverName: string;
      tripStatus: CarpoolTripStatus;
      role: 'driver' | 'passenger';
    };

/** Trajets live ou prêts à démarrer pour l’utilisateur. */
export function findActiveCarpoolTripsForUser(
  uid: string,
  events: TeamEvent[],
  offers: StandaloneCarpoolOffer[],
): ActiveCarpoolTripRef[] {
  const out: ActiveCarpoolTripRef[] = [];

  for (const offer of offers) {
    const status = standaloneOfferTripStatus(offer);
    const isDriver = offer.driver_uid === uid;
    const isPassenger = isStandaloneConfirmedPassenger(offer, uid);
    if (!isDriver && !isPassenger) continue;
    if (status !== 'in_progress' && status !== 'scheduled') continue;
    // scheduled: only surface if departure within 3h or already in progress
    if (status === 'scheduled') {
      const ms = offer.departs_at.getTime() - Date.now();
      if (ms > 3 * 60 * 60 * 1000 || ms < -30 * 60 * 1000) continue;
    }
    out.push({
      kind: 'standalone',
      tripId: standaloneTripId(offer.id),
      offer,
      driverUid: offer.driver_uid,
      driverName: offer.driver_name,
      tripStatus: status,
      role: isDriver ? 'driver' : 'passenger',
    });
  }

  for (const event of events) {
    for (const slot of event.carpool_slots ?? []) {
      const status = slotTripStatus(slot);
      const isDriver = slot.driver_uid === uid;
      const isPassenger = (slot.passengers ?? []).some(
        (p) => p.uid === uid && isPassengerConfirmed(p),
      );
      if (!isDriver && !isPassenger) continue;
      if (status !== 'in_progress' && status !== 'scheduled') continue;
      if (status === 'scheduled') {
        const when = event.starts_at;
        if (when) {
          const ms = when.getTime() - Date.now();
          if (ms > 3 * 60 * 60 * 1000 || ms < -30 * 60 * 1000) continue;
        }
      }
      out.push({
        kind: 'event',
        tripId: eventTripId(event.id, slot.driver_uid),
        event,
        slot,
        driverUid: slot.driver_uid,
        driverName: slot.driver_name,
        tripStatus: status,
        role: isDriver ? 'driver' : 'passenger',
      });
    }
  }

  return out.sort((a, b) => {
    const aLive = isTripActive(a.tripStatus) ? 0 : 1;
    const bLive = isTripActive(b.tripStatus) ? 0 : 1;
    return aLive - bLive;
  });
}
