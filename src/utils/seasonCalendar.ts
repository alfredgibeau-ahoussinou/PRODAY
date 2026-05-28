import type { FriendlyMatch } from '../models/FriendlyMatch';
import type { Tournament } from '../models/Tournament';
import type { TeamEvent, TeamEventType } from '../models/TeamEvent';
import { EVENT_TYPE_LABELS } from '../models/TeamEvent';
import { formatMatchTeams } from './matchDisplay';

export type CalendarItemKind =
  | 'team_event'
  | 'friendly_match'
  | 'tournament';

export interface SeasonCalendarItem {
  id: string;
  kind: CalendarItemKind;
  title: string;
  subtitle: string;
  starts_at: Date;
  city: string;
  event_type?: TeamEventType;
  team_event_id?: string;
  friendly_match_id?: string;
  tournament_id?: string;
}

export function teamEventsToCalendarItems(events: TeamEvent[]): SeasonCalendarItem[] {
  return events.map((e) => ({
    id: `event-${e.id}`,
    kind: 'team_event',
    title: e.title,
    subtitle: `${EVENT_TYPE_LABELS[e.event_type]} · ${e.organizer_name}`,
    starts_at: e.starts_at,
    city: e.city,
    event_type: e.event_type,
    team_event_id: e.id,
  }));
}

export function friendlyMatchesToCalendarItems(
  matches: FriendlyMatch[]
): SeasonCalendarItem[] {
  return matches.map((m) => ({
    id: `match-${m.id}`,
    kind: 'friendly_match',
    title: formatMatchTeams(m),
    subtitle: `Match amical · ${m.level_type}`,
    starts_at: m.date,
    city: m.city,
    friendly_match_id: m.id,
  }));
}

export function tournamentsToCalendarItems(
  tournaments: Tournament[]
): SeasonCalendarItem[] {
  return tournaments.map((t) => ({
    id: `tournament-${t.id}`,
    kind: 'tournament',
    title: t.name,
    subtitle: `Tournoi · ${t.categories.join(', ') || 'Arena'}`,
    starts_at: t.date_start,
    city: t.city,
    tournament_id: t.id,
  }));
}

export function mergeSeasonCalendar(
  events: TeamEvent[],
  matches: FriendlyMatch[],
  tournaments: Tournament[]
): SeasonCalendarItem[] {
  return [
    ...teamEventsToCalendarItems(events),
    ...friendlyMatchesToCalendarItems(matches),
    ...tournamentsToCalendarItems(tournaments),
  ].sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
}

export function groupByMonth(
  items: SeasonCalendarItem[]
): { key: string; label: string; items: SeasonCalendarItem[] }[] {
  const map = new Map<string, SeasonCalendarItem[]>();
  for (const item of items) {
    const d = item.starts_at;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return [...map.entries()].map(([key, group]) => {
    const [y, m] = key.split('-');
    const label = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric',
    });
    return { key, label: label.charAt(0).toUpperCase() + label.slice(1), items: group };
  });
}

export function formatCalendarDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
