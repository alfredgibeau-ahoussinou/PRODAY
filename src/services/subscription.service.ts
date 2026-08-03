import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  limit,
  increment,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type { User } from '../models/User';
import type { SubscriptionFeatureId, SubscriptionPlanId } from '../content/subscriptionPlans';
import { getPlanDefinition, getPlanForRole, planIdForRole } from '../content/subscriptionPlans';
import type { ProductLineId } from '../models/ProductLine';
import { getPlanForRoleAndLine } from '../content/subscriptionPlansByLine';
import type { SubscriptionUsagePeriod, UserSubscription } from '../models/Subscription';
import {
  checkFeatureAccess,
  currentUsagePeriod,
  emptyUsagePeriod,
  subscriptionFromUserFields,
  usageFieldForFeature,
} from '../utils/subscriptionLogic';
import {
  sponsorActiveOfferLimit,
  sponsorHasUnlimitedMessaging,
} from '../utils/sponsorPlanLimits';
import { callFunction } from '../lib/firebaseFunctions';
import { resolvePlayerSegment } from '../utils/playerSegment';

const FUNCTIONS_REGION = process.env.EXPO_PUBLIC_FIREBASE_FUNCTIONS_REGION ?? 'europe-west1';

export class SubscriptionLimitError extends Error {
  readonly feature: SubscriptionFeatureId;
  readonly planId: SubscriptionPlanId | null;

  constructor(message: string, feature: SubscriptionFeatureId, planId: SubscriptionPlanId | null) {
    super(message);
    this.name = 'SubscriptionLimitError';
    this.feature = feature;
    this.planId = planId;
  }
}

function userSubscription(user: User): UserSubscription {
  const sub = subscriptionFromUserFields({
    subscription_tier: user.subscription_tier,
    subscription_plan_id: user.subscription_plan_id,
    subscription_status: user.subscription_status,
    subscription_period_end: user.subscription_period_end,
  });
  return {
    tier: sub.tier,
    plan_id: sub.plan_id,
    status: sub.status as UserSubscription['status'],
    period_end: sub.period_end,
  };
}

export const subscriptionService = {
  getSubscription(user: User): UserSubscription {
    return userSubscription(user);
  },

  getPlanForUser(user: User, line: ProductLineId = 'amateur') {
    const segment = resolvePlayerSegment(user, line);
    return getPlanForRoleAndLine(user.role, line, segment) ?? getPlanForRole(user.role);
  },

  async loadUsage(uid: string): Promise<SubscriptionUsagePeriod> {
    if (!isFirebaseConfigured()) return emptyUsagePeriod();
    const database = getDb();
    if (!database) return emptyUsagePeriod();

    const period = currentUsagePeriod();
    try {
      const snap = await getDoc(doc(database, 'users', uid, 'subscription_usage', period));
      if (!snap.exists()) return emptyUsagePeriod(period);
      const data = snap.data();
      return {
        period,
        mercato_applications: Number(data.mercato_applications ?? 0),
        recruitment_messages: Number(data.recruitment_messages ?? 0),
        sponsor_club_messages: Number(data.sponsor_club_messages ?? 0),
      };
    } catch {
      return emptyUsagePeriod(period);
    }
  },

  async countOpenPostsByAuthor(authorUid: string): Promise<number> {
    if (!isFirebaseConfigured()) return 0;
    const database = getDb();
    if (!database) return 0;
    try {
      const q = query(
        collection(database, 'recruitment_posts'),
        where('author_uid', '==', authorUid),
        where('status', '==', 'OPEN'),
        limit(50)
      );
      const snap = await getDocs(q);
      return snap.size;
    } catch {
      return 0;
    }
  },

  async countActiveOffersBySponsor(sponsorUid: string): Promise<number> {
    if (!isFirebaseConfigured()) return 0;
    const database = getDb();
    if (!database) return 0;
    try {
      const q = query(
        collection(database, 'sponsor_offers'),
        where('sponsor_uid', '==', sponsorUid),
        where('active', '==', true),
        limit(20),
      );
      const snap = await getDocs(q);
      return snap.size;
    } catch {
      return 0;
    }
  },

  async checkFeature(
    user: User,
    feature: SubscriptionFeatureId,
    usage?: SubscriptionUsagePeriod,
    options?: { activeSponsorOffers?: number },
  ) {
    const sub = userSubscription(user);
    const periodUsage = usage ?? (await this.loadUsage(user.uid));
    const activeOpenPosts =
      feature === 'club_active_post'
        ? await this.countOpenPostsByAuthor(user.uid)
        : undefined;
    const activeSponsorOffers =
      feature === 'sponsor_active_offer'
        ? (options?.activeSponsorOffers ??
          (user.role === 'sponsor' ? await this.countActiveOffersBySponsor(user.uid) : 0))
        : undefined;

    return checkFeatureAccess({
      role: user.role,
      tier: sub.tier,
      planId: sub.plan_id ?? planIdForRole(user.role) ?? undefined,
      feature,
      usage: periodUsage,
      activeOpenPosts,
      clubTeams: user.profile.club_id ? 1 : 0,
      sponsorUnlimitedMessaging: sponsorHasUnlimitedMessaging(user),
      sponsorActiveOfferLimit: sponsorActiveOfferLimit(user),
      activeSponsorOffers,
    });
  },

  async assertFeature(
    user: User,
    feature: SubscriptionFeatureId,
    usage?: SubscriptionUsagePeriod,
    options?: { activeSponsorOffers?: number },
  ) {
    const result = await this.checkFeature(user, feature, usage, options);
    if (!result.allowed) {
      throw new SubscriptionLimitError(
        result.message ?? 'Limite du plan gratuit atteinte.',
        feature,
        result.planId,
      );
    }
    return result;
  },

  async assertSponsorCanAddActiveOffer(user: User): Promise<void> {
    const count = await this.countActiveOffersBySponsor(user.uid);
    await this.assertFeature(user, 'sponsor_active_offer', undefined, { activeSponsorOffers: count });
  },

  async incrementUsage(uid: string, feature: SubscriptionFeatureId): Promise<void> {
    const field = usageFieldForFeature(feature);
    if (!field || !isFirebaseConfigured()) return;

    try {
      await callFunction<{ feature: SubscriptionFeatureId }, { ok: boolean }>(
        'incrementSubscriptionUsage',
        { feature },
        FUNCTIONS_REGION,
      );
      return;
    } catch {
      // Fallback local (dev / Functions indisponibles)
    }

    const database = getDb();
    if (!database) return;

    const period = currentUsagePeriod();
    const ref = doc(database, 'users', uid, 'subscription_usage', period);
    await setDoc(
      ref,
      {
        period,
        [field]: increment(1),
        updated_at: new Date().toISOString(),
      },
      { merge: true },
    );
  },

  /** Paiement store — RevenueCat (préféré) ou expo-iap ; pas de Stripe Billing. */
  async requestUpgrade(
    planId: SubscriptionPlanId,
    billing: 'monthly' | 'yearly' = 'monthly'
  ): Promise<{ ok: boolean; message: string }> {
    const plan = getPlanDefinition(planId);

    if (plan?.pricing.storeAvailable) {
      const { iapService } = await import('./iap.service');
      if (iapService.isAvailable()) {
        return iapService.purchasePlan(planId, billing);
      }
    }

    if (!plan?.pricing.storeAvailable) {
      return {
        ok: false,
        message:
          'L’abonnement sera disponible très prochainement sur l’App Store et Google Play. En attendant, votre compte gratuit reste actif avec les quotas indiqués.',
      };
    }
    return {
      ok: false,
      message:
        'Installez l’application via TestFlight ou Google Play (build EAS) pour souscrire. Expo Go ne prend pas en charge les achats in-app.',
    };
  },
};
