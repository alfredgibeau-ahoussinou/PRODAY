import type { GeoPoint } from '../models/User';
import type { GeoRadiusKm } from '../core/types/geo';

export const DEFAULT_MAP_CENTER: GeoPoint = { latitude: 48.8566, longitude: 2.3522 };

export interface MapBbox {
  west: number;
  south: number;
  east: number;
  north: number;
}

export function mapCenter(center?: GeoPoint): GeoPoint {
  return center ?? DEFAULT_MAP_CENTER;
}

export function bboxForRadius(center: GeoPoint, radiusKm: GeoRadiusKm): MapBbox {
  const latRad = (center.latitude * Math.PI) / 180;
  const deltaLat = radiusKm / 111;
  const deltaLng = radiusKm / (111 * Math.max(Math.cos(latRad), 0.2));
  return {
    west: center.longitude - deltaLng,
    east: center.longitude + deltaLng,
    south: center.latitude - deltaLat,
    north: center.latitude + deltaLat,
  };
}

export function buildOsmEmbedUrl(center: GeoPoint, radiusKm: GeoRadiusKm): string {
  const bbox = bboxForRadius(center, radiusKm);
  const lat = center.latitude;
  const lng = center.longitude;
  return (
    'https://www.openstreetmap.org/export/embed.html' +
    `?bbox=${bbox.west}%2C${bbox.south}%2C${bbox.east}%2C${bbox.north}` +
    '&layer=mapnik' +
    `&marker=${lat}%2C${lng}`
  );
}

export function projectInBbox(
  point: GeoPoint,
  bbox: MapBbox,
  size: { width: number; height: number }
): { x: number; y: number } {
  const lngSpan = bbox.east - bbox.west || 0.0001;
  const latSpan = bbox.north - bbox.south || 0.0001;
  return {
    x: ((point.longitude - bbox.west) / lngSpan) * size.width,
    y: ((bbox.north - point.latitude) / latSpan) * size.height,
  };
}

export function zoomForRadius(radiusKm: GeoRadiusKm): number {
  if (radiusKm <= 1) return 14;
  if (radiusKm <= 5) return 12;
  return 11;
}
