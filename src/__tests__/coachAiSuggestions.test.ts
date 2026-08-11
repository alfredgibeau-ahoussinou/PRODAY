import { buildCoachAiSuggestions, buildCoachPortalPriorities } from '../utils/coachAiSuggestions';
import type { TeamEvent } from '../models/TeamEvent';

function baseEvent(partial: Partial<TeamEvent> & Pick<TeamEvent, 'id' | 'title'>): TeamEvent {
  return {
    description: undefined,
    event_type: 'training',
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

describe('buildCoachAiSuggestions', () => {
  it('suggère de planifier quand aucun événement', () => {
    const items = buildCoachAiSuggestions({ events: [], membersCount: 14 });
    expect(items[0]?.id).toBe('plan-session');
  });

  it('relance les RSVP en attente', () => {
    const event = baseEvent({
      id: 'e1',
      title: 'U17',
      event_type: 'friendly',
      invitee_uids: ['a', 'b', 'c'],
      rsvps: { a: 'yes' },
    });
    const items = buildCoachAiSuggestions({ events: [event], membersCount: 14 });
    expect(items.some((i) => i.id === 'remind-rsvp')).toBe(true);
    expect(items.some((i) => i.kind === 'squad')).toBe(true);
  });

  it('propose un focus séance pour un entraînement', () => {
    const event = baseEvent({
      id: 'e2',
      title: 'Entraînement',
      event_type: 'training',
      invitee_uids: ['a', 'b'],
      rsvps: { a: 'yes', b: 'yes' },
    });
    const items = buildCoachAiSuggestions({ events: [event], membersCount: 16 });
    expect(items.some((i) => i.id === 'training-focus')).toBe(true);
  });
});

describe('buildCoachPortalPriorities', () => {
  it('priorise le club si absent', () => {
    const items = buildCoachPortalPriorities({
      hasClub: false,
      membersCount: 0,
      upcomingEvents: 0,
      pendingConvocations: 0,
      canManageConvocations: true,
    });
    expect(items[0]?.id).toBe('join-club');
  });

  it('ne fabrique pas de fausse annonce Mercato', () => {
    const items = buildCoachPortalPriorities({
      hasClub: true,
      membersCount: 0,
      upcomingEvents: 0,
      pendingConvocations: 0,
      canManageConvocations: true,
    });
    expect(items.every((i) => i.id !== 'posts' && i.id !== 'publish')).toBe(true);
    expect(items.some((i) => i.id === 'invite-roster')).toBe(true);
  });
});
