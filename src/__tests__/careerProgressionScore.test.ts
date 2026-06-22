import { computeCareerProgressionScore, computeWeeklyGoalPercent } from '../utils/careerProgressionScore';
import type { PlayerActivity } from '../models/PlayerActivity';

function activity(daysAgo: number, type: PlayerActivity['type'] = 'training'): PlayerActivity {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return {
    id: `a-${daysAgo}`,
    player_uid: 'p1',
    type,
    date,
    duration_min: 60,
    source: 'manual',
    created_at: date,
  };
}

describe('careerProgressionScore', () => {
  it('retourne 0 performance sans stats saison', () => {
    const result = computeCareerProgressionScore({
      activities: [],
      profileCompletionPercent: 50,
    });
    expect(result.facets.find((f) => f.id === 'performance')?.score).toBe(0);
  });

  it('intègre stats saison et activités récentes', () => {
    const result = computeCareerProgressionScore({
      seasonStats: { matches: 10, goals: 3, assists: 2 },
      activities: [activity(1), activity(3), activity(5)],
      profileCompletionPercent: 80,
      mercatoApplicationsCount: 2,
      streakDays: 7,
    });
    expect(result.total).toBeGreaterThan(40);
    expect(result.facets).toHaveLength(4);
  });

  it('calcule objectif hebdo sur cible 3 séances', () => {
    const now = new Date('2026-06-24T12:00:00'); // mercredi
    const weekActivities: PlayerActivity[] = [
      { ...activity(0), date: new Date('2026-06-22T10:00:00') },
      { ...activity(0), id: 'a2', date: new Date('2026-06-24T10:00:00') },
    ];
    const { percent, sessionCount } = computeWeeklyGoalPercent(weekActivities, now);
    expect(sessionCount).toBe(2);
    expect(percent).toBe(67);
  });
});
