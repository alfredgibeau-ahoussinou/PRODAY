import type { GeoMarker } from '../types/geo';

export interface GeoCluster {
  id: string;
  count: number;
  centerLat: number;
  centerLng: number;
  markers: GeoMarker[];
  label: string;
}

/** Clustering grille — pattern Google Maps simplifié. */
export function clusterGeoMarkers(
  markers: GeoMarker[],
  cellKm = 2
): { clusters: GeoCluster[]; singles: GeoMarker[] } {
  if (markers.length <= 6) {
    return { clusters: [], singles: markers };
  }

  const cellDeg = cellKm / 111;
  const buckets = new Map<string, GeoMarker[]>();

  for (const m of markers) {
    const key = `${Math.floor(m.location.latitude / cellDeg)}:${Math.floor(m.location.longitude / cellDeg)}`;
    const list = buckets.get(key) ?? [];
    list.push(m);
    buckets.set(key, list);
  }

  const clusters: GeoCluster[] = [];
  const singles: GeoMarker[] = [];

  for (const [key, group] of buckets) {
    if (group.length < 2) {
      singles.push(...group);
      continue;
    }
    const centerLat = group.reduce((s, m) => s + m.location.latitude, 0) / group.length;
    const centerLng = group.reduce((s, m) => s + m.location.longitude, 0) / group.length;
    const kinds = new Set(group.map((m) => m.kind));
    clusters.push({
      id: `cluster-${key}`,
      count: group.length,
      centerLat,
      centerLng,
      markers: group,
      label: `${group.length} lieu${group.length > 1 ? 'x' : ''} · ${[...kinds].join(', ')}`,
    });
  }

  return { clusters, singles };
}
