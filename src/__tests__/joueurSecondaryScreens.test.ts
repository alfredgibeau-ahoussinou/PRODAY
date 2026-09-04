import { PLAYER_DARK } from '../theme/playerDarkPremium';
import { JOUEUR_DISCOVER, JOUEUR_REELS, JOUEUR_SURFACES } from '../theme/joueurDesignSystem';

/** Passe 2 — écrans joueur secondaires : palette dark premium unifiée. */
describe('joueurSecondaryScreens palette', () => {
  it('surfaces messages / mercato / shop alignées PLAYER_DARK', () => {
    expect(JOUEUR_SURFACES.card).toBe(PLAYER_DARK.surface);
    expect(JOUEUR_SURFACES.chipActive).toBe(PLAYER_DARK.accentSoft);
    expect(JOUEUR_SURFACES.listRow).toBe(PLAYER_DARK.bgElevated);
  });

  it('reels et discover invité mint sur fond #000000', () => {
    expect(JOUEUR_REELS.stage).toBe('#000000');
    expect(JOUEUR_REELS.accent).toBe('#00E676');
    expect(JOUEUR_DISCOVER.heroBg).toBe('#1A1A24');
  });

  it('aucun token secondaire joueur blanc plat', () => {
    const tokens = [
      JOUEUR_SURFACES.card,
      JOUEUR_SURFACES.listRow,
      JOUEUR_DISCOVER.heroBg,
      JOUEUR_DISCOVER.tileBg,
    ];
    for (const t of tokens) {
      expect(t.toLowerCase()).not.toBe('#ffffff');
      expect(t.toLowerCase()).not.toBe('#fff');
    }
  });
});
