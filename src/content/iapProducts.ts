import type { SubscriptionPlanId } from './subscriptionPlans';

export type IapBillingCycle = 'monthly' | 'yearly';

/** SKU App Store / Play Console — alignés sur `com.proday.app`. */
export const IAP_SKUS: Partial<
  Record<SubscriptionPlanId, Record<IapBillingCycle, string>>
> = {
  player_plus: {
    monthly: 'com.proday.app.player_plus.monthly',
    yearly: 'com.proday.app.player_plus.yearly',
  },
  recruiter_pro: {
    monthly: 'com.proday.app.recruiter_pro.monthly',
    yearly: 'com.proday.app.recruiter_pro.yearly',
  },
  coach_pro: {
    monthly: 'com.proday.app.coach_pro.monthly',
    yearly: 'com.proday.app.coach_pro.yearly',
  },
  club_pro: {
    monthly: 'com.proday.app.club_pro.monthly',
    yearly: 'com.proday.app.club_pro.yearly',
  },
  agent_elite: {
    monthly: 'com.proday.app.agent_elite.monthly',
    yearly: 'com.proday.app.agent_elite.yearly',
  },
  physio_pro: {
    monthly: 'com.proday.app.physio_pro.monthly',
    yearly: 'com.proday.app.physio_pro.yearly',
  },
  organizer_pro: {
    monthly: 'com.proday.app.organizer_pro.monthly',
    yearly: 'com.proday.app.organizer_pro.yearly',
  },
  sponsor_pro: {
    monthly: 'com.proday.app.sponsor_pro.monthly',
    yearly: 'com.proday.app.sponsor_pro.yearly',
  },
};

const ALL_SKUS = new Set(
  Object.values(IAP_SKUS).flatMap((cycles) => (cycles ? Object.values(cycles) : []))
);

export function getIapSku(
  planId: SubscriptionPlanId,
  billing: IapBillingCycle
): string | null {
  return IAP_SKUS[planId]?.[billing] ?? null;
}

export function planIdForIapSku(productId: string): SubscriptionPlanId | null {
  for (const [planId, cycles] of Object.entries(IAP_SKUS) as [
    SubscriptionPlanId,
    Record<IapBillingCycle, string>,
  ][]) {
    if (cycles && Object.values(cycles).includes(productId)) return planId;
  }
  return null;
}

export function isKnownIapSku(productId: string): boolean {
  return ALL_SKUS.has(productId);
}
