import type { WearableHealthMetrics } from './types';

/**
 * Health Connect retiré du binary Android (crash cold start New Arch).
 * Réactiver via autolinking + plugin une fois le démarrage stable.
 */
export async function connectWearableHealth(): Promise<WearableHealthMetrics> {
  throw new Error(
    'Google Health Connect est temporairement désactivé sur cette version Android.',
  );
}

export async function fetchWearableMetrics(): Promise<WearableHealthMetrics> {
  throw new Error(
    'Google Health Connect est temporairement désactivé sur cette version Android.',
  );
}
