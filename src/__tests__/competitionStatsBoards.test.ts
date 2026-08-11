import { buildCompetitionLeaderboards, buildTeamSeasonAnalytics } from '../utils/competitionStatsBoards';
import type { PlayerCompetitionStats } from '../models/Competition';

describe('competitionStatsBoards', () => {
  const stats: PlayerCompetitionStats[] = [
    {
      id: '1',
      season_id: 's',
      competition_id: 'c',
      uid: 'u1',
      display_name: 'G1',
      matches: 5,
      minutes: 400,
      goals: 5,
      assists: 1,
      clean_sheets: 0,
      yellow_cards: 2,
      red_cards: 0,
      rating_sum: 35,
      rating_count: 5,
      motm: 1,
      updated_at: new Date(),
    },
    {
      id: '2',
      season_id: 's',
      competition_id: 'c',
      uid: 'u2',
      display_name: 'A1',
      matches: 5,
      minutes: 450,
      goals: 1,
      assists: 4,
      clean_sheets: 3,
      yellow_cards: 0,
      red_cards: 1,
      rating_sum: 40,
      rating_count: 5,
      motm: 0,
      updated_at: new Date(),
    },
  ];

  it('classe buteurs et passeurs', () => {
    const boards = buildCompetitionLeaderboards(stats);
    expect(boards.scorers[0].uid).toBe('u1');
    expect(boards.assists[0].uid).toBe('u2');
    expect(boards.cleanSheets[0].uid).toBe('u2');
  });

  it('calcule l’analytique équipe', () => {
    const analytics = buildTeamSeasonAnalytics([
      {
        team_id: 't1',
        display_name: 'Alpha',
        points: 12,
        played: 5,
        won: 4,
        goal_difference: 6,
      },
    ]);
    expect(analytics[0].win_rate).toBe(80);
    expect(analytics[0].form_label).toBe('En forme');
  });
});
