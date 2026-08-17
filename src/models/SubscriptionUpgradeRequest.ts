import type { SubscriptionPlanId } from '../content/subscriptionPlans';
import type { UserRole } from './User';

export type SubscriptionUpgradeRequestStatus = 'pending' | 'approved' | 'rejected';

export interface SubscriptionUpgradeRequest {
  id: string;
  user_uid: string;
  plan_id: SubscriptionPlanId;
  role: UserRole;
  display_name: string;
  email: string;
  billing: 'monthly' | 'yearly';
  status: SubscriptionUpgradeRequestStatus;
  message?: string;
  admin_note?: string;
  created_at: Date;
  approved_at?: Date;
  rejected_at?: Date;
  updated_at?: Date;
}
