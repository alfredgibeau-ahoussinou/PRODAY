import { buildOpponentMatchDaySheet } from '../utils/opponentMatchDaySheet';
import type { TeamEvent } from '../models/TeamEvent';

function stubEvent(partial: Partial<TeamEvent> & { id: string }): TeamEvent {
  return {
    title: 'U18 vs Rival FC',
    description: undefined,
    event_type: 'friendly',
    organizer_uid: 'coach1',
    organizer_name: 'Coach',
    club_id: 'c1',
    club_name: 'ProDay FC',
    starts_at: new Date('2099-03-01T15:00:00Z'),
    city: 'Paris',
    invitee_uids: [],
    rsvps: {},
    reminder_hours_before: 24,
    location_label: 'Stade Nord',
    live_state: {
      opponent_name: 'Rival FC',
      home_label: 'ProDay FC',
      home_score: 0,
      away_score: 0,
      status: 'scheduled',
    },
    ...partial,
  } as TeamEvent;
}

describe('buildOpponentMatchDaySheet', () => {
  it('exposes opponent name and low-confidence analysis without H2H', () => {
    const event = stubEvent({ id: 'e1' });
    const sheet = buildOpponentMatchDaySheet({ event });
    expect(sheet.opponentName).toBe('Rival FC');
    expect(sheet.homeLabel).toBe('ProDay FC');
    expect(sheet.analysis.data_confidence).toBe('low');
    expect(sheet.h2h).toHaveLength(0);
    expect(sheet.h2hLabel).toMatch(/Aucun score/);
  });

  it('aggregates H2H from past scored events', () => {
    const event = stubEvent({ id: 'e-live' });
    const past = stubEvent({
      id: 'e-past',
      starts_at: new Date('2020-01-01T15:00:00Z'),
      live_state: {
        opponent_name: 'Rival FC',
        home_label: 'ProDay FC',
        home_score: 2,
        away_score: 1,
        status: 'finished',
      },
    });
    const sheet = buildOpponentMatchDaySheet({
      event,
      clubEvents: [event, past],
      coachNotes: 'Attention corners',
    });
    expect(sheet.h2h).toHaveLength(1);
    expect(sheet.h2hLabel).toMatch(/1V/);
    expect(sheet.coachNotes).toBe('Attention corners');
    expect(sheet.analysis.data_confidence).not.toBe('low');
  });
});
