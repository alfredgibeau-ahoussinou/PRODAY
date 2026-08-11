import { getIapSku, planIdForIapSku, isKnownIapSku, IAP_SKUS } from '../content/iapProducts';
import { SUBSCRIPTION_PLANS, type SubscriptionPlanId } from '../content/subscriptionPlans';

const PAID_PLANS: SubscriptionPlanId[] = [
  'player_plus',
  'recruiter_pro',
  'coach_pro',
  'club_amateur',
  'club_pro',
  'club_premium',
  'agent_elite',
  'physio_pro',
  'organizer_pro',
  'sponsor_pro',
];

describe('iapProducts', () => {
  it('mappe tous les plans payants vers des SKU store', () => {
    for (const planId of PAID_PLANS) {
      expect(getIapSku(planId, 'monthly')).toBe(`com.proday.app.${planId}.monthly`);
      expect(getIapSku(planId, 'yearly')).toBe(`com.proday.app.${planId}.yearly`);
    }
    expect(Object.keys(IAP_SKUS)).toHaveLength(PAID_PLANS.length);
  });

  it('retrouve le plan depuis un SKU', () => {
    expect(planIdForIapSku('com.proday.app.club_pro.monthly')).toBe('club_pro');
    expect(planIdForIapSku('com.proday.app.sponsor_pro.yearly')).toBe('sponsor_pro');
    expect(isKnownIapSku('com.proday.app.player_plus.monthly')).toBe(true);
    expect(isKnownIapSku('unknown.sku')).toBe(false);
  });

  it('aligne storeAvailable sur tous les plans payants', () => {
    for (const planId of PAID_PLANS) {
      expect(SUBSCRIPTION_PLANS[planId].pricing.storeAvailable).toBe(true);
    }
  });

  it('respecte le format SKU com.proday.app.{plan_id}.{cycle}', () => {
    const skuPattern = /^com\.proday\.app\.[a-z_]+\.(monthly|yearly)$/;
    for (const planId of PAID_PLANS) {
      for (const cycle of ['monthly', 'yearly'] as const) {
        const sku = getIapSku(planId, cycle);
        expect(sku).toMatch(skuPattern);
        expect(sku).toBe(`com.proday.app.${planId}.${cycle}`);
      }
    }
  });

  it('inclut sponsor_pro pour National Pro sponsors', () => {
    expect(PAID_PLANS).toContain('sponsor_pro');
    expect(planIdForIapSku('com.proday.app.sponsor_pro.monthly')).toBe('sponsor_pro');
    expect(isKnownIapSku('com.proday.app.sponsor_pro.yearly')).toBe(true);
  });
});
