import {
  aggregateSeasonStats,
  canApplySeasonStats,
  importLiveActionsToMatchSheet,
  seasonDeltaFromMatchSheet,
  tallyLiveActionStats,
} from '../utils/matchSeasonStats';
import type { TeamEvent } from '../models/TeamEvent';

describe('matchSeasonStats', () => {
  it('agrège les stats saison depuis une feuille match', () => {
    const delta = seasonDeltaFromMatchSheet({
      uid: 'p1',
      player_name: 'Martin',
      goals: 2,
      assists: 1,
    });
    expect(delta).toEqual({ matches: 1, goals: 2, assists: 1 });
    expect(
      aggregateSeasonStats({ matches: 4, goals: 1, assists: 0 }, delta),
    ).toEqual({ matches: 5, goals: 3, assists: 1 });
  });

  it('importe les actions live vers player_match_stats', () => {
    const event = {
      player_match_stats: {
        p1: { uid: 'p1', player_name: 'Martin', goals: 0, assists: 0 },
      },
      live_actions: [
        {
          id: 'a1',
          type: 'goal',
          player_uid: 'p1',
          player_name: 'Martin',
          minute: 12,
          created_at: new Date(),
        },
        {
          id: 'a2',
          type: 'assist',
          player_uid: 'p2',
          player_name: 'Dupont',
          minute: 12,
          created_at: new Date(),
        },
      ],
    } as TeamEvent;

    const sheets = importLiveActionsToMatchSheet(event);
    expect(sheets.p1.goals).toBe(1);
    expect(sheets.p2.assists).toBe(1);
  });

  it('calcule les totaux live legacy', () => {
    const tallies = tallyLiveActionStats([
      {
        id: 'g1',
        type: 'goal',
        player_uid: 'p1',
        player_name: 'A',
        minute: 1,
        created_at: new Date(),
      },
      {
        id: 'g2',
        type: 'goal',
        player_uid: 'p1',
        player_name: 'A',
        minute: 2,
        created_at: new Date(),
      },
      {
        id: 'a1',
        type: 'assist',
        player_uid: 'p2',
        player_name: 'B',
        minute: 2,
        created_at: new Date(),
      },
    ]);
    expect(tallies.p1).toEqual({ goals: 2, assists: 0 });
    expect(tallies.p2).toEqual({ goals: 0, assists: 1 });
  });

  it('autorise la propagation uniquement après validation rapport', () => {
    expect(
      canApplySeasonStats({
        match_report_finalized_at: new Date(),
      } as TeamEvent),
    ).toBe(true);
    expect(
      canApplySeasonStats({
        match_report_finalized_at: new Date(),
        stats_applied_at: new Date(),
      } as TeamEvent),
    ).toBe(false);
  });
});
