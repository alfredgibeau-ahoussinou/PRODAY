import type { PlayerActivity } from '../models/PlayerActivity';

export const PERFORMANCE_TAGS = [
  'passes',
  'shots',
  'dribbles',
  'defensive_actions',
] as const;

export type PerformanceTag = (typeof PERFORMANCE_TAGS)[number];

export function aggregatePerformanceTags(
  activities: PlayerActivity[],
  days = 30,
  now = new Date()
): Record<PerformanceTag, number> {
  const since = new Date(now);
  since.setDate(since.getDate() - days);

  const counts: Record<PerformanceTag, number> = {
    passes: 0,
    shots: 0,
    dribbles: 0,
    defensive_actions: 0,
  };

  for (const act of activities) {
    if (act.date < since) continue;
    for (const tag of act.performance_tags ?? []) {
      if (tag in counts) counts[tag as PerformanceTag] += 1;
    }
  }

  return counts;
}
