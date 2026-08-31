import { rollupPlayerCompetitionStats } from '../utils/competitionPlayerRollup';
import type { PlayerCompetitionStats } from '../models/Competition';
import type { PlayerMatchSheetStat } from '../models/TeamEvent';

function sheet(uid: string, overrides: Partial<PlayerMatchSheetStat> = {}): PlayerMatchSheetStat {
  return {
    uid,
    player_name: `Player ${uid}`,
    minutes_played: 90,
    rating: 7,
    goals: 0,
    assists: 0,
    yellow_cards: 0,
    red_cards: 0,
    ...overrides,
  };
}

function existing(uid: string, overrides: Partial<PlayerCompetitionStats> = {}): PlayerCompetitionStats {
  return {
    id: `stat_${uid}`,
    uid,
    season_id: 's1',
    competition_id: 'c1',
    display_name: `Player ${uid}`,
    team_id: null,
    matches: 0,
    minutes: 0,
    goals: 0,
    assists: 0,
    clean_sheets: 0,
    yellow_cards: 0,
    red_cards: 0,
    rating_sum: 0,
    rating_count: 0,
    motm: 0,
    updated_at: new Date(),
    ...overrides,
  };
}

describe('rollupPlayerCompetitionStats', () => {
  it('accumulates new match stats onto empty existing', () => {
    const rolled = rollupPlayerCompetitionStats({
      seasonId: 's1',
      competitionId: 'c1',
      sheetStats: [sheet('p1', { goals: 2, assists: 1 })],
      existing: [],
    });
    expect(rolled).toHaveLength(1);
    expect(rolled[0].goals).toBe(2);
    expect(rolled[0].assists).toBe(1);
    expect(rolled[0].matches).toBe(1);
    expect(rolled[0].minutes).toBe(90);
  });

  it('merges with existing season stats', () => {
    const rolled = rollupPlayerCompetitionStats({
      seasonId: 's1',
      competitionId: 'c1',
      sheetStats: [sheet('p1', { goals: 1 })],
      existing: [existing('p1', { matches: 5, goals: 4, minutes: 400 })],
    });
    expect(rolled[0].matches).toBe(6);
    expect(rolled[0].goals).toBe(5);
    expect(rolled[0].minutes).toBe(490);
  });

  it('awards clean sheet when 60+ minutes and team kept clean sheet', () => {
    const rolled = rollupPlayerCompetitionStats({
      seasonId: 's1',
      competitionId: 'c1',
      sheetStats: [sheet('gk', { minutes_played: 90 })],
      existing: [],
      homeCleanSheet: true,
    });
    expect(rolled[0].clean_sheets).toBe(1);
  });

  it('does not award clean sheet under 60 minutes', () => {
    const rolled = rollupPlayerCompetitionStats({
      seasonId: 's1',
      competitionId: 'c1',
      sheetStats: [sheet('sub', { minutes_played: 30 })],
      existing: [],
      homeCleanSheet: true,
    });
    expect(rolled[0].clean_sheets).toBe(0);
  });

  it('increments motm for potm uid', () => {
    const rolled = rollupPlayerCompetitionStats({
      seasonId: 's1',
      competitionId: 'c1',
      sheetStats: [sheet('p1'), sheet('p2')],
      existing: [],
      potmUid: 'p1',
    });
    const p1 = rolled.find((r) => r.uid === 'p1');
    const p2 = rolled.find((r) => r.uid === 'p2');
    expect(p1?.motm).toBe(1);
    expect(p2?.motm).toBe(0);
  });

  it('accumulates rating', () => {
    const rolled = rollupPlayerCompetitionStats({
      seasonId: 's1',
      competitionId: 'c1',
      sheetStats: [sheet('p1', { rating: 8 })],
      existing: [existing('p1', { rating_sum: 14, rating_count: 2 })],
    });
    expect(rolled[0].rating_sum).toBe(22);
    expect(rolled[0].rating_count).toBe(3);
  });
});
