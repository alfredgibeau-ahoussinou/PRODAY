import type { CalendarEntity } from '../../../core/calendar/calendarSync.engine';
import type { SeasonCalendarItem } from '../../../utils/seasonCalendar';
import type { SmartCalendarEntry } from '../models/calendar';
import type { SmartAction } from '../models/intelligence';

function mapSeasonItem(item: SeasonCalendarItem): SmartCalendarEntry {
  return {
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    startsAt: item.starts_at,
    source: item.kind === 'friendly_match' ? 'match' : 'training',
    city: item.city,
    tab: 'matchs',
    priority: item.kind === 'friendly_match' ? 80 : 70,
  };
}

export function buildSmartCalendar(params: {
  seasonItems: SeasonCalendarItem[];
  actions: SmartAction[];
  now?: Date;
}): SmartCalendarEntry[] {
  const now = params.now ?? new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const fromSeason = params.seasonItems
    .filter((i) => i.starts_at.getTime() >= now.getTime() && i.starts_at.getTime() <= endOfDay.getTime() + 7 * 86400000)
    .map(mapSeasonItem);

  const goalEntries: SmartCalendarEntry[] = params.actions.slice(0, 2).map((action, index) => {
    const startsAt = new Date(now);
    startsAt.setHours(18 + index, 0, 0, 0);
    return {
      id: `goal-${action.id}`,
      title: action.title,
      subtitle: action.reason,
      startsAt,
      source: 'goal',
      city: '',
      tab: action.tab ?? 'home',
      priority: action.priority,
    };
  });

  return [...fromSeason, ...goalEntries]
    .sort((a, b) => {
      if (a.startsAt.getTime() !== b.startsAt.getTime()) {
        return a.startsAt.getTime() - b.startsAt.getTime();
      }
      return b.priority - a.priority;
    })
    .slice(0, 12);
}

export function todayEntries(entries: SmartCalendarEntry[], now = new Date()): SmartCalendarEntry[] {
  const day = now.toDateString();
  return entries.filter((e) => e.startsAt.toDateString() === day);
}

export function entriesFromCalendarEntities(entities: CalendarEntity[]): SmartCalendarEntry[] {
  return entities.map((entity) => ({
    id: entity.id,
    title: entity.title,
    subtitle: entity.subtitle,
    startsAt: entity.startsAt,
    source:
      entity.kind === 'match'
        ? 'match'
        : entity.kind === 'goal'
          ? 'goal'
          : entity.kind === 'training'
            ? 'training'
            : 'event',
    city: entity.city,
    tab: entity.tab,
    priority: entity.kind === 'match' ? 80 : entity.kind === 'goal' ? 65 : 70,
  }));
}

export function peekCalendar(entities: CalendarEntity[], now = new Date()) {
  const entries = entriesFromCalendarEntities(entities);
  return {
    today: todayEntries(entries, now),
    upcoming: entries.filter((entry) => entry.startsAt.getTime() > now.getTime()).slice(0, 5),
  };
}
