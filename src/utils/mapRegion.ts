import type { GeoPoint } from '../models/User';
import type { GeoRadiusKm } from '../core/types/geo';
import { mapCenter } from './osmMapProjection';

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

/** Région carte centrée sur l'utilisateur avec marge autour du rayon. */
export function regionForRadius(center: GeoPoint | undefined, radiusKm: GeoRadiusKm): MapRegion {
  const resolved = mapCenter(center);
  const latRad = (resolved.latitude * Math.PI) / 180;
  const latDelta = Math.max((radiusKm / 111) * 2.6, 0.025);
  const lngDelta = Math.max(latDelta / Math.max(Math.cos(latRad), 0.25), 0.025);
  return {
    latitude: resolved.latitude,
    longitude: resolved.longitude,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}

export function markerTint(kind: 'user' | 'match' | 'event' | 'field', accent: string): string {
  if (kind === 'match') return '#15803d';
  if (kind === 'event') return '#c2410c';
  if (kind === 'field') return '#6d28d9';
  if (kind === 'user') return accent;
  return accent;
}
