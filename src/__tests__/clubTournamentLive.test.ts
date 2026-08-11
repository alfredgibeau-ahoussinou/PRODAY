import { computePoolTable, planToLiveFixtures } from '../models/ClubTournamentEvent';
import { generateClubTournamentPlan } from '../utils/clubTournamentGenerator';

describe('clubTournament live standings', () => {
  it('recalcule le classement après scores', () => {
    const plan = generateClubTournamentPlan({
      name: 'T',
      category: 'U13',
      teamCount: 4,
      pitchCount: 1,
      matchDurationMin: 10,
      breakBetweenMin: 5,
      poolCount: 1,
      format: 'pools_only',
      startsAt: new Date('2026-09-01T09:00:00'),
      endsAt: new Date('2026-09-01T18:00:00'),
      teamNames: ['A', 'B', 'C', 'D'],
    });
    const fixtures = planToLiveFixtures(plan).map((f, i) =>
      i === 0
        ? { ...f, home_score: 2, away_score: 1, status: 'done' as const }
        : f,
    );
    const table = computePoolTable(fixtures, plan.pools[0].id);
    expect(table[0].name).toBe(fixtures[0].homeName);
    expect(table[0].pts).toBe(3);
  });
});
