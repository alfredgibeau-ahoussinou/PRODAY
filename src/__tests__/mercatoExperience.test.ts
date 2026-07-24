import { getMercatoExperienceConfig } from '../content/mercatoExperience';

describe('getMercatoExperienceConfig', () => {
  it('adapte le hero pour joueur homme legacy (→ opportunités pro)', () => {
    const cfg = getMercatoExperienceConfig('homme', 'player', 'men');
    expect(cfg.heroTitle).toContain('Opportunités');
    expect(cfg.screenTitle).toBe('Candidater');
    expect(cfg.showFavoritesHeader).toBe(true);
    expect(cfg.showFavoritesRow).toBe(false);
    expect(cfg.showDetectionsHeader).toBe(false);
  });

  it('adapte le hero et les tuiles pour Mercato F', () => {
    const cfg = getMercatoExperienceConfig('woman', 'player', 'women');
    expect(cfg.heroTitle).toBe('Mercato F');
    expect(cfg.screenTitle).toBe('Mercato F');
    expect(cfg.playersStatLabel).toBe('Joueuses');
    expect(cfg.quickTiles.find((t) => t.id === 'players')?.title).toBe('Joueuses');
  });

  it('utilise le segment féminin sur Amateur', () => {
    const cfg = getMercatoExperienceConfig('amateur', 'player', 'women', undefined, 'female');
    expect(cfg.heroTitle).toBe('Mercato F');
    expect(cfg.screenTitle).toBe('Mercato F');
    expect(cfg.playersStatLabel).toBe('Joueuses');
  });

  it('adapte le hero pour staff pro', () => {
    const cfg = getMercatoExperienceConfig('pro', 'recruiter', 'men');
    expect(cfg.heroTitle).toBe('Mercato Pro');
    expect(cfg.showDetectionsHeader).toBe(true);
    expect(cfg.showFavoritesHeader).toBe(false);
  });

  it('expose les 4 raccourcis Mercato', () => {
    const cfg = getMercatoExperienceConfig('homme', 'coach', 'men');
    expect(cfg.quickTiles.map((t) => t.id)).toEqual([
      'players',
      'clubs',
      'detections',
      'stages',
    ]);
  });
});
