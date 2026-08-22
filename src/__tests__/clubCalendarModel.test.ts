import {
  buildClubCalendarItemModel,
  filterClubCalendarEvents,
  isClubCalendarInRange,
  resolveClubCalendarHero,
  resolveClubCalendarSubtitle,
  startOfClubWeek,
} from '../features/club/ui/clubCalendarModel';
import type { TeamEvent } from '../models/TeamEvent';

function event(
  partial: Partial<TeamEvent> & Pick<TeamEvent, 'id' | 'starts_at' | 'event_type'>,
): TeamEvent {
  return {
    title: 'Événement',
    organizer_uid: 'org',
    organizer_name: 'Org',
    club_id: 'c1',
    invitee_uids: [],
    rsvps: {},
    city: 'Paris',
    created_at: new Date(),
    updated_at: new Date(),
    ...partial,
  } as TeamEvent;
}

describe('clubCalendarModel', () => {
  it('filtre jour / semaine / mois', () => {
    const now = new Date('2030-06-10T12:00:00'); // mardi
    const today = event({
      id: 'today',
      event_type: 'training',
      starts_at: new Date('2030-06-10T18:00:00'),
    });
    const nextWeek = event({
      id: 'next',
      event_type: 'competition',
      starts_at: new Date('2030-06-17T15:00:00'),
    });
    expect(isClubCalendarInRange(today.starts_at, 'day', now)).toBe(true);
    expect(isClubCalendarInRange(nextWeek.starts_at, 'day', now)).toBe(false);
    expect(isClubCalendarInRange(today.starts_at, 'week', now)).toBe(true);
    expect(filterClubCalendarEvents([today, nextWeek], 'day', now).map((e) => e.id)).toEqual([
      'today',
    ]);
    expect(startOfClubWeek(now).getDay()).toBe(1); // lundi
  });

  it('priorise le prochain événement pour le hero', () => {
    const now = new Date();
    const past = event({
      id: 'past',
      event_type: 'training',
      starts_at: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    });
    const future = event({
      id: 'future',
      event_type: 'competition',
      title: 'U15 vs Rivaux',
      starts_at: new Date(now.getTime() + 2 * 60 * 60 * 1000),
    });
    expect(resolveClubCalendarHero([past, future], now)?.id).toBe('future');
    const model = buildClubCalendarItemModel(future);
    expect(model.isMatch).toBe(true);
    expect(model.nav).toBe('matches');
    expect(model.kindLabel).toBe('Match');
  });

  it('résume le sous-titre période', () => {
    expect(resolveClubCalendarSubtitle('week', 0)).toContain('rien de planifié');
    expect(resolveClubCalendarSubtitle('month', 3)).toContain('3 événements');
  });
});
