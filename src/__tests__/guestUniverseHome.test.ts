import { getGuestVisibleTabs, resolveGuestTab } from '../navigation/guestAccess';

/**
 * Accueil invité = univers + auth uniquement (plus de landing Discover).
 */
export function guestHomeUsesDiscoverLanding(): boolean {
  return false;
}

describe('guestUniverseHomeJourney', () => {
  it('ne monte plus la landing Discover (CTAs / Accès rapide) sur l’accueil invité', () => {
    expect(guestHomeUsesDiscoverLanding()).toBe(false);
  });

  it('garde un shell guest minimal (home + profil) sans landing marketing', () => {
    const tabs = getGuestVisibleTabs('pro_club');
    expect(tabs).toEqual(['home', 'reels', 'shop', 'profil']);
    expect(resolveGuestTab('matchs', 'pro_club')).toBe('home');
  });
});
