import type { FriendlyMatch } from '../models/FriendlyMatch';
import type { SeasonCalendarItem } from './seasonCalendar';
import type { CalendarKindFilter, AmicauxStatusFilter } from '../content/matchChapters';

export function filterCalendarItems(
  items: SeasonCalendarItem[],
  opts: { search?: string; kind?: CalendarKindFilter; upcomingOnly?: boolean }
): SeasonCalendarItem[] {
  const q = opts.search?.trim().toLowerCase() ?? '';
  const now = Date.now();

  return items.filter((item) => {
    if (opts.upcomingOnly !== false && item.starts_at.getTime() < now) return false;
    if (opts.kind && opts.kind !== 'all' && item.kind !== opts.kind) return false;
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.city.toLowerCase().includes(q)
    );
  });
}

export function filterFriendlyMatches(
  matches: FriendlyMatch[],
  opts: { status?: AmicauxStatusFilter; search?: string; myClubId?: string | null }
): FriendlyMatch[] {
  const q = opts.search?.trim().toLowerCase() ?? '';

  return matches.filter((m) => {
    if (opts.status === 'open' && m.status !== 'OPEN' && m.status !== 'INVITED' && m.status !== 'COUNTERED') {
      return false;
    }
    if (opts.status === 'confirmed' && m.status !== 'ACCEPTED') return false;
    if (opts.status === 'mine' && opts.myClubId) {
      const mine =
        m.requester_club_id === opts.myClubId || m.opponent_club_id === opts.myClubId;
      if (!mine) return false;
    }
    if (!q) return true;
    const hay = [
      m.requester_club_name,
      m.opponent_club_name,
      m.city,
      m.level,
      m.category,
      m.message,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });
}

export function countWeekEvents(
  items: SeasonCalendarItem[],
  fromDate = new Date()
): { date: Date; count: number; isToday: boolean }[] {
  const start = new Date(fromDate);
  start.setHours(0, 0, 0, 0);
  const days: { date: Date; count: number; isToday: boolean }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    const count = items.filter(
      (item) => item.starts_at >= d && item.starts_at < next
    ).length;
    days.push({
      date: d,
      count,
      isToday: d.getTime() === today.getTime(),
    });
  }
  return days;
}
