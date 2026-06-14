import type { TeamEvent } from '../models/TeamEvent';
import {
  countGoalsFromActions,
  inferMatchStatus,
  resolveLiveState,
  isInMatchWindow,
} from '../utils/matchLive';

const baseEvent = (overrides: Partial<TeamEvent> = {}): TeamEvent =>
  ({
    id: 'e1',
    title: 'Match test',
    event_type: 'friendly',
    organizer_uid: 'coach',
    organizer_name: 'Coach',
    starts_at: new Date(Date.now() - 30 * 60 * 1000),
    city: 'Paris',
    invitee_uids: [],
    rsvps: {},
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }) as TeamEvent;

describe('matchLive', () => {
  it('compte les buts dans la timeline', () => {
    expect(
      countGoalsFromActions([
        {
          id: '1',
          type: 'goal',
          player_uid: 'p1',
          player_name: 'A',
          minute: 10,
          created_at: new Date(),
        },
        {
          id: '2',
          type: 'assist',
          player_uid: 'p1',
          player_name: 'A',
          minute: 10,
          created_at: new Date(),
        },
      ])
    ).toBe(1);
  });

  it('résout le score depuis live_state', () => {
    const state = resolveLiveState(
      baseEvent({
        live_state: {
          status: 'live',
          minute: 55,
          home_score: 2,
          away_score: 1,
          opponent_name: 'FC Test',
          home_label: 'ProDay FC',
        },
      })
    );
    expect(state.home_score).toBe(2);
    expect(state.away_score).toBe(1);
    expect(state.opponent_name).toBe('FC Test');
  });

  it('détecte une fenêtre match live', () => {
    const live = baseEvent({
      live_state: { status: 'live', home_score: 0, away_score: 0 },
    });
    expect(isInMatchWindow(live)).toBe(true);
    expect(inferMatchStatus(live)).toBe('live');
  });
});
