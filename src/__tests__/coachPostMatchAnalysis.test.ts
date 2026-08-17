import type { TeamEvent } from '../models/TeamEvent';
import {
  buildPostMatchAnalysis,
  findLatestPostMatchAnalysis,
  listRecentPostMatchAnalyses,
} from '../utils/coachPostMatchAnalysis';

function baseEvent(partial: Partial<TeamEvent> & Pick<TeamEvent, 'id' | 'title'>): TeamEvent {
  return {
    description: undefined,
    event_type: 'friendly',
    organizer_uid: 'c1',
    organizer_name: 'Coach',
    starts_at: new Date(Date.now() - 86_400_000),
    city: 'Paris',
    invitee_uids: ['p1', 'p2'],
    rsvps: {},
    created_at: new Date(),
    updated_at: new Date(),
    ...partial,
  };
}

const members = [{ uid: 'p1', display_name: 'Lucas' } as never];

describe('buildPostMatchAnalysis', () => {
  it('retourne null pour un match futur', () => {
    const future = baseEvent({
      id: 'f1',
      title: 'Amical',
      starts_at: new Date(Date.now() + 86_400_000),
    });
    expect(buildPostMatchAnalysis(future, members)).toBeNull();
  });

  it('retourne null pour un entraînement passé', () => {
    const training = baseEvent({
      id: 't1',
      title: 'Séance',
      event_type: 'training',
    });
    expect(buildPostMatchAnalysis(training, members)).toBeNull();
  });

  it('analyse un match avec feuille et score', () => {
    const match = baseEvent({
      id: 'm1',
      title: 'J1 vs Rivaux',
      live_state: { status: 'finished', home_score: 2, away_score: 1 },
      player_match_stats: {
        p1: { uid: 'p1', player_name: 'Lucas', goals: 2, rating: 8.5 },
      },
      match_report_finalized_at: new Date(),
    });
    const a = buildPostMatchAnalysis(match, members);
    expect(a).not.toBeNull();
    expect(a!.level).toBe('ready');
    expect(a!.scoreLabel).toMatch(/2 – 1/);
    expect(a!.positives.some((p) => /Victoire/i.test(p))).toBe(true);
    expect(a!.mvp?.name).toBe('Lucas');
    expect(a!.videoNote).toMatch(/vidéo/i);
  });

  it('signale l’absence de stats sans inventer de MVP', () => {
    const match = baseEvent({
      id: 'm2',
      title: 'Sans feuille',
      live_state: { status: 'finished', home_score: 0, away_score: 0 },
    });
    const a = buildPostMatchAnalysis(match, members);
    expect(a).not.toBeNull();
    expect(a!.mvp).toBeNull();
    expect(a!.videoNote).toMatch(/Aucune vidéo/i);
  });
});

describe('listRecentPostMatchAnalyses', () => {
  it('trie du plus récent au plus ancien', () => {
    const older = baseEvent({ id: 'o', title: 'Ancien', starts_at: new Date(Date.now() - 172_800_000) });
    const recent = baseEvent({
      id: 'r',
      title: 'Récent',
      live_state: { status: 'finished', home_score: 1, away_score: 0 },
    });
    const list = listRecentPostMatchAnalyses([older, recent], members, 2);
    expect(list[0]?.title).toBe('Récent');
  });
});

describe('findLatestPostMatchAnalysis', () => {
  it('retourne null sans match analysable', () => {
    expect(findLatestPostMatchAnalysis([], members)).toBeNull();
  });
});
