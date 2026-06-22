import type { TeamEvent } from '../models/TeamEvent';
import {
  buildActivityFromTeamEvent,
  playerPlayedInTeamEvent,
  teamEventDurationMin,
} from '../utils/teamEventActivitySync';

function baseEvent(overrides: Partial<TeamEvent> = {}): TeamEvent {
  const now = new Date('2026-06-20T18:00:00');
  return {
    id: 'ev1',
    title: 'Match amical',
    event_type: 'friendly',
    organizer_uid: 'coach1',
    organizer_name: 'Coach',
    starts_at: now,
    city: 'Lyon',
    invitee_uids: ['p1'],
    rsvps: { p1: 'pending' },
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

describe('teamEventActivitySync', () => {
  it('détecte présence via attendance_marks', () => {
    const event = baseEvent({ attendance_marks: { p1: 'present' } });
    expect(playerPlayedInTeamEvent(event, 'p1')).toBe(true);
    expect(playerPlayedInTeamEvent(event, 'p2')).toBe(false);
  });

  it('détecte joueur en compo après finalisation', () => {
    const past = new Date('2026-06-10T18:00:00');
    const event = baseEvent({
      starts_at: past,
      match_report_finalized_at: new Date('2026-06-10T20:00:00'),
      lineup: {
        formation: '4-3-3',
        slots: [{ uid: 'p1', display_name: 'Joueur', role: 'starter' }],
      },
    });
    expect(playerPlayedInTeamEvent(event, 'p1')).toBe(true);
  });

  it('mappe durée depuis ends_at', () => {
    const start = new Date('2026-06-20T18:00:00');
    const end = new Date('2026-06-20T19:30:00');
    expect(teamEventDurationMin(baseEvent({ starts_at: start, ends_at: end }))).toBe(90);
  });

  it('buildActivity lie team_event_id sans doublon logique', () => {
    const event = baseEvent({
      attendance_marks: { p1: 'present' },
      player_match_stats: {
        p1: { uid: 'p1', player_name: 'Joueur', goals: 1, assists: 2, minutes_played: 80 },
      },
    });
    const input = buildActivityFromTeamEvent(event, 'p1');
    expect(input).toMatchObject({
      player_uid: 'p1',
      type: 'match',
      team_event_id: 'ev1',
      source: 'team_event',
      goals: 1,
      assists: 2,
      duration_min: 80,
      notes: 'Match amical',
    });
  });

  it('retourne null si joueur absent', () => {
    const event = baseEvent({ rsvps: { p1: 'no' } });
    expect(buildActivityFromTeamEvent(event, 'p1')).toBeNull();
  });
});
