import type { TeamEvent, CarpoolSlot } from '../../../models/TeamEvent';
import type { GeoPoint } from '../../../models/User';
import { distanceBetween } from '../../../utils/geoLocation';
import { estimateTravelMinutes, formatTravelEta } from '../../../utils/geoEta';
import type { GeoMarker } from '../../../core/types/geo';
import type { MainTabId } from '../../../navigation/mainTabConfig';
import {
  buildCarpoolRideRecommendations,
  sortCarpoolRides,
  carpoolRideKey,
  type CarpoolRideOffer,
} from '../../../core/geo/carpoolGeo.engine';

export { buildCarpoolRideRecommendations, sortCarpoolRides, carpoolRideKey, type CarpoolRideOffer };

export type CarpoolGeoRide = { event: TeamEvent; slot: CarpoolSlot };

export type CarpoolTripSummary = {
  distanceKm: number | null;
  etaMinutes: number | null;
  etaLabel: string | null;
  iaScore?: number;
};

/** Marqueurs carte — trajets covoit (pattern Uber + Google Maps). */
export function buildCarpoolGeoMarkers(params: {
  userLocation?: GeoPoint;
  rides: CarpoolGeoRide[];
}): GeoMarker[] {
  const markers: GeoMarker[] = [];
  for (const { event, slot } of params.rides) {
    const loc = slot.meeting_location;
    if (!loc) continue;
    const distanceKm = distanceBetween(params.userLocation, loc) ?? 0;
    markers.push({
      id: `carpool-${event.id}-${slot.driver_uid}`,
      kind: 'event',
      title: slot.driver_name,
      subtitle: event.title,
      city: event.city,
      location: loc,
      distanceKm,
      tab: 'covoiturage' as MainTabId,
      entityId: event.id,
    });
  }
  return markers.sort((a, b) => a.distanceKm - b.distanceKm);
}

/** Résumé trajet conducteur → RDV (distance + ETA). */
export function summarizeCarpoolTrip(params: {
  userLocation?: GeoPoint;
  slot: CarpoolSlot;
  rec?: CarpoolRideOffer;
}): CarpoolTripSummary {
  const distanceKm = distanceBetween(params.userLocation, params.slot.meeting_location);
  const etaMinutes = estimateTravelMinutes(distanceKm);
  return {
    distanceKm,
    etaMinutes,
    etaLabel: formatTravelEta(etaMinutes),
    iaScore: params.rec?.iaScore,
  };
}

export function findCarpoolRec(
  recs: CarpoolRideOffer[],
  eventId: string,
  driverUid: string
): CarpoolRideOffer | undefined {
  return recs.find((r) => r.eventId === eventId && r.driverUid === driverUid);
}
