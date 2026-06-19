import { isTerritorialSponsorActive, resolveSponsorPricingTier } from '../utils/sponsorTier';
import type { User } from '../models/User';

describe('sponsorTier', () => {
  const sponsorBase: Pick<User, 'role' | 'sponsor_tier' | 'subscription_tier'> = {
    role: 'sponsor',
    sponsor_tier: undefined,
    subscription_tier: undefined,
  };

  it('détecte Territorial actif via sponsor_tier', () => {
    expect(isTerritorialSponsorActive({ ...sponsorBase, sponsor_tier: 'territorial' })).toBe(true);
    expect(isTerritorialSponsorActive({ ...sponsorBase, sponsor_tier: 'starter' })).toBe(false);
    expect(isTerritorialSponsorActive({ role: 'player', sponsor_tier: 'territorial' })).toBe(false);
  });

  it('résout la formule sponsor affichée', () => {
    expect(resolveSponsorPricingTier({ ...sponsorBase, subscription_tier: 'pro' })).toBe('national');
    expect(resolveSponsorPricingTier({ ...sponsorBase, sponsor_tier: 'territorial' })).toBe(
      'territorial',
    );
    expect(resolveSponsorPricingTier(sponsorBase)).toBe('starter');
  });
});
