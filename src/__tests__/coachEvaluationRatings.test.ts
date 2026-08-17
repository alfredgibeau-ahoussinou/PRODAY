import {
  formatCoachRating,
  formatCoachRatingsSummary,
  hasAnyCoachRating,
  normalizeCoachRatings,
} from '../utils/coachEvaluationRatings';
import type { ClubMatchVideo } from '../models/ClubCameras';
import { buildEventVideoStatus } from '../utils/coachVideoInsights';
import { buildPostMatchAnalysis } from '../utils/coachPostMatchAnalysis';
import type { TeamEvent } from '../models/TeamEvent';

describe('coachEvaluationRatings', () => {
  it('normalise les anciennes notes /5 vers /10', () => {
    const r = normalizeCoachRatings({ overall: 3 });
    expect(r.overall).toBe(6);
    expect(formatCoachRating(7.5)).toBe('7.5/10');
  });

  it('détecte les scores optionnels', () => {
    expect(hasAnyCoachRating({})).toBe(false);
    expect(hasAnyCoachRating({ technical: 8 })).toBe(true);
    expect(formatCoachRatingsSummary({ overall: 7, mental: 6 })).toMatch(/générale 7\/10/);
  });
});

describe('coachVideoInsights post-match', () => {
  const members = [{ uid: 'p1', display_name: 'Lucas' } as never];

  function baseEvent(partial: Partial<TeamEvent> & Pick<TeamEvent, 'id' | 'title'>): TeamEvent {
    return {
      description: undefined,
      event_type: 'friendly',
      organizer_uid: 'c1',
      organizer_name: 'Coach',
      starts_at: new Date(Date.now() - 86_400_000),
      city: 'Paris',
      invitee_uids: ['p1'],
      rsvps: {},
      created_at: new Date(),
      updated_at: new Date(),
      ...partial,
    };
  }

  it('signale l’absence de vidéo pour un match', () => {
    const match = baseEvent({
      id: 'm1',
      title: 'J1',
      live_state: { status: 'finished', home_score: 1, away_score: 0 },
    });
    const status = buildEventVideoStatus('m1', 'J1', []);
    expect(status.hasVideos).toBe(false);
    expect(status.note).toMatch(/Aucune vidéo/i);

    const analysis = buildPostMatchAnalysis(match, members, []);
    expect(analysis?.hasVideos).toBe(false);
    expect(analysis?.videoNote).toMatch(/Aucune vidéo/i);
  });

  it('lie une vidéo prête au match', () => {
    const match = baseEvent({
      id: 'm2',
      title: 'Coupe',
      live_state: { status: 'finished', home_score: 2, away_score: 2 },
    });
    const videos: ClubMatchVideo[] = [
      {
        id: 'v1',
        club_id: 'club1',
        source: 'import',
        status: 'ready',
        event_id: 'm2',
        title: 'Coupe — full match',
        highlights_ready: true,
        clips: [],
        player_uids: [],
        share_with: ['coaches'],
        created_by_uid: 'c1',
        created_at: new Date(),
        ai_ready: true,
      },
    ];
    const analysis = buildPostMatchAnalysis(match, members, videos);
    expect(analysis?.hasVideos).toBe(true);
    expect(analysis?.videos).toHaveLength(1);
    expect(analysis?.videoNote).toMatch(/Coupe — full match/);
  });
});
