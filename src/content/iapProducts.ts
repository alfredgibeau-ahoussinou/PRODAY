import type { SubscriptionPlanId } from './subscriptionPlans';

export type IapBillingCycle = 'monthly' | 'yearly';

/** SKU App Store / Play Console — alignés sur `com.proday.app`. */
export const IAP_SKUS: Partial<
  Record<SubscriptionPlanId, Record<IapBillingCycle, string>>
> = {
  club_pro: {
    monthly: 'com.proday.app.club_pro.monthly',
    yearly: 'com.proday.app.club_pro.yearly',
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
