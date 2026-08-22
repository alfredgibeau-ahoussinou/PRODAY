import type { TeamEvent } from '../models/TeamEvent';
import {
  countRsvpYes,
  isCoachMatchEvent,
  isCoachTrainingEvent,
} from '../models/TeamEvent';
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

export type CoachDayPriority =
  | { kind: 'live'; event: TeamEvent }
  | { kind: 'match'; event: TeamEvent }
  | { kind: 'training'; event: TeamEvent }
  | { kind: 'calm' };

/** Priorité Accueil coach — live > prochain match/séance (chrono, match si égal). */
export function resolveCoachDayPriority(
  events: TeamEvent[],
  now = Date.now(),
): CoachDayPriority {
  const live = events.find((e) => isInMatchWindow(e));
  if (live) return { kind: 'live', event: live };

  const cutoff = now - 30 * 60 * 1000;
  const upcoming = events
    .filter((e) => e.starts_at.getTime() >= cutoff)
    .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());

  const nextMatch = upcoming.find(isCoachMatchEvent);
  const nextTraining = upcoming.find(isCoachTrainingEvent);

  if (nextMatch && nextTraining) {
    const mt = nextMatch.starts_at.getTime();
    const tt = nextTraining.starts_at.getTime();
    if (mt === tt) return { kind: 'match', event: nextMatch };
    return mt < tt
      ? { kind: 'match', event: nextMatch }
      : { kind: 'training', event: nextTraining };
  }
  if (nextMatch) return { kind: 'match', event: nextMatch };
  if (nextTraining) return { kind: 'training', event: nextTraining };

  const fallback = listCoachCalendarUpcoming(events, now, 1)[0];
  if (fallback) {
    return isCoachMatchEvent(fallback)
      ? { kind: 'match', event: fallback }
      : { kind: 'training', event: fallback };
  }
  return { kind: 'calm' };
}

export function coachDayPriorityKicker(kind: CoachDayPriority['kind']): string {
  if (kind === 'live') return 'En direct';
  if (kind === 'match') return 'Jour J · Match';
  if (kind === 'training') return 'Jour J · Séance';
  return 'Calme';
}

export function coachDayPrioritySubtitle(priority: CoachDayPriority): string {
  if (priority.kind === 'calm') {
    return 'Aucun match ni entraînement à venir — créez une convocation.';
  }
  const summary = coachCalendarEventSummary(priority.event);
  const place = coachEventPlaceLabel(priority.event);
  return `${summary.confirmed}/${summary.invited} confirmés · ${place}`;
}

/** Liste à venir sans dupliquer l’événement déjà en hero. */
export function listCoachCalendarRest(
  events: TeamEvent[],
  heroEventId: string | null,
  now = Date.now(),
  limit = 8,
): TeamEvent[] {
  return listCoachCalendarUpcoming(events, now, limit + 1)
    .filter((e) => e.id !== heroEventId)
    .slice(0, limit);
}

export const COACH_CALENDAR_TIPS = [
  { id: 'create', kicker: 'GUIDE', title: 'La création d’événement' },
  { id: 'rsvp', kicker: 'ASTUCE', title: 'Pointez l’effectif depuis Pointage' },
] as const;
