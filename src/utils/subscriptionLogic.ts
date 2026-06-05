import type { SubscriptionFeatureId, SubscriptionPlanId, SubscriptionTier } from '../content/subscriptionPlans';
import {
  getPlanDefinition,
  planIdForRole,
  ROLES_WITHOUT_STORE_PLAN,
} from '../content/subscriptionPlans';
import type { UserRole } from '../models/User';
import type { SubscriptionUsagePeriod } from '../models/Subscription';

export interface FeatureCheckResult {
  allowed: boolean;
  tier: SubscriptionTier;
  planId: SubscriptionPlanId | null;
  feature: SubscriptionFeatureId;
  used?: number;
  limit?: number;
  message?: string;
}

/** Période de quota : mois calendaire UTC (YYYY-MM). */
export function currentUsagePeriod(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function subscriptionFromUserFields(data: {
  subscription_tier?: string;
  subscription_plan_id?: string;
  subscription_status?: string;
  subscription_period_end?: Date;
}): { tier: SubscriptionTier; plan_id?: SubscriptionPlanId; status?: string; period_end?: Date } {
  const tier =
    data.subscription_tier === 'pro' ? 'pro' : ('free' as SubscriptionTier);
  return {
    tier,
    plan_id: data.subscription_plan_id as SubscriptionPlanId | undefined,
    status: data.subscription_status,
    period_end: data.subscription_period_end,
  };
}

export function isProTier(tier: SubscriptionTier): boolean {
  return tier === 'pro';
}

export function resolvePlanId(role: UserRole, tier: SubscriptionTier, planId?: SubscriptionPlanId): SubscriptionPlanId | null {
  if (ROLES_WITHOUT_STORE_PLAN.includes(role)) return null;
  if (tier === 'pro' && planId) return planId;
  return planIdForRole(role);
}

export function checkFeatureAccess(input: {
  role: UserRole;
  tier: SubscriptionTier;
  planId?: SubscriptionPlanId;
  feature: SubscriptionFeatureId;
  usage: SubscriptionUsagePeriod;
  activeOpenPosts?: number;
  clubTeams?: number;
}): FeatureCheckResult {
  const { role, tier, feature, usage } = input;
  const planId = resolvePlanId(role, tier, input.planId);

  if (ROLES_WITHOUT_STORE_PLAN.includes(role) || isProTier(tier)) {
    return { allowed: true, tier, planId, feature };
  }

  if (!planId) {
    return { allowed: true, tier, planId: null, feature };
  }

  const plan = getPlanDefinition(planId);
  const limits = plan.limits;

  switch (feature) {
    case 'mercato_apply': {
      const limit = limits.mercato_apply_per_month ?? Infinity;
      const used = usage.mercato_applications;
      if (used >= limit) {
        return {
          allowed: false,
          tier,
          planId,
          feature,
          used,
          limit,
          message: `Limite gratuite : ${limit} candidature Mercato par mois. Passez à ${plan.label} pour continuer.`,
        };
      }
      return { allowed: true, tier, planId, feature, used, limit };
    }
    case 'recruitment_message': {
      const limit = limits.recruitment_messages_per_month ?? Infinity;
      const used = usage.recruitment_messages;
      if (used >= limit) {
        return {
          allowed: false,
          tier,
          planId,
          feature,
          used,
          limit,
          message: `Limite gratuite : ${limit} messages recrutement par mois. Passez à ${plan.label}.`,
        };
      }
      return { allowed: true, tier, planId, feature, used, limit };
    }
    case 'club_active_post': {
      const limit = limits.club_active_posts ?? Infinity;
      const used = input.activeOpenPosts ?? 0;
      if (used >= limit) {
        return {
          allowed: false,
          tier,
          planId,
          feature,
          used,
          limit,
          message: `Limite gratuite : ${limit} annonces actives. Passez à ${plan.label} pour en publier davantage.`,
        };
      }
      return { allowed: true, tier, planId, feature, used, limit };
    }
    case 'club_team': {
      const limit = limits.club_teams ?? Infinity;
      const used = input.clubTeams ?? 1;
      if (used >= limit) {
        return {
          allowed: false,
          tier,
          planId,
          feature,
          used,
          limit,
          message: `Limite gratuite : ${limit} équipe. Passez à ${plan.label} pour le multi-équipes.`,
        };
      }
      return { allowed: true, tier, planId, feature, used, limit };
    }
    default:
      return { allowed: true, tier, planId, feature };
  }
}

export function emptyUsagePeriod(period = currentUsagePeriod()): SubscriptionUsagePeriod {
  return {
    period,
    mercato_applications: 0,
    recruitment_messages: 0,
  };
}

export function usageFieldForFeature(
  feature: SubscriptionFeatureId
): keyof Pick<SubscriptionUsagePeriod, 'mercato_applications' | 'recruitment_messages'> | null {
  if (feature === 'mercato_apply') return 'mercato_applications';
  if (feature === 'recruitment_message') return 'recruitment_messages';
  return null;
}
