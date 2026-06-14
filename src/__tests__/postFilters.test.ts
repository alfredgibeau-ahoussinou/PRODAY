import { filterRecruitmentPosts, postMatchesTextSearch } from '../utils/postFilters';
import type { RecruitmentPost } from '../models/Player';

const sample: RecruitmentPost = {
  id: '1',
  club_id: 'c1',
  club_name: 'FC Test',
  title: 'Recherche attaquant',
  position: 'Attaquant',
  category: 'Seniors',
  level: 'R1',
  city: 'Lyon',
  description: '',
  created_at: new Date(),
  status: 'OPEN',
};

describe('postFilters', () => {
  it('filtre par poste et niveau', () => {
    const out = filterRecruitmentPosts([sample], {
      position: 'fwd',
      level: 'R1',
      category: 'all',
      city: '',
    });
    expect(out).toHaveLength(1);
  });

  it('recherche texte inclut le niveau', () => {
    expect(postMatchesTextSearch(sample, 'r1')).toBe(true);
    expect(postMatchesTextSearch(sample, 'marseille')).toBe(false);
  });
});
