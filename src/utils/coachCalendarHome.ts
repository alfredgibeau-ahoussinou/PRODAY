import type { TeamEvent } from '../models/TeamEvent';
import { countRsvpYes } from '../models/TeamEvent';
import { isInMatchWindow } from './matchLive';

export type CoachCalendarEventSummary = {
  invited: number;
  confirmed: number;
};

/** Résumé convocations pour une carte calendrier coach. */
export function coachCalendarEventSummary(event: TeamEvent): CoachCalendarEventSummary {
  return {
    invited: event.invitee_uids.length,
    confirmed: countRsvpYes(event),
  };
}

export type CoachCalendarDateStack = {
  weekday: string;
  day: string;
  month: string;
  time: string;
};

function capFirst(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/** Initiales type SportEasy : « Fc champ » → FC, « Anna N. » → AN. */
export function coachCalendarInitials(name: string, fallback = 'EQ'): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .map((p) => p.replace(/[^A-Za-zÀ-ÿ0-9]/g, ''))
    .filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
}

export function formatCoachCalendarDateStack(
  date: Date,
  locale = 'fr-FR',
): CoachCalendarDateStack {
  const weekday = capFirst(
    date.toLocaleDateString(locale, { weekday: 'short' }).replace(/\./g, ''),
  );
  const month = date
    .toLocaleDateString(locale, { month: 'short' })
    .replace(/\./g, '')
    .toLowerCase();
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  return {
    weekday,
    day: String(date.getDate()),
    month,
    time,
  };
}

export function coachEventPlaceLabel(event: Pick<TeamEvent, 'location_label' | 'city'>): string {
  const label = event.location_label?.trim();
  if (label) return label;
  const city = event.city?.trim();
  if (city) return city;
  return 'Lieu inconnu';
}

/** Prochains événements + matchs live, tri chrono, quelques cartes max. */
export function listCoachCalendarUpcoming(
  events: TeamEvent[],
  now = Date.now(),
  limit = 8,
): TeamEvent[] {
  return [...events]
    .filter((event) => isInMatchWindow(event) || event.starts_at.getTime() >= now)
    .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime())
    .slice(0, limit);
}

export const COACH_CALENDAR_TIPS = [
  { id: 'create', kicker: 'GUIDE', title: 'La création d’événement' },
  { id: 'rsvp', kicker: 'ASTUCE', title: 'Pointez l’effectif depuis Pointage' },
] as const;
