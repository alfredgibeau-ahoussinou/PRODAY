import type { SeasonCalendarItem } from '../../utils/seasonCalendar';
import type { MainTabId } from '../../navigation/mainTabConfig';

export type CalendarEntityKind = 'match' | 'training' | 'event' | 'goal';

export interface CalendarEntity {
  id: string;
  kind: CalendarEntityKind;
  title: string;
  subtitle: string;
  startsAt: Date;
  city: string;
  tab: MainTabId;
  sourceId: string;
  autoAdded: boolean;
}

/** Sync calendrier — match join + objectifs IA (spec §11). */
export function mergeCalendarEntities(params: {
  seasonItems: SeasonCalendarItem[];
  aiGoals: { id: string; title: string; reason: string; tab: MainTabId }[];
}): CalendarEntity[] {
  const fromSeason: CalendarEntity[] = params.seasonItems.map((item) => ({
    id: `cal-${item.id}`,
    kind: item.kind === 'friendly_match' ? 'match' : 'event',
    title: item.title,
    subtitle: item.subtitle,
    startsAt: item.starts_at,
    city: item.city,
    tab: 'matchs',
    sourceId: item.id,
    autoAdded: false,
  }));

  const fromAi: CalendarEntity[] = params.aiGoals.map((g, i) => {
    const startsAt = new Date();
    startsAt.setHours(18 + i, 0, 0, 0);
    return {
      id: `goal-${g.id}`,
      kind: 'goal',
      title: g.title,
      subtitle: g.reason,
      startsAt,
      city: '',
      tab: g.tab,
      sourceId: g.id,
      autoAdded: true,
    };
  });

  return [...fromSeason, ...fromAi]
    .filter((e) => e.startsAt.getTime() >= Date.now() - 3600000)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
    .slice(0, 20);
}

export function onMatchJoined(matchId: string, startsAt: Date, title: string, city: string): CalendarEntity {
  return {
    id: `joined-${matchId}`,
    kind: 'match',
    title,
    subtitle: 'Match rejoint',
    startsAt,
    city,
    tab: 'matchs',
    sourceId: matchId,
    autoAdded: true,
  };
}
