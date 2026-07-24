import type { HealthSnapshot } from '../core/types/health';
import type { WearableDailySnapshot, WearableHealthMetrics } from '../services/wearableHealth/types';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmt(value: number | null | undefined, suffix = ''): string {
  if (value == null) return '…';
  return `${value}${suffix}`;
}

export function buildHealthReportHtml(
  displayName: string,
  health: HealthSnapshot,
  wearable: WearableHealthMetrics | null,
  history: WearableDailySnapshot[],
): string {
  const generated = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const historyRows = history
    .map(
      (d) =>
        `<tr><td>${escapeHtml(d.date)}</td><td>${fmt(d.steps)}</td><td>${fmt(d.sleepHours, ' h')}</td><td>${fmt(d.restingHr, ' bpm')}</td></tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Rapport santé. ${escapeHtml(displayName)} | ProDay</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; color: #0f172a; padding: 32px; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .muted { color: #64748b; font-size: 13px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 20px 0; }
    .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; }
    .label { font-size: 11px; text-transform: uppercase; color: #64748b; }
    .value { font-size: 20px; font-weight: 800; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
    th, td { border-bottom: 1px solid #e2e8f0; padding: 8px; text-align: left; }
    .note { margin-top: 24px; font-size: 12px; color: #64748b; line-height: 1.5; }
  </style>
</head>
<body>
  <h1>Rapport santé ProDay</h1>
  <p class="muted">${escapeHtml(displayName)} · généré le ${generated}</p>
  <p>État estimé : <strong>${escapeHtml(health.state)}</strong> · Fatigue ${health.fatigueScore} · Récup. ${health.recoveryScore}</p>
  <div class="grid">
    <div class="card"><div class="label">Pas</div><div class="value">${fmt(wearable?.stepsToday)}</div></div>
    <div class="card"><div class="label">Sommeil</div><div class="value">${fmt(wearable?.sleepHoursLastNight, ' h')}</div></div>
    <div class="card"><div class="label">FC repos</div><div class="value">${fmt(wearable?.restingHeartRate, ' bpm')}</div></div>
    <div class="card"><div class="label">FC effort</div><div class="value">${fmt(wearable?.exerciseHeartRateAvg, ' bpm')}</div></div>
    <div class="card"><div class="label">Calories</div><div class="value">${fmt(wearable?.activeCaloriesToday, ' kcal')}</div></div>
    <div class="card"><div class="label">Distance</div><div class="value">${fmt(wearable?.distanceKmToday, ' km')}</div></div>
  </div>
  <h2>Historique récent</h2>
  <table>
    <thead><tr><th>Date</th><th>Pas</th><th>Sommeil</th><th>FC repos</th></tr></thead>
    <tbody>${historyRows || '<tr><td colspan="4">Pas encore d’historique.</td></tr>'}</tbody>
  </table>
  <p class="note">Document informatif. Ne remplace pas un avis médical. Partagez uniquement avec votre consentement.</p>
</body>
</html>`;
}
