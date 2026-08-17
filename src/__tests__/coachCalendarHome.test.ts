import type { TeamEvent } from '../models/TeamEvent';
import {
  coachCalendarEventSummary,
  coachCalendarInitials,
  coachEventPlaceLabel,
  formatCoachCalendarDateStack,
  listCoachCalendarUpcoming,
} from '../utils/coachCalendarHome';

function event(partial: Partial<TeamEvent> & Pick<TeamEvent, 'id' | 'starts_at'>): TeamEvent {
  return {
    title: 'Entraînement',
    description: '',
    event_type: 'training',
    organizer_uid: 'coach',
    organizer_name: 'Coach',
    city: '',
    invitee_uids: [],
    rsvps: {},
    created_at: new Date('2026-01-01T00:00:00'),
    updated_at: new Date('2026-01-01T00:00:00'),
    ...partial,
  };
}

describe('coachCalendarHome', () => {
  it('forme des initiales type SportEasy', () => {
    expect(coachCalendarInitials('Fc champ')).toBe('FC');
    expect(coachCalendarInitials('Anna Ndiaye')).toBe('AN');
    expect(coachCalendarInitials('Coach')).toBe('CO');
    expect(coachCalendarInitials('   ')).toBe('EQ');
  });

  it('empile la date mer / 19 / août / 02:00', () => {
    const stack = formatCoachCalendarDateStack(new Date(2026, 7, 19, 2, 0, 0));
    expect(stack.weekday.toLowerCase().startsWith('mer')).toBe(true);
    expect(stack.day).toBe('19');
    expect(stack.month).toBe('août');
    expect(stack.time).toBe('02:00');
  });

  it('affiche Lieu inconnu sans ville ni label', () => {
    expect(coachEventPlaceLabel({ city: '', location_label: undefined })).toBe('Lieu inconnu');
    expect(coachEventPlaceLabel({ city: 'Paris', location_label: 'Stade' })).toBe('Stade');
    expect(coachEventPlaceLabel({ city: 'Lyon', location_label: '' })).toBe('Lyon');
  });

  it('liste les prochains événements et le live, pas seulement le premier', () => {
    const now = new Date(2026, 7, 17, 12, 0, 0).getTime();
    const liveStart = new Date(now - 20 * 60_000);
    const rows = listCoachCalendarUpcoming(
      [
        event({ id: 'past', starts_at: new Date(now - 3 * 3600_000), ends_at: new Date(now - 2 * 3600_000) }),
        event({
          id: 'live',
          title: 'Match live',
          event_type: 'friendly',
          starts_at: liveStart,
          ends_at: new Date(now + 80 * 60_000),
          live_state: { status: 'live', home_score: 0, away_score: 0 },
        }),
        event({ id: 'a', starts_at: new Date(now + 3600_000) }),
        event({ id: 'b', starts_at: new Date(now + 2 * 3600_000) }),
        event({ id: 'c', starts_at: new Date(now + 3 * 3600_000) }),
      ],
      now,
    );
    expect(rows.map((e) => e.id)).toEqual(['live', 'a', 'b', 'c']);
  });

  it('résume convoqués et confirmés pour une carte calendrier', () => {
    const summary = coachCalendarEventSummary(
      event({
        id: 'ev1',
        starts_at: new Date(2026, 7, 20, 18, 0, 0),
        invitee_uids: ['p1', 'p2', 'p3'],
        rsvps: { p1: 'yes', p2: 'no', p3: 'late_under_10' },
      }),
    );
    expect(summary.invited).toBe(3);
    expect(summary.confirmed).toBe(2);
  });
});
