/** Estimation trajet type Uber — vitesse urbaine moyenne. */
export const DEFAULT_URBAN_SPEED_KMH = 42;

export function estimateTravelMinutes(
  distanceKm: number | null,
  speedKmh = DEFAULT_URBAN_SPEED_KMH
): number | null {
  if (distanceKm == null || distanceKm <= 0) return null;
  return Math.max(1, Math.round((distanceKm / speedKmh) * 60));
}

export function formatTravelEta(minutes: number | null): string | null {
  if (minutes == null) return null;
  if (minutes < 60) return `~${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `~${hours} h ${mins} min` : `~${hours} h`;
}
