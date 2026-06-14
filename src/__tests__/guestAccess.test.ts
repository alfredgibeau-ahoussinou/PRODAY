import {
  getGuestVisibleTabs,
  isGuestTabAllowed,
  resolveGuestTab,
} from '../navigation/guestAccess';

describe('guestAccess', () => {
  it('expose les onglets invité par univers', () => {
    expect(getGuestVisibleTabs('homme')).toEqual(['home', 'reels', 'profil', 'shop']);
    expect(getGuestVisibleTabs('sante')).toEqual(['home', 'profil', 'shop']);
  });

  it('redirige les onglets réservés vers le profil', () => {
    expect(resolveGuestTab('covoiturage', 'homme')).toBe('profil');
    expect(resolveGuestTab('messages', 'homme')).toBe('profil');
    expect(isGuestTabAllowed('shop', 'homme')).toBe(true);
    expect(isGuestTabAllowed('reels', 'sante')).toBe(false);
  });
});
