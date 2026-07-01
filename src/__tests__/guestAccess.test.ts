import {
  getGuestVisibleTabs,
  isGuestTabAllowed,
  resolveGuestTab,
} from '../navigation/guestAccess';

describe('guestAccess', () => {
  it('expose les onglets invité par univers', () => {
    expect(getGuestVisibleTabs('amateur')).toEqual(['home', 'reels', 'profil']);
    expect(getGuestVisibleTabs('supporter')).toEqual(['matchs', 'feed', 'reels', 'profil']);
    expect(getGuestVisibleTabs('sante')).toEqual(['home', 'profil']);
  });

  it('redirige les onglets réservés', () => {
    expect(resolveGuestTab('covoiturage', 'amateur')).toBe('profil');
    expect(resolveGuestTab('messages', 'supporter')).toBe('matchs');
    expect(isGuestTabAllowed('shop', 'amateur')).toBe(false);
    expect(isGuestTabAllowed('reels', 'sante')).toBe(false);
  });
});
