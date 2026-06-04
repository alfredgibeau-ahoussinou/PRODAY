import type { SubscriptionPlanId, SubscriptionTier } from '../content/subscriptionPlans';

export type SubscriptionStatus = 'active' | 'trialing' | 'canceled' | 'past_due';

export interface UserSubscription {
  tier: SubscriptionTier;
  plan_id?: SubscriptionPlanId;
  status?: SubscriptionStatus;
  period_end?: Date;
}

export interface SubscriptionUsagePeriod {
  period: string;
  mercato_applications: number;
  recruitment_messages: number;
}
