import type { User } from '../models/User';
import type { RecruitmentPost } from '../models/Player';
import { rankPlayersForRecruitmentPost, scorePlayerForRecruitmentPost } from '../utils/recruiterPlayerMatching';

const post: RecruitmentPost = {
  id: 'post1',
  club_id: 'c1',
  club_name: 'FC Test',
  title: 'Ailier',
  position: 'Ailier',
  category: 'U19',
  level: 'R1',
  city: 'Lyon',
  description: 'Recherche ailier',
  created_at: new Date(),
  status: 'OPEN',
};

function player(overrides: Partial<User> = {}): User {
  return {
    uid: overrides.uid ?? 'p1',
    display_name: overrides.display_name ?? 'Joueur Test',
    email: 'j@test.com',
    role: 'player',
    profile: {
      position: 'Ailier',
      category: 'U19',
      level: 'R1',
      season_stats: { matches: 8, goals: 2, assists: 1 },
      ...(overrides.profile ?? {}),
    },
    city: 'Lyon',
    is_verified: true,
    ...overrides,
  } as User;
}

describe('recruiterPlayerMatching', () => {
  it('score élevé quand critères annonce correspondent', () => {
    const match = scorePlayerForRecruitmentPost(player(), post);
    expect(match.score).toBeGreaterThanOrEqual(70);
    expect(match.reasons.length).toBeGreaterThan(0);
  });

  it('score plus bas quand poste différent', () => {
    const good = scorePlayerForRecruitmentPost(player(), post);
    const weak = scorePlayerForRecruitmentPost(
      player({
        profile: { position: 'Gardien', category: 'Seniors', level: 'D2' },
        city: 'Marseille',
      }),
      post
    );
    expect(weak.score).toBeLessThan(good.score);
    expect(weak.reasons.some((r) => r.includes('Poste'))).toBe(false);
  });

  it('exclut joueurs déjà candidats', () => {
    const ranked = rankPlayersForRecruitmentPost(
      [player({ uid: 'p1' }), player({ uid: 'p2', display_name: 'Autre' })],
      post,
      ['p1']
    );
    expect(ranked.every((m) => m.player.uid !== 'p1')).toBe(true);
  });
});
