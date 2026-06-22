import { aggregatePerformanceTags } from '../utils/performanceTags';
import type { PlayerActivity } from '../models/PlayerActivity';

function act(daysAgo: number, tags?: PlayerActivity['performance_tags']): PlayerActivity {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return {
    id: `a-${daysAgo}`,
    player_uid: 'p1',
    type: 'match',
    date,
    duration_min: 90,
    performance_tags: tags,
    source: 'manual',
    created_at: date,
  };
}

describe('aggregatePerformanceTags', () => {
  it('agrège les tags sur 30 jours', () => {
    const now = new Date('2026-06-24T12:00:00');
    const activities = [
      act(2, ['passes', 'shots']),
      act(5, ['passes']),
      act(40, ['shots']),
    ];
    const counts = aggregatePerformanceTags(activities, 30, now);
    expect(counts.passes).toBe(2);
    expect(counts.shots).toBe(1);
    expect(counts.dribbles).toBe(0);
  });
});
