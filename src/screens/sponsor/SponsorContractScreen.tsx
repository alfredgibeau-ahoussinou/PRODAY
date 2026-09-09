import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Linking, Alert } from 'react-native';
import { PressableSpring } from '../../components/motion';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useTranslation } from '../../context/LocaleContext';
import {
  SPONSOR_CONTACT_EMAIL,
  SPONSOR_PRICING_TIERS,
} from '../../content/sponsorPricing';
import { resolveSponsorPricingTier } from '../../utils/sponsorTier';
import { SPONSOR_NAV_INSET } from '../../navigation/sponsorTabConfig';
import { SPONSOR_THEME } from '../../content/sponsorExperience';
import { spacing, radius } from '../../theme/designTokens';
import { SponsorQuoteDocsPanel } from '../../components/sponsor/SponsorQuoteDocsPanel';

interface SponsorContractScreenProps {
  shellMode?: boolean;
}

/** Formule contrat sponsor — lecture seule + CTA commercial. */
export const SponsorContractScreen: React.FC<SponsorContractScreenProps> = ({
  shellMode = true,
}) => {
  const { t } = useTranslation();
  const profile = useSessionProfile();
  const tierId = resolveSponsorPricingTier(profile);
  const tier = useMemo(
    () => SPONSOR_PRICING_TIERS.find((row) => row.id === tierId) ?? SPONSOR_PRICING_TIERS[0],
    [tierId],
  );

  const contactCommercial = () => {
    const subject = encodeURIComponent(`Contrat sponsor ProDay. ${tier.name}`);
    const body = encodeURIComponent(
      `Bonjour,\n\nJe souhaite en savoir plus sur la formule ${tier.name}.\n\nEntreprise : ${profile?.profile.job_title ?? profile?.display_name ?? ''}\n`,
    );
    void Linking.openURL(`mailto:${SPONSOR_CONTACT_EMAIL}?subject=${subject}&body=${body}`).catch(
      () => Alert.alert(t('sponsor.contract.contactError')),
    );
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: (shellMode ? SPONSOR_NAV_INSET : 24) + spacing.xl },
      ]}
    >
      <Text style={styles.eyebrow}>{t('sponsor.contract.eyebrow')}</Text>
      <Text style={styles.title}>{tier.name}</Text>
      <Text style={styles.tagline}>{tier.tagline}</Text>

      <View style={styles.priceCard}>
        <Text style={styles.price}>
          {tier.monthlyEur === 0
            ? t('sponsor.contract.free')
            : t('sponsor.contract.monthly', { price: String(tier.monthlyEur) })}
        </Text>
        {tier.monthlyEur > 0 ? (
          <Text style={styles.priceSub}>
            {t('sponsor.contract.yearly', { price: String(tier.yearlyEur) })}
          </Text>
        ) : null}
      </View>

      <Text style={styles.section}>{t('sponsor.contract.included')}</Text>
      {tier.features.map((feature) => (
        <Text key={feature} style={styles.feature}>
          · {feature}
        </Text>
      ))}

      <PressableSpring style={styles.cta} onPress={contactCommercial} scaleTo={0.97} haptic>
        <Text style={styles.ctaText}>{t('sponsor.contract.contactCta')}</Text>
      </PressableSpring>

      <SponsorQuoteDocsPanel />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SPONSOR_THEME.background },
  content: { padding: spacing.lg, gap: spacing.sm },
  eyebrow: {
    color: SPONSOR_THEME.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: { color: SPONSOR_THEME.text, fontSize: 26, fontWeight: '900' },
  tagline: { color: SPONSOR_THEME.textSecondary, fontSize: 14, marginBottom: spacing.sm },
  priceCard: {
    backgroundColor: SPONSOR_THEME.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: SPONSOR_THEME.border,
    gap: 4,
  },
  price: { color: SPONSOR_THEME.text, fontSize: 22, fontWeight: '800' },
  priceSub: { color: SPONSOR_THEME.textMuted, fontSize: 13 },
  section: {
    color: SPONSOR_THEME.text,
    fontWeight: '800',
    marginTop: spacing.md,
    fontSize: 14,
  },
  feature: { color: SPONSOR_THEME.textSecondary, fontSize: 13, lineHeight: 20 },
  cta: {
    marginTop: spacing.lg,
    backgroundColor: SPONSOR_THEME.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  ctaText: { color: SPONSOR_THEME.onPrimary, fontWeight: '800', fontSize: 15 },
});
