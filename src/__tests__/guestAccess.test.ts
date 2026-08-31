import {
  getGuestVisibleTabs,
  isGuestTabAllowed,
  resolveGuestTab,
} from '../navigation/guestAccess';

describe('guestAccess', () => {
  it('expose les onglets invité par univers', () => {
    expect(getGuestVisibleTabs('amateur')).toEqual(['home', 'reels', 'shop', 'profil']);
    expect(getGuestVisibleTabs('supporter')).toEqual(['home', 'reels', 'shop', 'profil']);
    expect(getGuestVisibleTabs('sante')).toEqual(['home', 'reels', 'profil']);
  });

  it('redirige les onglets réservés vers l’accueil', () => {
    expect(resolveGuestTab('covoiturage', 'amateur')).toBe('home');
    expect(resolveGuestTab('messages', 'supporter')).toBe('home');
    expect(isGuestTabAllowed('shop', 'amateur')).toBe(true);
    expect(isGuestTabAllowed('reels', 'sante')).toBe(true);
  });
});
