import type { WearableHealthMetrics, WearableRecoverySuggestion } from './types';
import type { HealthSnapshot } from '../../core/types/health';

export function buildRecoverySuggestions(
  metrics: WearableHealthMetrics | null | undefined,
  health: HealthSnapshot,
): WearableRecoverySuggestion[] {
  if (!metrics) return [];
  const out: WearableRecoverySuggestion[] = [];

  if (
    (metrics.sleepHoursLastNight != null && metrics.sleepHoursLastNight < 6) ||
    health.recoveryScore < 45
  ) {
    out.push({
      id: 'light-session',
      title: 'Récupération faible',
      body: 'Allégez la séance du jour : échauffement, mobilité et pas d’intensité maximale.',
      priority: 'high',
    });
  }

  if (metrics.hrvMs != null && metrics.hrvMs < 35) {
    out.push({
      id: 'hrv-low',
      title: 'Variabilité cardiaque basse',
      body: 'Privilégiez le sommeil et une charge réduite dans les 24 h.',
      priority: 'high',
    });
  }

  if (metrics.stepsToday != null && metrics.stepsToday > 12000) {
    out.push({
      id: 'high-load',
      title: 'Charge élevée',
      body: 'Beaucoup de pas aujourd’hui. Évitez un double entraînement intense.',
      priority: 'medium',
    });
  }

  if (health.state === 'OPTIMAL' && (metrics.sleepHoursLastNight ?? 0) >= 7.5) {
    out.push({
      id: 'green-light',
      title: 'Bonne forme',
      body: 'Sommeil et récupération OK. Vous pouvez viser l’intensité prévue.',
      priority: 'low',
    });
  }

  return out;
}
