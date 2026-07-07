import { getDiscoverHomeCopy, getHomeModules, getHomeDashboardMeta } from '../content/homeExperience';
import {
  getSelectableAppSpaces,
  isAppSpaceAllowedForProductLine,
} from '../utils/appSpaceProductLine';

describe('homeExperience', () => {
  it('sépare les textes invité Homme et Woman', () => {
    const homme = getDiscoverHomeCopy('homme');
    const woman = getDiscoverHomeCopy('woman');

    expect(homme.heroTitle).toMatch(/foot/i);
    expect(homme.heroTitle).not.toMatch(/féminin/i);
    expect(woman.heroTitle).toMatch(/féminin/i);
    expect(woman.playersStatLabel).toBe('Joueuses');
    expect(homme.playersStatLabel).toBe('Joueurs');
  });

  it('adapte les libellés modules selon l’univers', () => {
    const hommeRecrutement = getHomeModules('homme').find((m) => m.id === 'recrutement');
    const womanRecrutement = getHomeModules('woman', 'player').find((m) => m.id === 'recrutement');

    expect(hommeRecrutement?.title).toBe('Mercato Amateur');
    expect(womanRecrutement?.title).toBe('Mercato F');
    expect(womanRecrutement?.subtitle).toMatch(/Annonces clubs/i);
  });

  it('personnalise le dashboard joueuse Woman', () => {
    const meta = getHomeDashboardMeta('player', 'woman');
    expect(meta.eyebrow).toMatch(/JOUEUSE/i);
    expect(meta.tagline.length).toBeGreaterThan(10);
  });

  it('personnalise le dashboard coach Pro', () => {
    const meta = getHomeDashboardMeta('coach', 'pro');
    expect(meta.eyebrow).toMatch(/PRO/i);
  });
});

describe('appSpaceProductLine', () => {
  it('n’expose que les espaces compatibles avec la ligne produit', () => {
    expect(getSelectableAppSpaces('homme')).toEqual(['men', 'boys', 'under_u13']);
    expect(getSelectableAppSpaces('pro')).toEqual(['men', 'boys', 'under_u13']);
    expect(getSelectableAppSpaces('woman')).toEqual(['women', 'girls', 'under_u13']);
  });

  it('refuse les espaces croisés', () => {
    expect(isAppSpaceAllowedForProductLine('men', 'woman')).toBe(false);
    expect(isAppSpaceAllowedForProductLine('women', 'homme')).toBe(false);
    expect(isAppSpaceAllowedForProductLine('women', 'woman')).toBe(true);
    expect(isAppSpaceAllowedForProductLine('under_u13', 'woman')).toBe(true);
    expect(isAppSpaceAllowedForProductLine('under_u13', 'homme')).toBe(true);
    expect(isAppSpaceAllowedForProductLine('men', 'homme')).toBe(true);
    expect(isAppSpaceAllowedForProductLine('men', 'pro')).toBe(true);
  });
});
