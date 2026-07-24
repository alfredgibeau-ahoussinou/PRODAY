/**
 * Tracking léger des ouvertures app (cold start).
 * Écrit via Cloud Function — pas de faux chiffres côté client.
 */

const DEFAULT_FUNCTION_URL =
  'https://europe-west1-proday-155b0.cloudfunctions.net/recordTrafficVisit';

let trackedThisLaunch = false;

export const trafficService = {
  /** Une fois par cold start / process JS. Fire-and-forget. */
  recordAppOpenOnce(): void {
    if (trackedThisLaunch) return;
    trackedThisLaunch = true;

    const url =
      (typeof process !== 'undefined' &&
        process.env?.EXPO_PUBLIC_TRAFFIC_VISIT_URL?.trim()) ||
      DEFAULT_FUNCTION_URL;

    void fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'app' }),
    }).catch(() => undefined);
  },
};
