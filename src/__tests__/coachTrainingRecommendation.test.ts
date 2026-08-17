jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import type { TeamEvent } from '../models/TeamEvent';
import {
  buildRecommendedSession,
  defaultRecommendedSessionStart,
  formatRecommendedSessionNotes,
} from '../utils/coachTrainingRecommendation';

function baseEvent(partial: Partial<TeamEvent> & Pick<TeamEvent, 'id' | 'title'>): TeamEvent {
  return {
    description: undefined,
    event_type: 'friendly',
    organizer_uid: 'c1',
    organizer_name: 'Coach',
    starts_at: new Date(Date.now() - 86_400_000),
    city: 'Paris',
    invitee_uids: ['p1', 'p2'],
    rsvps: {},
    created_at: new Date(),
    updated_at: new Date(),
    ...partial,
  };
}

const members = [
  { uid: 'p1', display_name: 'Lucas' },
  { uid: 'p2', display_name: 'Emma' },
] as never[];

describe('buildRecommendedSession', () => {
  it('propose une séance générique honnête sans données match', () => {
    const session = buildRecommendedSession({
      events: [],
      members,
      hasClub: true,
    });
    expect(session.dataConfidence).toBe('none');
    expect(session.reason).toMatch(/Données limitées/i);
    expect(session.blocks.length).toBeGreaterThanOrEqual(4);
    expect(session.totalMinutes).toBe(session.blocks.reduce((n, b) => n + b.minutes, 0));
    expect(session.title).toMatch(/75 min/);
  });

  it('adapte le focus après une analyse post-match finition', () => {
    const past = baseEvent({
      id: 'm1',
      title: 'J1',
      live_state: { status: 'finished', home_score: 0, away_score: 1 },
      player_match_stats: {
        p1: { uid: 'p1', player_name: 'Lucas', goals: 0, rating: 5.5 },
      },
    });
    const session = buildRecommendedSession({
      events: [past],
      members,
      hasClub: true,
    });
    expect(session.focus).toMatch(/finition/i);
    expect(session.dataConfidence).not.toBe('none');
    expect(session.reason).toMatch(/post-match/i);
    expect(session.blocks.some((b) => /finition|transitions|jeu réduit/i.test(b.label))).toBe(true);
  });

  it('propose une séance récupération si alertes forme', () => {
    const session = buildRecommendedSession({
      events: [],
      members: [
        { uid: 'p1', display_name: 'A' },
        { uid: 'p2', display_name: 'B' },
        { uid: 'p3', display_name: 'C' },
      ] as never[],
      wellnessByUid: {
        p1: { fatigue: 8, wellness_score: 3 },
        p2: { injured: true },
      },
      hasClub: true,
    });
    expect(session.focus).toMatch(/récupération/i);
    expect(session.difficulty).toBe('facile');
  });

  it('utilise le nombre de joueurs convoqués si entraînement à venir', () => {
    const training = baseEvent({
      id: 't1',
      title: 'Séance',
      event_type: 'training',
      starts_at: new Date(Date.now() + 86_400_000),
      invitee_uids: ['p1', 'p2', 'p3'],
      rsvps: { p1: 'yes', p2: 'yes', p3: 'pending' },
    });
    const session = buildRecommendedSession({
      events: [training],
      members,
      hasClub: true,
    });
    expect(session.playerCount).toBe(2);
  });
});

describe('formatRecommendedSessionNotes', () => {
  it('formate les blocs pour session_plan', () => {
    const session = buildRecommendedSession({ events: [], members, hasClub: true });
    const notes = formatRecommendedSessionNotes(session);
    expect(notes).toMatch(/Focus :/);
    expect(notes).toMatch(/• Échauffement/);
  });
});

describe('defaultRecommendedSessionStart', () => {
  it('évite le dimanche', () => {
    const saturday = new Date('2026-08-15T12:00:00');
    const start = defaultRecommendedSessionStart(saturday);
    expect(start.getDay()).not.toBe(0);
    expect(start.getHours()).toBe(18);
  });
});
