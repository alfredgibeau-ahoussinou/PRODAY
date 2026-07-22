import {
  SPONSOR_DISCOVERY_ACTIVE_OFFERS,
  SPONSOR_DISCOVERY_MESSAGE_LIMIT,
  SPONSOR_TERRITORIAL_ACTIVE_OFFERS,
  sponsorActiveOfferLimit,
  sponsorHasUnlimitedMessaging,
  sponsorMessageLimit,
  resolveSponsorTierStatus,
} from '../utils/sponsorPlanLimits';

describe('sponsorPlanLimits', () => {
  const discoverySponsor = {
    role: 'sponsor' as const,
    subscription_tier: 'free' as const,
    sponsor_tier: 'starter' as const,
    sponsor_approved: true,
    verification_status: 'VERIFIED' as const,
  };

  it('limite Découverte à 10 messages et 1 offre', () => {
    expect(sponsorMessageLimit(discoverySponsor)).toBe(SPONSOR_DISCOVERY_MESSAGE_LIMIT);
    expect(sponsorActiveOfferLimit(discoverySponsor)).toBe(SPONSOR_DISCOVERY_ACTIVE_OFFERS);
    expect(sponsorHasUnlimitedMessaging(discoverySponsor)).toBe(false);
  });

  it('Territorial : messagerie illimitée, 5 offres', () => {
    const user = { ...discoverySponsor, sponsor_tier: 'territorial' as const };
    expect(sponsorHasUnlimitedMessaging(user)).toBe(true);
    expect(sponsorActiveOfferLimit(user)).toBe(SPONSOR_TERRITORIAL_ACTIVE_OFFERS);
  });

  it('National Pro : offres et messages illimités', () => {
    const user = { ...discoverySponsor, subscription_tier: 'pro' as const };
    expect(sponsorHasUnlimitedMessaging(user)).toBe(true);
    expect(sponsorActiveOfferLimit(user)).toBe(Infinity);
  });

  it('affiche le statut en attente si non approuvé', () => {
    const status = resolveSponsorTierStatus({ ...discoverySponsor, sponsor_approved: false });
    expect(status.tone).toBe('pending');
    expect(status.label).toMatch(/cours/i);
  });
});
