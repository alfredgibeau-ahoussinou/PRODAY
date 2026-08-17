jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import {
  buildCoachAiInsights,
  buildCoachAiNowActions,
  buildCoachAiTeamOverview,
  buildCoachPlayerAiInsights,
} from '../utils/coachAiInsights';
import type { TeamEvent } from '../models/TeamEvent';

function baseEvent(partial: Partial<TeamEvent> & Pick<TeamEvent, 'id' | 'title'>): TeamEvent {
  return {
    description: undefined,
    event_type: 'friendly',
    organizer_uid: 'c1',
    organizer_name: 'Coach',
    starts_at: new Date(Date.now() + 86_400_000),
    city: 'Paris',
    invitee_uids: ['p1', 'p2'],
    rsvps: {},
    created_at: new Date(),
    updated_at: new Date(),
    ...partial,
  };
}

describe('buildCoachAiTeamOverview', () => {
  it('demande un club si absent', () => {
    const o = buildCoachAiTeamOverview({
      events: [],
      members: [],
      hasClub: false,
    });
    expect(o.level).toBe('none');
    expect(o.synthesis).toMatch(/club/i);
    expect(o.emptyCta?.action).toBe('join-club');
  });

  it('ne fabrique pas de stats sans feuilles de match', () => {
    const o = buildCoachAiTeamOverview({
      events: [baseEvent({ id: 'e1', title: 'Amical' })],
      members: [{ uid: 'p1', display_name: 'Lucas' } as never],
      hasClub: true,
    });
    expect(o.level).toBe('partial');
    expect(o.synthesis).toMatch(/feuilles de match/i);
    expect(o.synthesis).not.toMatch(/note moyenne/i);
  });

  it('synthétise avec feuilles réelles', () => {
    const past = baseEvent({
      id: 'past',
      title: 'J1',
      starts_at: new Date(Date.now() - 86_400_000),
      player_match_stats: {
        p1: { uid: 'p1', player_name: 'Lucas', goals: 2, rating: 7.5 },
      },
    });
    const o = buildCoachAiTeamOverview({
      events: [past],
      members: [{ uid: 'p1', display_name: 'Lucas' } as never],
      hasClub: true,
    });
    expect(o.level).toBe('ready');
    expect(o.synthesis).toMatch(/2 but/);
    expect(o.synthesis).toMatch(/7\.5/);
  });
});

describe('buildCoachAiNowActions', () => {
  it('priorise les feuilles manquantes', () => {
    const past = baseEvent({
      id: 'past',
      title: 'Sans feuille',
      starts_at: new Date(Date.now() - 86_400_000),
    });
    const actions = buildCoachAiNowActions({
      events: [past],
      members: [{ uid: 'p1', display_name: 'A' } as never],
      hasClub: true,
    });
    expect(actions.some((a) => a.id === 'add-match-sheets')).toBe(true);
  });

  it('limite à 5 actions', () => {
    const event = baseEvent({
      id: 'e1',
      title: 'Match',
      invitee_uids: ['a', 'b', 'c'],
      rsvps: { a: 'yes' },
    });
    const actions = buildCoachAiNowActions({
      events: [event],
      members: Array.from({ length: 8 }, (_, i) => ({ uid: `p${i}`, display_name: `J${i}` }) as never),
      hasClub: true,
    });
    expect(actions.length).toBeLessThanOrEqual(5);
  });
});

describe('buildCoachAiInsights', () => {
  it('assemble overview, stratégie et actions', () => {
    const insight = buildCoachAiInsights({
      events: [],
      members: [],
      hasClub: true,
    });
    expect(insight.overview).toBeDefined();
    expect(insight.strategy).toBeDefined();
    expect(Array.isArray(insight.actions)).toBe(true);
  });
});

describe('buildCoachPlayerAiInsights', () => {
  it('état vide honnête sans données', () => {
    const r = buildCoachPlayerAiInsights({
      playerUid: 'p1',
      playerName: 'Lucas',
      events: [],
      evaluations: [],
    });
    expect(r.level).toBe('none');
    expect(r.bullets).toHaveLength(0);
    expect(r.emptyHint).toMatch(/feuille de match/i);
  });

  it('utilise les notes coach', () => {
    const r = buildCoachPlayerAiInsights({
      playerUid: 'p1',
      playerName: 'Lucas',
      events: [],
      evaluations: [],
      note: 'Bon pressing, à travailler la finition.',
    });
    expect(r.bullets.some((b) => b.includes('Note coach'))).toBe(true);
  });

  it('intègre les scores coach /10', () => {
    const r = buildCoachPlayerAiInsights({
      playerUid: 'p1',
      playerName: 'Lucas',
      events: [],
      evaluations: [
        {
          id: 'e1',
          club_id: 'c1',
          player_uid: 'p1',
          player_name: 'Lucas',
          coach_uid: 'coach',
          coach_name: 'Coach',
          context: 'season',
          ratings: { overall: 8, technical: 7, tactical: 6 },
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
    });
    expect(r.bullets.some((b) => /8\/10/.test(b))).toBe(true);
    expect(r.bullets.some((b) => /technique 7\/10/.test(b))).toBe(true);
  });
});
