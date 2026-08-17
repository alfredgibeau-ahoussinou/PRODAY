import type { TeamEvent } from '../models/TeamEvent';
import {
  coachEventHubKind,
  isCoachDetectionEvent,
  isCoachEventHubReady,
  isCoachPlanningRelevant,
} from '../models/TeamEvent';

const baseEvent = (overrides: Partial<TeamEvent> = {}): TeamEvent =>
  ({
    id: 'e1',
    title: 'Test',
    event_type: 'training',
    organizer_uid: 'coach',
    organizer_name: 'Coach',
    starts_at: new Date(),
    city: 'Paris',
    invitee_uids: [],
    rsvps: {},
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }) as TeamEvent;

describe('coachEventHub helpers', () => {
  it('résout le kind hub par type', () => {
    expect(coachEventHubKind(baseEvent({ event_type: 'friendly' }))).toBe('match');
    expect(coachEventHubKind(baseEvent({ event_type: 'training' }))).toBe('training');
    expect(coachEventHubKind(baseEvent({ event_type: 'detection' }))).toBe('detection');
    expect(coachEventHubKind(baseEvent({ event_type: 'meeting' }))).toBe('meeting');
    expect(coachEventHubKind(baseEvent({ event_type: 'other' }))).toBe('meeting');
  });

  it('training ready avec team_id ou invitees', () => {
    expect(isCoachEventHubReady(baseEvent({ event_type: 'training' }))).toBe(false);
    expect(
      isCoachEventHubReady(baseEvent({ event_type: 'training', team_id: 't1' })),
    ).toBe(true);
    expect(
      isCoachEventHubReady(
        baseEvent({ event_type: 'training', invitee_uids: ['p1'] }),
      ),
    ).toBe(true);
  });

  it('detection ready avec max_participants et categories', () => {
    expect(isCoachEventHubReady(baseEvent({ event_type: 'detection' }))).toBe(false);
    expect(
      isCoachEventHubReady(
        baseEvent({
          event_type: 'detection',
          max_participants: 30,
          categories: ['U17'],
        }),
      ),
    ).toBe(true);
  });

  it('match ready avec invitees ou lien fixture', () => {
    expect(isCoachEventHubReady(baseEvent({ event_type: 'friendly' }))).toBe(false);
    expect(
      isCoachEventHubReady(
        baseEvent({ event_type: 'friendly', invitee_uids: ['p1'] }),
      ),
    ).toBe(true);
    expect(
      isCoachEventHubReady(
        baseEvent({ event_type: 'competition', competition_fixture_id: 'fx1' }),
      ),
    ).toBe(true);
  });

  it('inclut les détections dans le planning coach', () => {
    expect(isCoachPlanningRelevant(baseEvent({ event_type: 'detection' }))).toBe(true);
    expect(isCoachDetectionEvent(baseEvent({ event_type: 'detection' }))).toBe(true);
  });
});
