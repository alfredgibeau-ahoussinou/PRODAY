import type { OrganizerEvent, EventResults } from '../models/EventOrganizer';
import { EVENT_KIND_LABELS } from '../models/EventOrganizer';
import { formatCalendarDate } from './seasonCalendar';

export function buildOrganizerEventShareMessage(event: OrganizerEvent): string {
  const kind = EVENT_KIND_LABELS[event.kind] ?? 'Événement';
  const lines = [
    `ProDay Événements · ${kind}`,
    event.title,
    formatCalendarDate(event.starts_at),
  ];
  if (event.city) {
    lines.push(event.city + (event.venue ? ` · ${event.venue}` : ''));
  }
  if (event.registration_price_cents != null && event.registration_price_cents > 0) {
    lines.push(`Inscription : ${(event.registration_price_cents / 100).toFixed(2)} €`);
  } else {
    lines.push('Inscription gratuite');
  }
  if (event.media_urls?.length) {
    lines.push('', 'Médias :');
    for (const url of event.media_urls.slice(0, 5)) {
      lines.push(url);
    }
  }
  lines.push('', 'Inscrivez-vous depuis l’app ProDay → Pôle Événements.');
  return lines.join('\n');
}

export function buildEventResultsShareMessage(
  event: Pick<OrganizerEvent, 'title' | 'kind'>,
  results: EventResults,
): string {
  const kind = EVENT_KIND_LABELS[event.kind] ?? 'Événement';
  const lines = [`Résultats · ${kind}`, event.title, ''];
  if (!results.entries.length) {
    lines.push('Classement à venir.');
  } else {
    for (const entry of results.entries.slice(0, 20)) {
      const score = entry.score ? ` — ${entry.score}` : '';
      lines.push(`${entry.rank}. ${entry.label}${score}`);
    }
  }
  lines.push('', 'ProDay Événements');
  return lines.join('\n');
}
