import {
  getGuestVisibleTabs,
  isGuestTabAllowed,
  resolveGuestTab,
} from '../navigation/guestAccess';

describe('guestAccess', () => {
  it('expose les onglets invité par univers', () => {
    expect(getGuestVisibleTabs('amateur')).toEqual(['home', 'reels', 'shop', 'profil']);
    expect(getGuestVisibleTabs('supporter')).toEqual([
      'home',
      'matchs',
      'feed',
      'plus',
      'reels',
      'profil',
    ]);
    expect(getGuestVisibleTabs('sante')).toEqual(['home', 'reels', 'profil']);
  });

  it('redirige les onglets réservés', () => {
    expect(resolveGuestTab('covoiturage', 'amateur')).toBe('profil');
    expect(resolveGuestTab('messages', 'supporter')).toBe('matchs');
    expect(isGuestTabAllowed('shop', 'amateur')).toBe(true);
    expect(isGuestTabAllowed('reels', 'sante')).toBe(true);
  });
});
