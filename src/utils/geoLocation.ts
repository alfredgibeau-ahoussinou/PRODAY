import { Linking, Platform } from 'react-native';
import type { GeoPoint } from '../models/User';
import { distanceKm } from './geofencing';

export async function requestForegroundLocationPermission(): Promise<boolean> {
  const Location = await import('expo-location');
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function captureCurrentLocation(): Promise<GeoPoint> {
  const granted = await requestForegroundLocationPermission();
  if (!granted) {
    throw new Error('Autorisez la localisation pour partager votre position.');
  }

  const Location = await import('expo-location');
  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}

export type TripLocationWatchHandle = {
  remove: () => void;
};

export type TripLocationSample = GeoPoint & {
  heading?: number;
  accuracy_m?: number;
};

/**
 * Suit la position en avant-plan pendant un trajet actif.
 * (Pas de background TaskManager — limites iOS / pas de dépendance expo-task-manager.)
 */
export async function watchTripLocation(
  onUpdate: (sample: TripLocationSample) => void,
  onError?: (message: string) => void,
): Promise<TripLocationWatchHandle> {
  const granted = await requestForegroundLocationPermission();
  if (!granted) {
    throw new Error('Autorisez la localisation pour partager votre position pendant le trajet.');
  }

  const Location = await import('expo-location');
  const sub = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 8_000,
      distanceInterval: 25,
    },
    (position) => {
      onUpdate({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        heading:
          typeof position.coords.heading === 'number' && position.coords.heading >= 0
            ? position.coords.heading
            : undefined,
        accuracy_m:
          typeof position.coords.accuracy === 'number' ? position.coords.accuracy : undefined,
      });
    },
  );

  return {
    remove: () => {
      try {
        sub.remove();
      } catch {
        onError?.('Arrêt du suivi GPS impossible.');
      }
    },
  };
}

export function formatCoordinates(loc: GeoPoint): string {
  return `${loc.latitude.toFixed(5)}°, ${loc.longitude.toFixed(5)}°`;
}

export function formatDistanceKm(km: number): string {
  if (km < 0.1) return '< 100 m';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function distanceBetween(a?: GeoPoint, b?: GeoPoint): number | null {
  if (!a || !b) return null;
  return distanceKm(a, b);
}

export function openMapsAt(loc: GeoPoint, label?: string): void {
  const coords = `${loc.latitude},${loc.longitude}`;
  const query = label?.trim() ? encodeURIComponent(label.trim()) : coords;
  const url =
    Platform.OS === 'ios'
      ? `maps:0,0?q=${query}@${coords}`
      : Platform.OS === 'android'
        ? `geo:${coords}?q=${coords}(${query})`
        : `https://www.google.com/maps/search/?api=1&query=${coords}`;

  void Linking.openURL(url).catch(() => {
    void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${coords}`);
  });
}
