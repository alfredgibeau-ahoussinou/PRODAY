import { Linking, Platform } from 'react-native';
import type { GeoPoint } from '../models/User';
import { distanceKm } from './geofencing';

export async function captureCurrentLocation(): Promise<GeoPoint> {
  const Location = await import('expo-location');
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Autorisez la localisation pour partager votre position.');
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
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
