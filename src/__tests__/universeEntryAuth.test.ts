import {
  resolveGuestAuthIntentAfterUniverse,
  resolvePoleAuthPalette,
  resolveUniverseCtaAccent,
} from '../components/branding/intro/universeEntryAuth';
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

  it('palette auth = accent du pôle (pas vert Club partout)', () => {
    expect(resolvePoleAuthPalette({ pole: 'joueur' }).accent).toBe('#FFFFFF');
    expect(resolvePoleAuthPalette({ pole: 'coach' }).accent).toBe('#C5A059');
    expect(resolvePoleAuthPalette({ pole: 'pro_club' }).accent).toBe('#10B981');
    expect(resolvePoleAuthPalette({ pole: 'parent' }).accent).toBe('#8CC63F');
    expect(resolvePoleAuthPalette({ pole: 'sponsor' }).accent).toBe('#92278F');
    expect(resolveUniverseCtaAccent('joueur')).toBe('#C5A059');
    expect(resolveUniverseCtaAccent('pro_club')).toBe('#10B981');
    expect(gradientsForCarouselPole('joueur').cta[1]).toBe('#FFFFFF');
    expect(gradientsForCarouselPole('pro_club').cta[1]).toBe('#10B981');
  });
});
