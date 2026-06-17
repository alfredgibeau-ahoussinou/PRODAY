import { useCallback, useEffect, useState } from 'react';
import type { GeoPoint, User } from '../models/User';
import { captureCurrentLocation } from '../utils/geoLocation';

/** Position utilisateur — partagé accueil / matchs. */
export function useGeoLocation(profile: User | null | undefined) {
  const [userLocation, setUserLocation] = useState<GeoPoint | undefined>(profile?.location);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  useEffect(() => {
    setUserLocation((prev) => prev ?? profile?.location);
  }, [profile?.location]);

  const refreshLocation = useCallback(async () => {
    setLocating(true);
    setLocError(null);
    try {
      const coords = await captureCurrentLocation();
      setUserLocation(coords);
    } catch (error) {
      setLocError(
        error instanceof Error ? error.message : 'Impossible de récupérer votre position.'
      );
    } finally {
      setLocating(false);
    }
  }, []);

  useEffect(() => {
    if (!userLocation) {
      void refreshLocation();
    }
  }, [userLocation, refreshLocation]);

  return { userLocation, refreshLocation, locating, locError };
}
