import { resolveGuestAuthIntentAfterUniverse } from '../components/branding/intro/universeEntryAuth';
import { UNIVERSE_ENTRY_ACCENT } from '../components/branding/intro/universeEntryAuth';
import { gradientsForCarouselPole } from '../theme/universeGradients';

describe('universe entry auth gate', () => {
  it('ouvre le teaser signup (créer / se connecter) après Entrer dans joueur', () => {
    expect(
      resolveGuestAuthIntentAfterUniverse({
        pole: 'joueur',
        hasProfile: false,
        isPlatformAdmin: false,
      })
    ).toBe('signup');
  });

  it('ouvre le teaser signup pour club / coach / parent', () => {
    for (const pole of ['pro_club', 'coach', 'parent', 'supporter', 'sponsor'] as const) {
      expect(
        resolveGuestAuthIntentAfterUniverse({
          pole,
          hasProfile: false,
          isPlatformAdmin: false,
        })
      ).toBe('signup');
    }
  });

  it('ne force pas l’auth si déjà connecté', () => {
    expect(
      resolveGuestAuthIntentAfterUniverse({
        pole: 'joueur',
        hasProfile: true,
        isPlatformAdmin: false,
      })
    ).toBeNull();
  });

  it('admin non VIP → login, admin VIP → rien', () => {
    expect(
      resolveGuestAuthIntentAfterUniverse({
        pole: 'admin',
        hasProfile: false,
        isPlatformAdmin: false,
      })
    ).toBe('login');
    expect(
      resolveGuestAuthIntentAfterUniverse({
        pole: 'admin',
        hasProfile: false,
        isPlatformAdmin: true,
      })
    ).toBeNull();
  });

  it('aligne le CTA joueur sur l’émeraude club', () => {
    expect(UNIVERSE_ENTRY_ACCENT).toBe('#10B981');
    expect(gradientsForCarouselPole('joueur').cta[1]).toBe('#10B981');
    expect(gradientsForCarouselPole('pro_club').cta[1]).toBe('#10B981');
  });
});
