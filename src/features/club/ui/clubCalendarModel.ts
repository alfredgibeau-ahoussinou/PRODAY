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

export type ClubCalendarRange = 'day' | 'week' | 'month';

export type ClubCalendarNavTarget = 'matches' | 'trainings' | 'events';

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
    range === 'day' ? 'Aujourd’hui' : range === 'week' ? 'Cette semaine' : 'Ce mois';
  if (count <= 0) return `${rangeLabel} · rien de planifié`;
  return `${rangeLabel} · ${count} événement${count > 1 ? 's' : ''}`;
}
