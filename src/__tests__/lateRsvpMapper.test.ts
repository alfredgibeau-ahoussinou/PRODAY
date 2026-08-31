import { teamEventFromFirestore } from '../lib/firestoreMappers';

describe('teamEventFromFirestore late RSVP', () => {
  it('keeps late_* statuses on reload (not dropped as pending)', () => {
    const event = teamEventFromFirestore('e1', {
      title: 'Match',
      event_type: 'friendly',
      organizer_uid: 'c1',
      organizer_name: 'Coach',
      starts_at: new Date('2026-04-01T12:00:00Z'),
      city: 'Paris',
      invitee_uids: ['p1', 'p2', 'p3'],
      rsvps: {
        p1: 'late_under_10',
        p2: 'late_over_10',
        p3: 'late_unknown',
        p4: 'yes',
        bad: 'nope',
      },
      reminder_hours_before: 24,
    });

    expect(event.rsvps.p1).toBe('late_under_10');
    expect(event.rsvps.p2).toBe('late_over_10');
    expect(event.rsvps.p3).toBe('late_unknown');
    expect(event.rsvps.p4).toBe('yes');
    expect(event.rsvps.bad).toBeUndefined();
  });
});
