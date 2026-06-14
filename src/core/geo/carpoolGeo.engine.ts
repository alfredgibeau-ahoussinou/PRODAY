import type { TeamEvent, CarpoolSlot } from '../../models/TeamEvent';
import type { GeoPoint } from '../../models/User';
import { distanceBetween } from '../../utils/geoLocation';
import { rankScore } from '../recommendation/recommendation.engine';

export interface CarpoolRideOffer {
  eventId: string;
  driverUid: string;
  iaScore: number;
  distanceKm: number | null;
}

/** Ranking trajets — proximité RDV, places, urgence (spec §5). */
export function buildCarpoolRideRecommendations(params: {
  userLocation?: GeoPoint;
  rides: { event: TeamEvent; slot: CarpoolSlot }[];
}): CarpoolRideOffer[] {
  const now = Date.now();
  return params.rides
    .map(({ event, slot }) => {
      const distKm = distanceBetween(params.userLocation, slot.meeting_location);
      const distScore = distKm == null ? 0.5 : Math.max(0.15, 1 - distKm / 40);
      const seats = slot.seats ?? 3;
      const seatsScore = seats >= 2 ? 0.85 : seats >= 1 ? 0.65 : 0.4;
      const hoursUntil = (event.starts_at.getTime() - now) / 3600000;
      const urgency = hoursUntil <= 48 && hoursUntil >= 0 ? 0.15 : 0;
      const raw = distScore * 0.55 + seatsScore * 0.3 + urgency;
      return {
        eventId: event.id,
        driverUid: slot.driver_uid,
        iaScore: rankScore(raw),
        distanceKm: distKm,
      };
    })
    .sort((a, b) => b.iaScore - a.iaScore);
}

export function carpoolRideKey(eventId: string, driverUid: string): string {
  return `${eventId}:${driverUid}`;
}

export function sortCarpoolRides<T extends { event: TeamEvent; slot: CarpoolSlot }>(
  rides: T[],
  recs: CarpoolRideOffer[],
  enabled: boolean
): T[] {
  if (!enabled || recs.length === 0) return rides;
  const order = new Map(recs.map((r, i) => [carpoolRideKey(r.eventId, r.driverUid), i]));
  return [...rides].sort((a, b) => {
    const ka = order.get(carpoolRideKey(a.event.id, a.slot.driver_uid)) ?? 999;
    const kb = order.get(carpoolRideKey(b.event.id, b.slot.driver_uid)) ?? 999;
    return ka - kb;
  });
}
