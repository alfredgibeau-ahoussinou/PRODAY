import type { GeoPoint } from '../../models/User';
import type { MainTabId } from '../../navigation/mainTabConfig';

export type GeoRadiusKm = 1 | 5 | 10;

export type GeoEntityKind = 'user' | 'match' | 'field' | 'event';

export interface GeoMarker {
  id: string;
  kind: GeoEntityKind;
  title: string;
  subtitle: string;
  city: string;
  location: GeoPoint;
  distanceKm: number;
  tab: MainTabId;
  entityId: string;
}

export interface GeoDensitySummary {
  usersNearby: number;
  matchesNearby: number;
  fieldsNearby: number;
  eventsNearby: number;
  radiusKm: GeoRadiusKm;
}
