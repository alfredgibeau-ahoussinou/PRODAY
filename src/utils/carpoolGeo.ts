import type { CarpoolPassenger, CarpoolSlot } from '../models/TeamEvent';
import type { GeoPoint } from '../models/User';
import { distanceBetween, formatDistanceKm } from './geoLocation';

export function formatCarpoolDistance(a?: GeoPoint, b?: GeoPoint): string | null {
  const km = distanceBetween(a, b);
  if (km == null) return null;
  return formatDistanceKm(km);
}

export function passengerPickupForUid(
  slot: CarpoolSlot,
  passengerUid: string
): CarpoolPassenger | undefined {
  return (slot.passengers ?? []).find((p) => p.uid === passengerUid);
}

export function pickupDistanceFromMeeting(
  slot: CarpoolSlot,
  passenger: CarpoolPassenger
): string | null {
  return formatCarpoolDistance(slot.meeting_location, passenger.pickup_location);
}
