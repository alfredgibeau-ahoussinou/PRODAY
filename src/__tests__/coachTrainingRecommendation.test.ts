jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import type { TeamEvent } from '../models/TeamEvent';
import {
  buildCoachComposedPlan,
  defaultRecommendedSessionStart,
  formatRecommendedSessionNotes,
  resolveCoachCalendarContext,
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

describe('resolveCoachCalendarContext', () => {
  it('priorise le match si plus proche', () => {
    const training = baseEvent({
      id: 't1',
      title: 'Séance',
      event_type: 'training',
      starts_at: new Date(Date.now() + 3 * 86_400_000),
    });
    const match = baseEvent({
      id: 'm1',
      title: 'Amical',
      event_type: 'friendly',
      starts_at: new Date(Date.now() + 86_400_000),
    });
    const ctx = resolveCoachCalendarContext([training, match]);
    expect(ctx.primary).toBe('match');
    expect(ctx.primaryEvent?.id).toBe('m1');
  });

  it('priorise le match en cas d’égalité horaire', () => {
    const at = new Date(Date.now() + 86_400_000);
    const training = baseEvent({
      id: 't1',
      title: 'Séance',
      event_type: 'training',
      starts_at: at,
    });
    const match = baseEvent({
      id: 'm1',
      title: 'Amical',
      event_type: 'friendly',
      starts_at: at,
    });
    const ctx = resolveCoachCalendarContext([training, match]);
    expect(ctx.primary).toBe('match');
  });
});

describe('buildCoachComposedPlan', () => {
  it('propose une séance collective honnête sans données', () => {
    const plan = buildCoachComposedPlan({
      events: [],
      members,
      hasClub: true,
    });
    expect(plan.context).toBe('training');
    expect(plan.archetype).toBe('empty');
    expect(plan.reason).toMatch(/Aucun entraînement ni match/i);
  });

  it('compose une préparation match quand le prochain RDV est un match', () => {
    const match = baseEvent({
      id: 'm1',
      title: 'FC Rivaux',
      event_type: 'friendly',
      starts_at: new Date(Date.now() + 36 * 3_600_000),
      live_state: { opponent_name: 'FC Rivaux', status: 'scheduled' },
    });
    const plan = buildCoachComposedPlan({
      events: [match],
      members,
      hasClub: true,
    });
    expect(plan.context).toBe('match');
    expect(plan.title).toMatch(/Préparation match/i);
    expect(plan.blocks.some((b) => /causerie|activation|brief|analyse/i.test(b.label))).toBe(true);
    expect(plan.blocks.every((b) => !/jeu réduit entraînement/i.test(b.label))).toBe(true);
    expect(plan.targetEventId).toBe('m1');
  });

  it('ne propose pas un entraînement quand primary = match', () => {
    const match = baseEvent({
      id: 'm1',
      title: 'Amical',
      event_type: 'friendly',
      starts_at: new Date(Date.now() + 12 * 3_600_000),
    });
    const plan = buildCoachComposedPlan({
      events: [match],
      members,
      hasClub: true,
    });
    expect(plan.context).not.toBe('training');
    expect(plan.archetype).not.toBe('collective');
  });

  it('adapte l’archétype entraînement après analyse post-match finition', () => {
    const past = baseEvent({
      id: 'm1',
      title: 'J1',
      starts_at: new Date(Date.now() - 5 * 86_400_000),
      live_state: { status: 'finished', home_score: 0, away_score: 1 },
      player_match_stats: {
        p1: { uid: 'p1', player_name: 'Lucas', goals: 0, rating: 5.5 },
      },
    });
    const training = baseEvent({
      id: 't1',
      title: 'Séance',
      event_type: 'training',
      starts_at: new Date(Date.now() + 86_400_000),
    });
    const plan = buildCoachComposedPlan({
      events: [past, training],
      members,
      hasClub: true,
    });
    expect(plan.context).toBe('training');
    expect(plan.archetype).toBe('technical');
    expect(plan.reason).toMatch(/finition|technique/i);
  });

  it('propose récupération si match récent', () => {
    const past = baseEvent({
      id: 'm1',
      title: 'J1',
      starts_at: new Date(Date.now() - 24 * 3_600_000),
      live_state: { status: 'finished', home_score: 1, away_score: 0 },
      player_match_stats: {
        p1: { uid: 'p1', player_name: 'Lucas', goals: 1, rating: 7 },
      },
    });
    const training = baseEvent({
      id: 't1',
      title: 'Séance',
      event_type: 'training',
      starts_at: new Date(Date.now() + 86_400_000),
    });
    const plan = buildCoachComposedPlan({
      events: [past, training],
      members,
      hasClub: true,
    });
    expect(plan.context).toBe('training');
    expect(plan.archetype).toBe('recovery');
    expect(plan.difficulty).toBe('facile');
  });

  it('propose récupération si alertes forme', () => {
    const training = baseEvent({
      id: 't1',
      title: 'Séance',
      event_type: 'training',
      starts_at: new Date(Date.now() + 5 * 86_400_000),
    });
    const plan = buildCoachComposedPlan({
      events: [training],
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
    expect(plan.archetype).toBe('recovery');
  });

  it('utilise le nombre de joueurs convoqués', () => {
    const training = baseEvent({
      id: 't1',
      title: 'Séance',
      event_type: 'training',
      starts_at: new Date(Date.now() + 86_400_000),
      invitee_uids: ['p1', 'p2', 'p3'],
      rsvps: { p1: 'yes', p2: 'yes', p3: 'pending' },
    });
    const plan = buildCoachComposedPlan({
      events: [training],
      members,
      hasClub: true,
    });
    expect(plan.playerCount).toBe(2);
  });

  it('respecte targetEvent match dans le planning', () => {
    const match = baseEvent({
      id: 'm2',
      title: 'Coupe',
      event_type: 'competition',
      starts_at: new Date(Date.now() + 48 * 3_600_000),
    });
    const plan = buildCoachComposedPlan({
      events: [match],
      members,
      hasClub: true,
      targetEvent: match,
    });
    expect(plan.context).toBe('match');
    expect(plan.blocks.some((b) => /causerie|activation|brief/i.test(b.label))).toBe(true);
  });
});

describe('formatRecommendedSessionNotes', () => {
  it('formate les blocs pour session_plan', () => {
    const plan = buildCoachComposedPlan({ events: [], members, hasClub: true });
    const notes = formatRecommendedSessionNotes(plan);
    expect(notes).toMatch(/Entraînement|Préparation match/);
    expect(notes).toMatch(/Focus :/);
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
