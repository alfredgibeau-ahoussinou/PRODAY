import type { TeamEvent } from '../models/TeamEvent';
import { formatCalendarDate } from './seasonCalendar';
import { getPendingInviteeUids } from '../models/TeamEvent';

export function buildConvocationShareMessage(event: TeamEvent): string {
  const pending = getPendingInviteeUids(event).length;
  const lines = [
    'Convocation ProDay',
    event.title,
    formatCalendarDate(event.starts_at),
    event.city + (event.location_label ? ` · ${event.location_label}` : ''),
  ];
  if (pending > 0) {
    lines.push(`${pending} réponse(s) en attente.`);
  }
  lines.push('', 'Répondez depuis l’app ProDay → Convocations.');
  return lines.join('\n');
}
