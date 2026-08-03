import type { CarpoolPassenger, CarpoolSlot } from '../models/TeamEvent';
import type { StandaloneCarpoolOffer } from '../models/StandaloneCarpoolOffer';
import type { CarpoolTripStatus } from '../models/CarpoolLiveTrip';
import { isPassengerConfirmed } from './standaloneCarpool';

export function standaloneTripId(offerId: string): string {
  return `standalone_${offerId}`;
}

export function eventTripId(eventId: string, driverUid: string): string {
  return `event_${eventId}_${driverUid}`;
}

export function normalizeTripStatus(
  value: unknown,
  fallback: CarpoolTripStatus = 'scheduled',
): CarpoolTripStatus {
  if (value === 'in_progress' || value === 'completed' || value === 'scheduled') {
    return value;
  }
  return fallback;
}

/** Statut trajet dérivé d’une offre libre (champ dédié ou legacy via status). */
export function standaloneOfferTripStatus(offer: StandaloneCarpoolOffer): CarpoolTripStatus {
  if (offer.trip_status) return offer.trip_status;
  if (offer.status === 'in_progress') return 'in_progress';
  if (offer.status === 'completed' || offer.status === 'cancelled') return 'completed';
  return 'scheduled';
}

export function isTripActive(status: CarpoolTripStatus | undefined): boolean {
  return status === 'in_progress';
}

export function canStartCarpoolTrip(args: {
  viewerUid: string;
  driverUid: string;
  tripStatus: CarpoolTripStatus;
}): boolean {
  return args.viewerUid === args.driverUid && args.tripStatus === 'scheduled';
}

export function canEndCarpoolTrip(args: {
  viewerUid: string;
  driverUid: string;
  tripStatus: CarpoolTripStatus;
}): boolean {
  return args.viewerUid === args.driverUid && args.tripStatus === 'in_progress';
}

/** Passagers confirmés uniquement (pending exclus). */
export function confirmedPassengerUids(
  passengers: CarpoolPassenger[] | undefined,
): string[] {
  return (passengers ?? [])
    .filter((p) => isPassengerConfirmed(p))
    .map((p) => p.uid)
    .filter(Boolean);
}

export function buildTripParticipantUids(
  driverUid: string,
  passengers: CarpoolPassenger[] | undefined,
): string[] {
  return [...new Set([driverUid, ...confirmedPassengerUids(passengers)])];
}

export function canViewLiveLocation(args: {
  viewerUid: string;
  driverUid: string;
  passengers: CarpoolPassenger[] | undefined;
  tripStatus: CarpoolTripStatus;
}): boolean {
  if (!isTripActive(args.tripStatus)) return false;
  if (args.viewerUid === args.driverUid) return true;
  return confirmedPassengerUids(args.passengers).includes(args.viewerUid);
}

export function canPublishLiveLocation(args: {
  viewerUid: string;
  driverUid: string;
  tripStatus: CarpoolTripStatus;
}): boolean {
  return args.viewerUid === args.driverUid && isTripActive(args.tripStatus);
}

/** Transition validée côté client avant écriture Firestore. */
export function nextTripStatusOnStart(current: CarpoolTripStatus): CarpoolTripStatus {
  if (current !== 'scheduled') {
    throw new Error('Ce trajet ne peut plus être démarré.');
  }
  return 'in_progress';
}

export function nextTripStatusOnEnd(current: CarpoolTripStatus): CarpoolTripStatus {
  if (current !== 'in_progress') {
    throw new Error('Ce trajet n’est pas en cours.');
  }
  return 'completed';
}

export function slotTripStatus(slot: CarpoolSlot): CarpoolTripStatus {
  return normalizeTripStatus(slot.trip_status, 'scheduled');
}
