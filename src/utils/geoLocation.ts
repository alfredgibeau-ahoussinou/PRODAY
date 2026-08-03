import { Linking, Platform } from 'react-native';
import * as ExpoLocation from 'expo-location';
import type { GeoPoint } from '../models/User';
import { distanceKm } from './geofencing';

const LOCATION_UNAVAILABLE =
  "La géolocalisation n'est pas disponible sur cet appareil ou dans cet environnement.";
const LOCATION_DENIED = 'Autorisez la localisation pour partager votre position.';
const LOCATION_DENIED_TRIP =
  'Autorisez la localisation pour partager votre position pendant le trajet.';
const LOCATION_FAILED = 'Impossible de récupérer votre position. Réessayez dans un moment.';

type LocationApi = typeof ExpoLocation;

/**
 * Metro can surface expo-location named exports on the namespace or under `.default`
 * depending on interop. Resolve once and fail with a user-facing message if the
 * permission API is missing (web/Expo Go limits, incomplete native module).
 */
function getLocationApi(): LocationApi {
  const mod = ExpoLocation as LocationApi & { default?: LocationApi };
  if (typeof mod.requestForegroundPermissionsAsync === 'function') {
    return mod;
  }
  if (mod.default && typeof mod.default.requestForegroundPermissionsAsync === 'function') {
    return mod.default;
  }
  throw new Error(LOCATION_UNAVAILABLE);
}

function toFriendlyLocationError(error: unknown, fallback: string): Error {
  if (error instanceof Error) {
    if (
      error.message === LOCATION_UNAVAILABLE ||
      error.message === LOCATION_DENIED ||
      error.message === LOCATION_DENIED_TRIP ||
      error.message === LOCATION_FAILED
    ) {
      return error;
    }
    // Native / Hermes: "X is not a function (it is undefined)"
    if (
      /is not a function/i.test(error.message) ||
      /UnavailabilityError/i.test(error.name) ||
      /not available/i.test(error.message)
    ) {
      return new Error(LOCATION_UNAVAILABLE);
    }
  }
  return new Error(fallback);
}

export async function requestForegroundLocationPermission(): Promise<boolean> {
  try {
    const Location = getLocationApi();
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    throw toFriendlyLocationError(error, LOCATION_UNAVAILABLE);
  }
}

export async function captureCurrentLocation(): Promise<GeoPoint> {
  try {
    const granted = await requestForegroundLocationPermission();
    if (!granted) {
      throw new Error(LOCATION_DENIED);
    }

    const Location = getLocationApi();
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch (error) {
    throw toFriendlyLocationError(error, LOCATION_FAILED);
  }
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
  try {
    const granted = await requestForegroundLocationPermission();
    if (!granted) {
      throw new Error(LOCATION_DENIED_TRIP);
    }

    const Location = getLocationApi();
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
  } catch (error) {
    throw toFriendlyLocationError(error, LOCATION_DENIED_TRIP);
  }
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
