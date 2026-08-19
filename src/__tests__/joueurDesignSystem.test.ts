import { JOUEUR_CARPOOL, JOUEUR_REELS, JOUEUR_DISCOVER, JOUEUR_SURFACES } from '../theme/joueurDesignSystem';

describe('joueurDesignSystem', () => {
  it('expose les tokens covoiturage joueur sombres', () => {
    expect(JOUEUR_CARPOOL.sky).toBe('#070b14');
    expect(JOUEUR_CARPOOL.surface).not.toMatch(/#fff/i);
    expect(JOUEUR_CARPOOL.ink).toBeTruthy();
  });

  it('surfaces joueur jamais blanc plat', () => {
    expect(JOUEUR_SURFACES.card).toContain('rgba');
    expect(JOUEUR_SURFACES.listRow).toContain('rgba');
  });

  it('tokens reels et discover FUT18 sombres', () => {
    expect(JOUEUR_REELS.stage).toBe('#070B14');
    expect(JOUEUR_REELS.accent).toBeTruthy();
    expect(JOUEUR_DISCOVER.heroBg).toContain('rgba');
    expect(JOUEUR_DISCOVER.tileBg).toContain('rgba');
  });
});
