import {
  needsParentRsvpResponse,
  parentAgendaSubtitle,
  parentRsvpSuccessCopy,
  pickNextChildEvent,
  resolveParentRsvpTone,
} from '../features/parent/ui/parentRsvpModel';
import type { TeamEvent } from '../models/TeamEvent';

function event(
  partial: Partial<TeamEvent> & Pick<TeamEvent, 'id' | 'title' | 'starts_at'>,
): TeamEvent {
  return {
    club_id: 'c1',
    team_id: 't1',
    organizer_uid: 'coach',
    event_type: 'training',
    invitee_uids: ['child1'],
    rsvps: {},
    ...partial,
  } as TeamEvent;
}

describe('parentRsvpModel', () => {
  it('choisit le prochain événement à venir', () => {
    const now = Date.parse('2026-08-22T12:00:00.000Z');
    const past = event({
      id: 'past',
      title: 'Hier',
      starts_at: new Date(now - 5 * 60 * 60 * 1000),
    });
    const next = event({
      id: 'next',
      title: 'Demain',
      starts_at: new Date(now + 60 * 60 * 1000),
    });
    const later = event({
      id: 'later',
      title: 'Plus tard',
      starts_at: new Date(now + 5 * 60 * 60 * 1000),
    });
    expect(pickNextChildEvent([later, past, next], now)?.id).toBe('next');
  });

  it('détecte une réponse à confirmer et le ton', () => {
    expect(needsParentRsvpResponse(undefined)).toBe(true);
    expect(needsParentRsvpResponse('pending')).toBe(true);
    expect(needsParentRsvpResponse('yes')).toBe(false);
    expect(resolveParentRsvpTone('late_under_10')).toBe('late');
    expect(resolveParentRsvpTone('no')).toBe('no');
  });

  it('résume succès et sous-titre agenda', () => {
    expect(parentRsvpSuccessCopy('yes', 'Léa')).toContain('présent');
    expect(parentRsvpSuccessCopy('no', 'Léa')).toContain('absent');
    expect(
      parentAgendaSubtitle({ upcomingCount: 2, pendingRsvpCount: 1 }),
    ).toContain('présence');
    expect(
      parentAgendaSubtitle({ upcomingCount: 2, pendingRsvpCount: 0 }),
    ).toContain('à venir');
  });
});
