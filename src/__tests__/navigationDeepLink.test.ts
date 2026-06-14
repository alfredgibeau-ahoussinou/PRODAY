import type { MercatoDeepLink } from '../utils/navigationDeepLink';

describe('navigationDeepLink', () => {
  it('accepte un deep link mercato accueil', () => {
    const view: MercatoDeepLink = 'home';
    expect(view).toBe('home');
  });
});
