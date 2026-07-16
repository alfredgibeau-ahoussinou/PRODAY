import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTabNavigationOptional } from '../context/TabNavigationContext';
import { useSubscriptionOptional } from '../context/SubscriptionContext';
import { useTranslation } from '../context/LocaleContext';
import { isSponsorRole } from '../content/sponsorExperience';
import { type SponsorPricingTier } from '../content/sponsorPricing';
import { subscriptionService } from '../services/subscription.service';
import { sponsorUpgradeService } from '../services/sponsorUpgrade.service';
import type { BillingCycle } from '../components/sponsor/SponsorPricingPanel';

export function useSponsorPricingActions() {
  const { profile } = useAuth();
  const tabNav = useTabNavigationOptional();
  const subscriptionCtx = useSubscriptionOptional();
  const { t } = useTranslation();
  const isSponsor = isSponsorRole(profile?.role);

  const submitTerritorialRequest = useCallback(async () => {
    if (!profile) {
      tabNav?.openAuth('login');
      return;
    }
    if (!isSponsor) {
      Alert.alert(
        t('sponsor.upgrade.territorial.title'),
        t('sponsor.upgrade.loginRequired'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('sponsor.upgrade.loginCta'), onPress: () => tabNav?.openAuth('login') },
        ],
      );
      return;
    }

    const res = await sponsorUpgradeService.submitRequest({
      sponsorUid: profile.uid,
      company: profile.display_name,
      city: profile.city ?? '',
      contactEmail: profile.email,
      contactName: profile.display_name,
      phone: profile.phone,
    });

    Alert.alert(
      t('sponsor.upgrade.territorial.title'),
      t(res.messageKey),
    );
  }, [profile, isSponsor, tabNav, t]);

  const handleSelectTier = useCallback(
    async (tier: SponsorPricingTier, billing: BillingCycle = 'monthly') => {
      if (isSponsor) {
        if (tier.id === 'national' || tier.subscriptionTier === 'pro') {
          if (subscriptionCtx?.subscription?.tier === 'pro') {
            Alert.alert(
              t('sponsor.upgrade.national.title'),
              t('sponsor.upgrade.national.alreadyActive'),
            );
            return;
          }
          const res = await subscriptionService.requestUpgrade('sponsor_pro', billing);
          Alert.alert(
            res.ok ? t('sponsor.upgrade.national.activated') : t('sponsor.upgrade.national.title'),
            res.message,
          );
          if (res.ok) await subscriptionCtx?.refresh();
          return;
        }

        if (tier.id === 'territorial') {
          await submitTerritorialRequest();
          return;
        }

        return;
      }

      if (tier.id === 'territorial') {
        await submitTerritorialRequest();
        return;
      }

      if (tier.id === 'national') {
        tabNav?.openSponsorSignup('pro');
        return;
      }

      tabNav?.openSponsorSignup('free');
    },
    [isSponsor, tabNav, subscriptionCtx, submitTerritorialRequest, t],
  );

  const promptLogin = useCallback(() => tabNav?.openAuth('login'), [tabNav]);

  return { handleSelectTier, promptLogin, isSponsor, profile };
}
