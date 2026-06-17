import { filterSeedsByTheme, seedMatchesTheme } from '../content/reelThemes';
import type { ReelSeed } from '../content/reelSeedCatalog';

const baseSeed = (overrides: Partial<ReelSeed> = {}): ReelSeed => ({
  source: 'proday',
  externalId: 'abc123',
  authorHandle: 'uid',
  authorName: 'Joueur ProDay',
  tags: ['#proday', '#highlight'],
  ...overrides,
});

describe('reelThemes', () => {
  it('filtre par thème explicite ou tags', () => {
    const skills = baseSeed({ themes: ['skills'], tags: ['#proday'] });
    const motivation = baseSeed({ externalId: 'm1', themes: ['motivation'] });
    const nutrition = baseSeed({ externalId: 'n1', tags: ['#recovery', '#stretch'] });

    expect(seedMatchesTheme(skills, 'skills')).toBe(true);
    expect(seedMatchesTheme(motivation, 'motivation')).toBe(true);
    expect(seedMatchesTheme(nutrition, 'nutrition')).toBe(true);
    expect(seedMatchesTheme(skills, 'nutrition')).toBe(false);
  });

  it('retourne tous les seeds si aucun ne correspond', () => {
    const seeds = [baseSeed({ tags: ['#proday'] })];
    expect(filterSeedsByTheme(seeds, 'nutrition')).toEqual(seeds);
  });
});
