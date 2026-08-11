import { computeAutoPotm } from '../utils/competitionPotm';
import { rollupPlayerCompetitionStats } from '../utils/competitionPlayerRollup';
import {
  buildFixtureAiSummary,
  buildRecruitmentFormSignals,
  buildTalentRadar,
} from '../utils/competitionExclusives';
import type { CompetitionFixture, PlayerCompetitionStats } from '../models/Competition';

describe('competitionPotm', () => {
  it('sélectionne le joueur au meilleur score pondéré', () => {
    const potm = computeAutoPotm({
      a: { uid: 'a', player_name: 'Alice', goals: 2, assists: 0, rating: 7, minutes_played: 90 },
      b: { uid: 'b', player_name: 'Bob', goals: 0, assists: 2, rating: 8, minutes_played: 90 },
    });
    expect(potm?.uid).toBe('a');
  });
});

describe('competitionPlayerRollup', () => {
  it('agrège les feuilles de match', () => {
    const rolled = rollupPlayerCompetitionStats({
      seasonId: 's1',
      competitionId: 'c1',
      sheetStats: [
        { uid: 'a', player_name: 'Alice', goals: 1, assists: 1, minutes_played: 90, rating: 8 },
      ],
      existing: [],
      homeCleanSheet: true,
      potmUid: 'a',
    });
    expect(rolled[0].goals).toBe(1);
    expect(rolled[0].motm).toBe(1);
    expect(rolled[0].clean_sheets).toBe(1);
  });
});

describe('competitionExclusives', () => {
  const stats: PlayerCompetitionStats[] = [
    {
      id: '1',
      season_id: 's1',
      competition_id: 'c1',
      uid: 'u1',
      display_name: 'Star',
      matches: 8,
      minutes: 720,
      goals: 6,
      assists: 2,
      clean_sheets: 0,
      yellow_cards: 1,
      red_cards: 0,
      rating_sum: 64,
      rating_count: 8,
      motm: 2,
      updated_at: new Date(),
    },
  ];

  it('construit un talent radar', () => {
    const radar = buildTalentRadar(stats, 100);
    expect(radar[0].uid).toBe('u1');
    expect(radar[0].trajectory).toBe('rising');
  });

  it('détecte un pic de forme recrutement', () => {
    const signals = buildRecruitmentFormSignals(stats);
    expect(signals[0]?.form_spike).toBe(true);
  });

  it('génère un résumé de match', () => {
    const fixture = {
      home_name: 'A',
      away_name: 'B',
      home_score: 2,
      away_score: 1,
      matchday: 3,
      auto_potm_name: 'Star',
    } as CompetitionFixture;
    const summary = buildFixtureAiSummary(fixture);
    expect(summary).toContain('A');
    expect(summary).toContain('Homme du match');
  });
});
