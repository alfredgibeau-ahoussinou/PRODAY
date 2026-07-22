import {
  checkFeatureAccess,
  currentUsagePeriod,
  emptyUsagePeriod,
} from '../utils/subscriptionLogic';

describe('subscriptionLogic', () => {
  it('formate la période mensuelle', () => {
    expect(currentUsagePeriod(new Date('2026-06-15T12:00:00Z'))).toBe('2026-06');
  });

  it('autorise un joueur pro sans limite', () => {
    const result = checkFeatureAccess({
      role: 'player',
      tier: 'pro',
      planId: 'player_plus',
      feature: 'mercato_apply',
      usage: { period: '2026-06', mercato_applications: 99, recruitment_messages: 0, sponsor_club_messages: 0 },
    });
    expect(result.allowed).toBe(true);
  });

  it('bloque la 2e candidature joueur gratuit', () => {
    const usage = emptyUsagePeriod('2026-06');
    usage.mercato_applications = 1;
    const result = checkFeatureAccess({
      role: 'player',
      tier: 'free',
      feature: 'mercato_apply',
      usage,
    });
    expect(result.allowed).toBe(false);
    expect(result.message).toMatch(/1 candidature/i);
  });

  it('bloque une 3e annonce club gratuite', () => {
    const result = checkFeatureAccess({
      role: 'club',
      tier: 'free',
      feature: 'club_active_post',
      usage: emptyUsagePeriod(),
      activeOpenPosts: 2,
    });
    expect(result.allowed).toBe(false);
    expect(result.limit).toBe(2);
  });

  it('laisse l’organisateur sans quota store', () => {
    const result = checkFeatureAccess({
      role: 'organizer',
      tier: 'free',
      feature: 'mercato_apply',
      usage: { period: '2026-06', mercato_applications: 50, recruitment_messages: 0, sponsor_club_messages: 0 },
    });
    expect(result.allowed).toBe(true);
  });

  it('autorise le supporter sans quota ni abonnement', () => {
    const result = checkFeatureAccess({
      role: 'supporter',
      tier: 'free',
      feature: 'mercato_apply',
      usage: { period: '2026-06', mercato_applications: 50, recruitment_messages: 0, sponsor_club_messages: 0 },
    });
    expect(result.allowed).toBe(true);
    expect(result.planId).toBeNull();
  });

  it('bloque le 11e message club sponsor Découverte', () => {
    const usage = emptyUsagePeriod('2026-06');
    usage.sponsor_club_messages = 10;
    const result = checkFeatureAccess({
      role: 'sponsor',
      tier: 'free',
      planId: 'sponsor_pro',
      feature: 'sponsor_club_message',
      usage,
    });
    expect(result.allowed).toBe(false);
    expect(result.limit).toBe(10);
  });

  it('autorise messagerie illimitée pour sponsor Territorial', () => {
    const usage = emptyUsagePeriod('2026-06');
    usage.sponsor_club_messages = 99;
    const result = checkFeatureAccess({
      role: 'sponsor',
      tier: 'free',
      planId: 'sponsor_pro',
      feature: 'sponsor_club_message',
      usage,
      sponsorUnlimitedMessaging: true,
    });
    expect(result.allowed).toBe(true);
  });

  it('bloque une 2e offre active sponsor Découverte', () => {
    const result = checkFeatureAccess({
      role: 'sponsor',
      tier: 'free',
      planId: 'sponsor_pro',
      feature: 'sponsor_active_offer',
      usage: emptyUsagePeriod('2026-06'),
      activeSponsorOffers: 1,
      sponsorActiveOfferLimit: 1,
    });
    expect(result.allowed).toBe(false);
    expect(result.limit).toBe(1);
  });
});
