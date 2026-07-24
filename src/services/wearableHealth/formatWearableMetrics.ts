import type { WearableHealthMetrics, WearablePlatformLabel } from './types';

export function hasWearableData(metrics: WearableHealthMetrics | null | undefined): boolean {
  if (!metrics) return false;
  return (
    metrics.stepsToday != null ||
    metrics.sleepHoursLastNight != null ||
    metrics.restingHeartRate != null ||
    metrics.exerciseHeartRateAvg != null ||
    metrics.activeCaloriesToday != null ||
    metrics.distanceKmToday != null ||
    metrics.workoutDurationMin != null ||
    metrics.hrvMs != null
  );
}

export function formatStepsValue(steps: number | null | undefined): string {
  if (steps == null) return 'Non dispo.';
  return steps.toLocaleString('fr-FR');
}

export function formatSleepValue(hours: number | null | undefined): string {
  if (hours == null) return 'Non dispo.';
  return `${hours} h`;
}

export function formatHeartRateValue(bpm: number | null | undefined): string {
  if (bpm == null) return 'Non dispo.';
  return `${bpm} bpm`;
}

export function formatWearableSyncedAt(syncedAt: string | undefined): string {
  if (!syncedAt) return '…';
  return new Date(syncedAt).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function wearableSourceLabel(
  source: WearableHealthMetrics['source'],
  platformLabel: WearablePlatformLabel
): string {
  return source === 'apple_health' ? 'Apple Santé' : source === 'google_health' ? 'Google Health' : platformLabel;
}

export function wearableDataDisclaimer(
  metrics: WearableHealthMetrics,
  platformLabel: WearablePlatformLabel
): string | null {
  const label = wearableSourceLabel(metrics.source, platformLabel);
  if (!hasWearableData(metrics)) {
    return `${label} est connecté, mais aucune donnée n’a été lue. Vérifiez les autorisations dans les réglages de votre téléphone.`;
  }
  const missing: string[] = [];
  if (metrics.stepsToday == null) missing.push('pas');
  if (metrics.sleepHoursLastNight == null) missing.push('sommeil');
  if (metrics.restingHeartRate == null) missing.push('FC repos');
  if (missing.length === 0) return null;
  return `Certaines données (${missing.join(', ')}) ne sont pas encore disponibles dans ${label}.`;
}
