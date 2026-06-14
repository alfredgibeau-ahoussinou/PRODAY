import type { GeoDensitySummary, GeoMarker, GeoRadiusKm } from '../types/geo';
import type { GeoPoint } from '../../models/User';
import type { FriendlyMatch } from '../../models/FriendlyMatch';
import type { SeasonCalendarItem } from '../../utils/seasonCalendar';
import type { TeamEvent } from '../../models/TeamEvent';
import { distanceBetween } from '../../utils/geoLocation';

export function filterByRadius(markers: GeoMarker[], radiusKm: GeoRadiusKm): GeoMarker[] {
  return markers.filter((m) => m.distanceKm <= radiusKm);
}

export function summarizeDensity(markers: GeoMarker[], radiusKm: GeoRadiusKm): GeoDensitySummary {
  const inRadius = filterByRadius(markers, radiusKm);
  return {
    usersNearby: inRadius.filter((m) => m.kind === 'user').length,
    matchesNearby: inRadius.filter((m) => m.kind === 'match').length,
    fieldsNearby: inRadius.filter((m) => m.kind === 'field').length,
    eventsNearby: inRadius.filter((m) => m.kind === 'event').length,
    radiusKm,
  };
}

/** Marqueurs géo — matchs et événements à proximité (spec §11). */
export function buildGeoMarkers(params: {
  userLocation?: GeoPoint;
  openMatches: FriendlyMatch[];
  calendarItems: SeasonCalendarItem[];
  events: TeamEvent[];
  radiusKm?: GeoRadiusKm;
}): GeoMarker[] {
  const markers: GeoMarker[] = [];

  for (const match of params.openMatches) {
    if (!match.location) continue;
    const distanceKm = distanceBetween(params.userLocation, match.location);
    if (distanceKm == null) continue;
    markers.push({
      id: `match-${match.id}`,
      kind: 'match',
      title: match.requester_club_name,
      subtitle: match.city,
      city: match.city,
      location: match.location,
      distanceKm,
      tab: 'matchs',
      entityId: match.id,
    });
  }

  for (const event of params.events) {
    const location = event.carpool_slots?.[0]?.meeting_location;
    if (!location) continue;
    const distanceKm = distanceBetween(params.userLocation, location);
    if (distanceKm == null) continue;
    markers.push({
      id: `event-${event.id}`,
      kind: 'event',
      title: event.title,
      subtitle: event.city,
      city: event.city,
      location,
      distanceKm,
      tab: 'matchs',
      entityId: event.id,
    });
  }

  return markers.sort((a, b) => a.distanceKm - b.distanceKm);
}
