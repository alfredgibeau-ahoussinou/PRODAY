import type { ExternalFixture } from '../services/externalScores.service';
import type { TeamEvent } from '../models/TeamEvent';
import { isExternalFixtureLiveNow, isProdayEventLiveNow } from '../utils/supporterLiveMatches';

function teamEvent(partial: Partial<TeamEvent> & Pick<TeamEvent, 'id' | 'starts_at'>): TeamEvent {
  return {
    id: partial.id,
    title: partial.title ?? 'Match test',
    event_type: partial.event_type ?? 'friendly',
    starts_at: partial.starts_at,
    ends_at: partial.ends_at,
    club_id: partial.club_id,
    club_name: partial.club_name,
    invitee_uids: partial.invitee_uids ?? [],
    organizer_uid: partial.organizer_uid ?? 'coach-1',
    live_state: partial.live_state,
    live_actions: partial.live_actions,
  } as TeamEvent;
}

describe('supporterLiveMatches', () => {
  it('accepte un événement PRODAY en fenêtre live', () => {
    const now = Date.now();
    const event = teamEvent({
      id: 'e1',
      starts_at: new Date(now - 20 * 60 * 1000),
      live_state: { status: 'live', home_score: 1, away_score: 0, minute: 20 },
    });
    expect(isProdayEventLiveNow(event)).toBe(true);
  });

  it('rejette un événement PRODAY programmé', () => {
    const event = teamEvent({
      id: 'e2',
      starts_at: new Date(Date.now() + 3 * 60 * 60 * 1000),
    });
    expect(isProdayEventLiveNow(event)).toBe(false);
  });

  it('rejette une fixture monde live hors fenêtre horaire', () => {
    const fixture: ExternalFixture = {
      id: 'f1',
      competition: 'ligue1',
      competition_label: 'Ligue 1',
      home_team: 'A',
      away_team: 'B',
      starts_at: new Date('2020-01-01T19:00:00.000Z'),
      status: 'live',
      score_home: 1,
      score_away: 0,
    };
    expect(isExternalFixtureLiveNow(fixture)).toBe(false);
  });
});
