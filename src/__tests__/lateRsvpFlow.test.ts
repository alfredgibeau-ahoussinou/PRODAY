import {
  isLateRsvp,
  isComingRsvp,
  LATE_INTENT_TO_RSVP,
  RSVP_STATUS_LABELS,
  countRsvpYes,
} from '../models/TeamEvent';
import type { RsvpStatus, TeamEvent } from '../models/TeamEvent';

function stubEvent(rsvps: Record<string, RsvpStatus>): TeamEvent {
  return {
    id: 'e1',
    title: 'Match U15',
    event_type: 'competition',
    organizer_uid: 'coach1',
    club_id: 'club1',
    starts_at: new Date(),
    invitee_uids: Object.keys(rsvps),
    rsvps,
    attendance_marks: {},
  } as unknown as TeamEvent;
}

describe('Late RSVP flow', () => {
  it('maps late intents to correct RSVP statuses', () => {
    expect(LATE_INTENT_TO_RSVP.under_10).toBe('late_under_10');
    expect(LATE_INTENT_TO_RSVP.over_10).toBe('late_over_10');
    expect(LATE_INTENT_TO_RSVP.unknown).toBe('late_unknown');
  });

  it('isLateRsvp recognizes all late statuses', () => {
    expect(isLateRsvp('late_under_10')).toBe(true);
    expect(isLateRsvp('late_over_10')).toBe(true);
    expect(isLateRsvp('late_unknown')).toBe(true);
    expect(isLateRsvp('yes')).toBe(false);
    expect(isLateRsvp('no')).toBe(false);
    expect(isLateRsvp('pending')).toBe(false);
  });

  it('late players count as "coming" for squad', () => {
    expect(isComingRsvp('late_under_10')).toBe(true);
    expect(isComingRsvp('late_over_10')).toBe(true);
    expect(isComingRsvp('late_unknown')).toBe(true);
    expect(isComingRsvp('yes')).toBe(true);
    expect(isComingRsvp('no')).toBe(false);
  });

  it('countRsvpYes includes late players', () => {
    const event = stubEvent({
      p1: 'yes',
      p2: 'late_under_10',
      p3: 'late_over_10',
      p4: 'no',
      p5: 'pending',
    });
    expect(countRsvpYes(event)).toBe(3);
  });

  it('all late statuses have French labels', () => {
    expect(RSVP_STATUS_LABELS.late_under_10).toBe('Retard < 10 min');
    expect(RSVP_STATUS_LABELS.late_over_10).toBe('Retard ≥ 10 min');
    expect(RSVP_STATUS_LABELS.late_unknown).toBe('Retard (durée inconnue)');
  });

  it('differentiates match vs training event types', () => {
    const match = stubEvent({ p1: 'late_over_10' });
    match.event_type = 'competition';
    const training = stubEvent({ p1: 'late_under_10' });
    training.event_type = 'training';

    expect(match.event_type).toBe('competition');
    expect(training.event_type).toBe('training');
    expect(isLateRsvp(match.rsvps.p1)).toBe(true);
    expect(isLateRsvp(training.rsvps.p1)).toBe(true);
  });
});
