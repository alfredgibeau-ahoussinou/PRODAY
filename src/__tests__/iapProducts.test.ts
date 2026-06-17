import { getIapSku, planIdForIapSku, isKnownIapSku } from '../content/iapProducts';

describe('iapProducts', () => {
  it('mappe club_pro vers les SKU store', () => {
    expect(getIapSku('club_pro', 'monthly')).toBe('com.proday.app.club_pro.monthly');
    expect(getIapSku('club_pro', 'yearly')).toBe('com.proday.app.club_pro.yearly');
    expect(getIapSku('player_plus', 'monthly')).toBeNull();
  });

  it('retrouve le plan depuis un SKU', () => {
    expect(planIdForIapSku('com.proday.app.club_pro.monthly')).toBe('club_pro');
    expect(isKnownIapSku('com.proday.app.club_pro.yearly')).toBe(true);
    expect(isKnownIapSku('unknown.sku')).toBe(false);
  });
});
