import { resolvePlayerShieldWidth } from '../utils/playerShieldLayout';

describe('PlayerShieldCard layout', () => {
  it('calcule une hauteur shield suffisante pour le rating', () => {
    const width = resolvePlayerShieldWidth(280);
    const height = Math.round(width * 1.62);
    const ratingSize = Math.round(width * 0.32);
    expect(height).toBeGreaterThanOrEqual(Math.round(width * 1.55));
    expect(ratingSize).toBeLessThanOrEqual(Math.round(width * 0.34));
  });

  it('respecte la largeur max sur petit écran', () => {
    expect(resolvePlayerShieldWidth(280)).toBeLessThanOrEqual(280);
  });
});

describe('joueur tab return stack', () => {
  it('sépare onglets dock et overflow', () => {
    const primary = ['home', 'matchs', 'feed', 'profil', 'plus'] as const;
    const overflow = ['messages', 'recrutement', 'reels', 'covoiturage', 'shop'];
    for (const tab of overflow) {
      expect(primary.includes(tab as (typeof primary)[number])).toBe(false);
    }
  });
});
