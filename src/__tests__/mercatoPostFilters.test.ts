import {
  filterRecruitmentPostsByScope,
  isProRecruitmentLevel,
  resolveMercatoPostScope,
} from '../utils/mercatoPostFilters';

describe('mercatoPostFilters', () => {
  const proPost = {
    id: '1',
    club_id: 'c1',
    club_name: 'Club Pro',
    title: 'Essai',
    position: 'ATT',
    category: 'Senior',
    level: 'R1',
    city: 'Paris',
    description: '',
    created_at: new Date(),
    status: 'OPEN' as const,
  };

  const amateurPost = { ...proPost, id: '2', level: 'R3', club_name: 'Club Amateur' };

  it('détecte les niveaux pro', () => {
    expect(isProRecruitmentLevel('R1')).toBe(true);
    expect(isProRecruitmentLevel('N2')).toBe(true);
    expect(isProRecruitmentLevel('R3')).toBe(false);
  });

  it('filtre les annonces pro joueur', () => {
    const filtered = filterRecruitmentPostsByScope([proPost, amateurPost], 'pro');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].level).toBe('R1');
  });

  it('filtre les annonces amateur', () => {
    const filtered = filterRecruitmentPostsByScope([proPost, amateurPost], 'amateur');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].level).toBe('R3');
  });

  it('résout le scope par pôle', () => {
    expect(resolveMercatoPostScope('pro_player')).toBe('pro');
    expect(resolveMercatoPostScope('amateur')).toBe('amateur');
    expect(resolveMercatoPostScope('supporter')).toBe('all');
  });
});
