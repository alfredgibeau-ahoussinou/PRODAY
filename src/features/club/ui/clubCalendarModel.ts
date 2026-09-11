/**
 * Helpers purs Calendrier Club — plages, hero, lignes agenda (testables).
 */
import {
  isCoachMatchEvent,
  isCoachTrainingEvent,
  type TeamEvent,
} from '../../../models/TeamEvent';
import type { ClubEventKind } from '../theme/clubDesignSystem';
import { formatMatchClock, formatMatchDay } from './clubMatchesModel';

export type ClubCalendarRange = 'day' | 'week' | 'month' | 'all';

export type ClubCalendarNavTarget = 'matches' | 'trainings' | 'events';

export type ClubCalendarDayCell = {
  date: Date;
  dayNumber: number;
  dayName: string;
  isToday: boolean;
  isSelected: boolean;
  eventCount: number;
  hasMatch: boolean;
  hasTraining: boolean;
};

export type ClubCalendarItemModel = {
  id: string;
  title: string;
  kind: ClubEventKind;
  kindLabel: string;
  clockLabel: string;
  dayLabel: string;
  whenLabel: string;
  teamId?: string;
  nav: ClubCalendarNavTarget;
  isMatch: boolean;
  isTraining: boolean;
};

function asDate(value: Date | string | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function startOfClubWeek(d: Date): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function isClubCalendarInRange(
  date: Date,
  range: ClubCalendarRange,
  now: Date,
): boolean {
  if (range === 'all') return true;
  const t = date.getTime();
  if (range === 'day') {
    const a = new Date(now);
    a.setHours(0, 0, 0, 0);
    const b = new Date(now);
    b.setHours(23, 59, 59, 999);
    return t >= a.getTime() && t <= b.getTime();
  }
  if (range === 'week') {
    const a = startOfClubWeek(now);
    const b = new Date(a);
    b.setDate(b.getDate() + 7);
    return t >= a.getTime() && t < b.getTime();
  }
  const a = new Date(now.getFullYear(), now.getMonth(), 1);
  const b = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return t >= a.getTime() && t < b.getTime();
}

export function formatClubCalendarPeriodHeader(range: ClubCalendarRange, anchor: Date): string {
  if (range === 'all') return 'Tous les événements';
  if (range === 'day') {
    return anchor.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
  if (range === 'month') {
    const str = anchor.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  // range === 'week'
  const start = startOfClubWeek(anchor);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const startStr = start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  const endStr = end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  return `Semaine du ${startStr} au ${endStr}`;
}

export function navigateClubCalendarDate(
  current: Date,
  range: ClubCalendarRange,
  direction: 'prev' | 'next',
): Date {
  const next = new Date(current);
  const factor = direction === 'next' ? 1 : -1;
  if (range === 'day') {
    next.setDate(next.getDate() + factor);
  } else if (range === 'week') {
    next.setDate(next.getDate() + factor * 7);
  } else if (range === 'month') {
    next.setMonth(next.getMonth() + factor);
  }
  return next;
}

export function buildClubCalendarWeekDays(
  anchor: Date,
  events: TeamEvent[],
  selectedDate?: Date,
): ClubCalendarDayCell[] {
  const start = startOfClubWeek(anchor);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days: ClubCalendarDayCell[] = [];
  const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);

    const nextD = new Date(d);
    nextD.setDate(nextD.getDate() + 1);

    const dayEvents = events.filter((e) => {
      const st = asDate(e.starts_at);
      return st && st.getTime() >= d.getTime() && st.getTime() < nextD.getTime();
    });

    const isToday = d.getTime() === today.getTime();
    const isSelected = selectedDate
      ? d.getTime() === new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()).getTime()
      : isToday;

    days.push({
      date: d,
      dayNumber: d.getDate(),
      dayName: DAY_NAMES[i],
      isToday,
      isSelected,
      eventCount: dayEvents.length,
      hasMatch: dayEvents.some((e) => isCoachMatchEvent(e)),
      hasTraining: dayEvents.some((e) => isCoachTrainingEvent(e)),
    });
  }

  return days;
}

export function resolveClubCalendarEventKind(event: TeamEvent): ClubEventKind {
  if (isCoachMatchEvent(event)) return 'match';
  if (isCoachTrainingEvent(event)) return 'training';
  const t = `${event.title ?? ''} ${event.event_type ?? ''}`.toLowerCase();
  if (t.includes('tournoi') || t.includes('tournament') || event.event_type === 'tournament') {
    return 'tournament';
  }
  if (
    t.includes('réunion') ||
    t.includes('reunion') ||
    t.includes('meeting') ||
    event.event_type === 'meeting'
  ) {
    return 'meeting';
  }
  return 'event';
}

export function clubCalendarKindLabel(kind: ClubEventKind): string {
  if (kind === 'match') return 'Match';
  if (kind === 'training') return 'Entraînement';
  if (kind === 'tournament') return 'Tournoi';
  if (kind === 'meeting') return 'Réunion';
  return 'Événement';
}

export function resolveClubCalendarNav(event: TeamEvent): ClubCalendarNavTarget {
  if (isCoachMatchEvent(event)) return 'matches';
  if (isCoachTrainingEvent(event)) return 'trainings';
  return 'events';
}

export function filterClubCalendarEvents(
  events: TeamEvent[],
  range: ClubCalendarRange,
  now = new Date(),
): TeamEvent[] {
  return events
    .filter((e) => {
      const start = asDate(e.starts_at);
      return start != null && isClubCalendarInRange(start, range, now);
    })
    .slice()
    .sort((a, b) => {
      const at = asDate(a.starts_at)?.getTime() ?? 0;
      const bt = asDate(b.starts_at)?.getTime() ?? 0;
      return at - bt;
    });
}

export function resolveClubCalendarHero(
  items: TeamEvent[],
  now = new Date(),
): TeamEvent | null {
  if (items.length === 0) return null;
  const upcoming = items.find((e) => {
    const start = asDate(e.starts_at);
    return start != null && start.getTime() >= now.getTime() - 30 * 60 * 1000;
  });
  return upcoming ?? items[0] ?? null;
}

export function buildClubCalendarItemModel(event: TeamEvent): ClubCalendarItemModel {
  const kind = resolveClubCalendarEventKind(event);
  const starts = asDate(event.starts_at);
  const clockLabel = starts ? formatMatchClock(starts) : 'Horaire à confirmer';
  const dayLabel = starts ? formatMatchDay(starts) : 'Date à confirmer';
  return {
    id: event.id,
    title: event.title?.trim() || clubCalendarKindLabel(kind),
    kind,
    kindLabel: clubCalendarKindLabel(kind),
    clockLabel,
    dayLabel,
    whenLabel: `${dayLabel} · ${clockLabel}`,
    teamId: event.team_id?.trim() || undefined,
    nav: resolveClubCalendarNav(event),
    isMatch: isCoachMatchEvent(event),
    isTraining: isCoachTrainingEvent(event),
  };
}

export function resolveClubCalendarSubtitle(
  range: ClubCalendarRange,
  count: number,
): string {
  const rangeLabel =
    range === 'day'
      ? 'Aujourd’hui'
      : range === 'week'
        ? 'Cette semaine'
        : range === 'month'
          ? 'Ce mois'
          : 'Saison';
  if (count <= 0) return `${rangeLabel} · rien de planifié`;
  return `${rangeLabel} · ${count} événement${count > 1 ? 's' : ''}`;
}
