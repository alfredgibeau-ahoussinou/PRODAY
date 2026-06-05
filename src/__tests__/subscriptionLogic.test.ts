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
      usage: { period: '2026-06', mercato_applications: 99, recruitment_messages: 0 },
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
      usage: { period: '2026-06', mercato_applications: 50, recruitment_messages: 0 },
    });
    expect(result.allowed).toBe(true);
  });
});
