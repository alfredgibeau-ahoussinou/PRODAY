import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../ui/ScreenHeader';
import { SponsorPricingPanel } from './SponsorPricingPanel';
import { SPONSOR_PRICING_INTRO } from '../../content/sponsorPricing';
import { SPONSOR_THEME } from '../../content/sponsorExperience';
import { useSponsorPricingActions } from '../../hooks/useSponsorPricingActions';
import { useSubscriptionOptional } from '../../context/SubscriptionContext';
import { useTranslation } from '../../context/LocaleContext';
import { sponsorUpgradeService } from '../../services/sponsorUpgrade.service';
import { isTerritorialSponsorActive } from '../../utils/sponsorTier';
import { spacing } from '../../theme/designTokens';

interface SponsorPricingScreenProps {
  onBack?: () => void;
  embedded?: boolean;
  hideIntro?: boolean;
}

/** Tarifs sponsors — mêmes formules que le site (Découverte · Territorial · National Pro). */
export const SponsorPricingScreen: React.FC<SponsorPricingScreenProps> = ({
  onBack,
  embedded = false,
  hideIntro = false,
}) => {
  const { handleSelectTier, promptLogin, isSponsor, profile } = useSponsorPricingActions();
  const subscriptionCtx = useSubscriptionOptional();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(), []);
  const isPro = subscriptionCtx?.subscription?.tier === 'pro';
  const territorialActive = isTerritorialSponsorActive(profile);
  const [territorialApproved, setTerritorialApproved] = useState(false);

  useEffect(() => {
    if (!profile?.uid || !isSponsor || territorialActive) {
      setTerritorialApproved(false);
      return;
    }
    void sponsorUpgradeService.getApprovedTerritorial(profile.uid).then((request) => {
      setTerritorialApproved(!!request);
    });
  }, [profile?.uid, isSponsor, territorialActive]);

  const body = (
    <>
      {!hideIntro ? (
        <View style={styles.intro}>
          <Text style={styles.introTitle}>{SPONSOR_PRICING_INTRO.title}</Text>
          <Text style={styles.introSub}>{SPONSOR_PRICING_INTRO.subtitle}</Text>
        </View>
      ) : null}

      {isSponsor && territorialActive ? (
        <View style={styles.activeBanner}>
          <Text style={styles.activeTitle}>{t('sponsor.upgrade.territorial.active')}</Text>
          <Text style={styles.activeSub}>{t('sponsor.upgrade.territorial.activeSub')}</Text>
        </View>
      ) : null}

      {isSponsor && !territorialActive && territorialApproved ? (
        <View style={styles.activeBanner}>
          <Text style={styles.activeTitle}>{t('sponsor.upgrade.territorial.activating')}</Text>
          <Text style={styles.activeSub}>{t('sponsor.upgrade.territorial.activatingSub')}</Text>
        </View>
      ) : null}

      {isSponsor && isPro ? (
        <View style={styles.activeBanner}>
          <Text style={styles.activeTitle}>National Pro actif</Text>
          <Text style={styles.activeSub}>
            Votre marque bénéficie de la visibilité maximale sur ProDay.
          </Text>
        </View>
      ) : null}

      <SponsorPricingPanel onSelectTier={handleSelectTier} />
      <Text style={styles.footnote}>{SPONSOR_PRICING_INTRO.footnote}</Text>

      {!isSponsor ? (
        <TouchableOpacity style={styles.loginLink} onPress={promptLogin}>
          <Text style={styles.loginLinkText}>Déjà sponsor ? Se connecter</Text>
        </TouchableOpacity>
      ) : null}
    </>
  );

  if (embedded) {
    return <View style={styles.embeddedRoot}>{body}</View>;
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScreenHeader title="Tarifs sponsors" onBack={onBack} centered sponsorDark />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {body}
      </ScrollView>
    </SafeAreaView>
  );
};

function createStyles() {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: SPONSOR_THEME.background },
    embeddedRoot: { gap: spacing.md },
    scroll: {
      padding: spacing.lg,
      paddingBottom: spacing.xl * 2,
      gap: spacing.md,
    },
    intro: { gap: spacing.xs },
    introTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: SPONSOR_THEME.text,
      letterSpacing: -0.3,
    },
    introSub: {
      fontSize: 14,
      color: SPONSOR_THEME.textSecondary,
      lineHeight: 20,
    },
    activeBanner: {
      backgroundColor: SPONSOR_THEME.primarySoft,
      borderRadius: 12,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: SPONSOR_THEME.primaryBorder,
      gap: 4,
    },
    activeTitle: { fontSize: 15, fontWeight: '800', color: SPONSOR_THEME.text },
    activeSub: { fontSize: 13, color: SPONSOR_THEME.textSecondary, lineHeight: 18 },
    footnote: {
      fontSize: 11,
      color: SPONSOR_THEME.textMuted,
      lineHeight: 16,
      textAlign: 'center',
    },
    loginLink: { alignItems: 'center', paddingVertical: spacing.sm },
    loginLinkText: { fontSize: 13, fontWeight: '700', color: SPONSOR_THEME.primary },
  });
}
