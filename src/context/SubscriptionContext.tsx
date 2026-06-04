import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { User } from '../models/User';
import type { SubscriptionFeatureId } from '../content/subscriptionPlans';
import type { SubscriptionUsagePeriod, UserSubscription } from '../models/Subscription';
import type { FeatureCheckResult } from '../utils/subscriptionLogic';
import { subscriptionService } from '../services/subscription.service';

interface SubscriptionContextValue {
  subscription: UserSubscription | null;
  usage: SubscriptionUsagePeriod | null;
  loading: boolean;
  refresh: () => Promise<void>;
  checkFeature: (feature: SubscriptionFeatureId) => Promise<FeatureCheckResult>;
  openUpgradeForFeature: (feature: SubscriptionFeatureId) => void;
  upgradeFeature: SubscriptionFeatureId | null;
  clearUpgradePrompt: () => void;
  showPlansScreen: boolean;
  openPlansScreen: () => void;
  closePlansScreen: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export const SubscriptionProvider: React.FC<{
  profile: User | null;
  children: React.ReactNode;
}> = ({ profile, children }) => {
  const [usage, setUsage] = useState<SubscriptionUsagePeriod | null>(null);
  const [loading, setLoading] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<SubscriptionFeatureId | null>(null);
  const [showPlansScreen, setShowPlansScreen] = useState(false);

  const subscription = useMemo(
    () => (profile ? subscriptionService.getSubscription(profile) : null),
    [profile]
  );

  const refresh = useCallback(async () => {
    if (!profile?.uid) {
      setUsage(null);
      return;
    }
    setLoading(true);
    try {
      setUsage(await subscriptionService.loadUsage(profile.uid));
    } finally {
      setLoading(false);
    }
  }, [profile?.uid]);

  useEffect(() => {
    void refresh();
  }, [refresh, profile?.subscription_tier, profile?.subscription_plan_id]);

  const checkFeature = useCallback(
    async (feature: SubscriptionFeatureId) => {
      if (!profile) {
        return {
          allowed: false,
          tier: 'free' as const,
          planId: null,
          feature,
          message: 'Connexion requise.',
        };
      }
      return subscriptionService.checkFeature(profile, feature, usage ?? undefined);
    },
    [profile, usage]
  );

  const openUpgradeForFeature = useCallback((feature: SubscriptionFeatureId) => {
    setUpgradeFeature(feature);
  }, []);

  const clearUpgradePrompt = useCallback(() => {
    setUpgradeFeature(null);
  }, []);

  const openPlansScreen = useCallback(() => {
    setUpgradeFeature(null);
    setShowPlansScreen(true);
  }, []);

  const closePlansScreen = useCallback(() => {
    setShowPlansScreen(false);
  }, []);

  const value = useMemo(
    () => ({
      subscription,
      usage,
      loading,
      refresh,
      checkFeature,
      openUpgradeForFeature,
      upgradeFeature,
      clearUpgradePrompt,
      showPlansScreen,
      openPlansScreen,
      closePlansScreen,
    }),
    [
      subscription,
      usage,
      loading,
      refresh,
      checkFeature,
      openUpgradeForFeature,
      upgradeFeature,
      clearUpgradePrompt,
      showPlansScreen,
      openPlansScreen,
      closePlansScreen,
    ]
  );

  return (
    <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
  );
};

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error('useSubscription doit être utilisé dans SubscriptionProvider');
  }
  return ctx;
}

/** Invité ou hors provider : pas de garde abonnement. */
export function useSubscriptionOptional(): SubscriptionContextValue | null {
  return useContext(SubscriptionContext);
}
