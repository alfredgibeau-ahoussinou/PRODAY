import type { TeamEvent } from '../models/TeamEvent';
import {
  isCoachMatchEvent,
  isCoachTrainingEvent,
  resolveEventSessionStatus,
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

describe('TeamEvent session helpers', () => {
  it('identifie match vs entraînement', () => {
    expect(isCoachMatchEvent(baseEvent({ event_type: 'friendly' }))).toBe(true);
    expect(isCoachMatchEvent(baseEvent({ event_type: 'training' }))).toBe(false);
    expect(isCoachTrainingEvent(baseEvent({ event_type: 'training' }))).toBe(true);
    expect(isCoachTrainingEvent(baseEvent({ event_type: 'other' }))).toBe(true);
    expect(isCoachTrainingEvent(baseEvent({ event_type: 'friendly' }))).toBe(false);
  });

  it('résout entraînement terminé via live_state', () => {
    const finished = baseEvent({
      event_type: 'training',
      live_state: { status: 'finished', home_score: 0, away_score: 0 },
    });
    expect(resolveEventSessionStatus(finished)).toBe('finished');
  });

  it('résout entraînement en cours si starts_at passé', () => {
    const inProgress = baseEvent({
      event_type: 'training',
      starts_at: new Date(Date.now() - 30 * 60 * 1000),
      ends_at: new Date(Date.now() + 60 * 60 * 1000),
    });
    expect(resolveEventSessionStatus(inProgress)).toBe('in_progress');
  });

  it('résout entraînement terminé si ends_at dépassé', () => {
    const past = baseEvent({
      event_type: 'training',
      starts_at: new Date(Date.now() - 3 * 60 * 60 * 1000),
      ends_at: new Date(Date.now() - 60 * 60 * 1000),
    });
    expect(resolveEventSessionStatus(past)).toBe('finished');
  });

  it('résout match live comme en cours', () => {
    const live = baseEvent({
      event_type: 'friendly',
      live_state: { status: 'live', home_score: 1, away_score: 0 },
    });
    expect(resolveEventSessionStatus(live)).toBe('in_progress');
  });
});
