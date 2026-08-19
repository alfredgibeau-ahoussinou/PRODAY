import { JOUEUR_CARPOOL, JOUEUR_REELS, JOUEUR_DISCOVER, JOUEUR_SURFACES } from '../theme/joueurDesignSystem';
import { PLAYER_DARK } from '../theme/playerDarkPremium';

describe('joueurDesignSystem', () => {
  it('expose les tokens covoiturage joueur sombres', () => {
    expect(JOUEUR_CARPOOL.sky).toBe(PLAYER_DARK.bg);
    expect(JOUEUR_CARPOOL.surface).not.toMatch(/#fff/i);
    expect(JOUEUR_CARPOOL.ink).toBeTruthy();
  });

  it('surfaces joueur jamais blanc plat', () => {
    expect(JOUEUR_SURFACES.card).toBe(PLAYER_DARK.surface);
    expect(JOUEUR_SURFACES.listRow).toBe(PLAYER_DARK.bgElevated);
  });

  it('tokens reels et discover dark premium mint', () => {
    expect(JOUEUR_REELS.stage).toBe(PLAYER_DARK.bg);
    expect(JOUEUR_REELS.accent).toBe(PLAYER_DARK.accent);
    expect(JOUEUR_DISCOVER.heroBg).toBe(PLAYER_DARK.surface);
    expect(JOUEUR_DISCOVER.tileBg).toBe(JOUEUR_SURFACES.card);
  });
});
