import type { TeamEvent } from '../models/TeamEvent';
import { EVENT_TYPE_LABELS, LIVE_ACTION_LABELS } from '../models/TeamEvent';
import { formatCalendarDate } from './seasonCalendar';

const BRAND = '#0A0A0A';

export function buildMatchSheetHtml(event: TeamEvent): string {
  const starters = event.lineup?.slots.filter((s) => s.role === 'starter') ?? [];
  const subs = event.lineup?.slots.filter((s) => s.role === 'sub') ?? [];
  const timeline = [...(event.live_actions ?? [])].sort((a, b) => a.minute - b.minute);

  const starterRows = starters
    .map(
      (s) =>
        `<tr><td>${escapeHtml(s.display_name)}</td><td>${escapeHtml(s.position_label ?? '—')}</td></tr>`
    )
    .join('');

  const subRows = subs
    .map((s) => `<tr><td>${escapeHtml(s.display_name)}</td><td>Remplaçant</td></tr>`)
    .join('');

  const liveRows = timeline
    .map(
      (a) =>
        `<tr><td>${a.minute}'</td><td>${escapeHtml(LIVE_ACTION_LABELS[a.type] ?? a.type)}</td><td>${escapeHtml(a.player_name)}</td></tr>`
    )
    .join('');
  const sheetStats = Object.values(event.player_match_stats ?? {});
  const statRows = sheetStats
    .map(
      (s) =>
        `<tr><td>${escapeHtml(s.player_name)}</td><td>${s.minutes_played ?? '—'}</td><td>${s.rating ?? '—'}</td><td>${s.goals ?? 0}</td><td>${s.assists ?? 0}</td><td>${s.yellow_cards ?? 0}</td><td>${s.red_cards ?? 0}</td></tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Feuille de match — ${escapeHtml(event.title)}</title>
  <style>
    body { font-family: system-ui, sans-serif; color: #111; max-width: 720px; margin: 24px auto; }
    h1 { color: ${BRAND}; font-size: 22px; margin-bottom: 4px; }
    .meta { color: #555; font-size: 14px; margin-bottom: 20px; }
    h2 { font-size: 14px; color: ${BRAND}; border-bottom: 2px solid #e8eef8; padding-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0 24px; font-size: 13px; }
    th, td { border: 1px solid #dde3ed; padding: 8px 10px; text-align: left; }
    th { background: #e8eef8; color: ${BRAND}; }
    .foot { font-size: 11px; color: #888; margin-top: 32px; text-align: center; }
    @media print { body { margin: 12mm; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(event.title)}</h1>
  <p class="meta">
    ${EVENT_TYPE_LABELS[event.event_type]} · ${escapeHtml(formatCalendarDate(event.starts_at))}<br/>
    ${escapeHtml(event.city)}${event.location_label ? ` · ${escapeHtml(event.location_label)}` : ''}<br/>
    Organisateur : ${escapeHtml(event.organizer_name)}
    ${event.lineup ? `<br/>Système : <strong>${escapeHtml(event.lineup.formation)}</strong>` : ''}
  </p>

  ${
    event.lineup
      ? `<h2>Composition</h2>
  <table>
    <thead><tr><th>Joueur</th><th>Poste</th></tr></thead>
    <tbody>${starterRows || '<tr><td colspan="2">—</td></tr>'}</tbody>
  </table>
  ${subs.length ? `<h2>Remplaçants</h2><table><tbody>${subRows}</tbody></table>` : ''}`
      : '<p><em>Composition non renseignée.</em></p>'
  }

  ${
    timeline.length
      ? `<h2>Faits marquants</h2>
  <table>
    <thead><tr><th>Min</th><th>Action</th><th>Joueur</th></tr></thead>
    <tbody>${liveRows}</tbody>
  </table>`
      : ''
  }

  ${
    sheetStats.length
      ? `<h2>Feuille individuelle</h2>
  <table>
    <thead><tr><th>Joueur</th><th>Min</th><th>Note</th><th>Buts</th><th>Passes</th><th>Jaunes</th><th>Rouges</th></tr></thead>
    <tbody>${statRows}</tbody>
  </table>`
      : ''
  }

  <p class="foot">ProDay · Feuille générée le ${new Date().toLocaleDateString('fr-FR')}</p>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
