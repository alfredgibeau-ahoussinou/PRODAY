import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { Icon } from '../../components/ui/Icon';
import { SponsorScreenHeader } from '../../components/sponsor/SponsorScreenHeader';
import { SponsorPricingPanel } from '../../components/sponsor/SponsorPricingPanel';
import {
  SPONSOR_PARTNER_CONTACT_EMAIL,
  SPONSOR_PRICING_INTRO,
  SPONSOR_VALUE_PILLARS,
  type SponsorPricingTier,
} from '../../content/sponsorPricing';
import { SPONSOR_THEME } from '../../content/sponsorExperience';
import { TAB_BAR_CONTENT_INSET } from '../../components/navigation/BottomTabBar';
import { spacing, radius } from '../../theme/designTokens';
import { useAuth } from '../../context/AuthContext';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { isSponsorRole } from '../../content/sponsorExperience';
import { useSubscriptionOptional } from '../../context/SubscriptionContext';

interface SponsorPartnerHubScreenProps {
  onBack?: () => void;
  onBrowseOffers?: () => void;
}

export const SponsorPartnerHubScreen: React.FC<SponsorPartnerHubScreenProps> = ({
  onBack,
  onBrowseOffers,
}) => {
  const { profile } = useAuth();
  const { openPartnerSignup, openAuth } = useTabNavigation();
  const subscriptionCtx = useSubscriptionOptional();
  const isSponsor = isSponsorRole(profile?.role);

  const handleSelectTier = useCallback(
    (tier: SponsorPricingTier) => {
      if (isSponsor && tier.subscriptionTier === 'pro') {
        subscriptionCtx?.openPlansScreen();
        return;
      }
      if (isSponsor) return;

      if (tier.id === 'territorial') {
        Alert.alert(
          'Formule Territorial',
          `À partir de 49 €/mois — notre équipe vous accompagne pour activer votre zone.\n\nÉcrivez-nous : ${SPONSOR_PARTNER_CONTACT_EMAIL}`,
          [
            { text: 'Fermer', style: 'cancel' },
            {
              text: 'Envoyer un email',
              onPress: () =>
                void Linking.openURL(
                  `mailto:${SPONSOR_PARTNER_CONTACT_EMAIL}?subject=Formule%20Territorial%20ProDay`,
                ),
            },
          ],
        );
        return;
      }

      if (tier.id === 'national') {
        openPartnerSignup('pro');
        return;
      }

      openPartnerSignup('free');
    },
    [isSponsor, openPartnerSignup, subscriptionCtx],
  );

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {onBack ? (
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.85}>
            <Icon name="arrow-back" size={20} color={SPONSOR_THEME.text} />
            <Text style={styles.backText}>Retour</Text>
          </TouchableOpacity>
        ) : null}

        <SponsorScreenHeader
          title={SPONSOR_PRICING_INTRO.title}
          subtitle={SPONSOR_PRICING_INTRO.subtitle}
        />

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Icon name="star-four-points" size={28} color={SPONSOR_THEME.gold} />
          </View>
          <Text style={styles.heroTitle}>Le foot local a besoin de partenaires engagés</Text>
          <Text style={styles.heroBody}>
            Équipementiers, enseignes locales, marques régionales — ProDay connecte votre offre aux
            clubs qui recrutent, organisent et financent leur saison sur l’app.
          </Text>
        </View>

        <View style={styles.pillars}>
          {SPONSOR_VALUE_PILLARS.map((pillar) => (
            <View key={pillar.title} style={styles.pillarCard}>
              <Icon name={pillar.icon} size={20} color={SPONSOR_THEME.primary} />
              <Text style={styles.pillarTitle}>{pillar.title}</Text>
              <Text style={styles.pillarBody}>{pillar.body}</Text>
            </View>
          ))}
        </View>

        {isSponsor ? (
          <View style={styles.sponsorBanner}>
            <Text style={styles.sponsorBannerTitle}>Vous êtes déjà partenaire ProDay</Text>
            <Text style={styles.sponsorBannerSub}>
              Gérez vos offres depuis l’accueil, les campagnes et votre marque.
            </Text>
            {subscriptionCtx && subscriptionCtx.subscription?.tier !== 'pro' ? (
              <TouchableOpacity
                style={styles.sponsorUpgradeBtn}
                onPress={() => subscriptionCtx.openPlansScreen()}
              >
                <Text style={styles.sponsorUpgradeText}>Passer National Pro — 99 €/mois</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Tarifs partenaires</Text>
            <SponsorPricingPanel onSelectTier={handleSelectTier} />
            <Text style={styles.footnote}>{SPONSOR_PRICING_INTRO.footnote}</Text>
            <TouchableOpacity style={styles.loginLink} onPress={() => openAuth('login')}>
              <Text style={styles.loginLinkText}>Déjà partenaire ? Se connecter</Text>
            </TouchableOpacity>
          </>
        )}

        {onBrowseOffers ? (
          <TouchableOpacity style={styles.browseBtn} onPress={onBrowseOffers} activeOpacity={0.88}>
            <Icon name="business" size={18} color={SPONSOR_THEME.primary} />
            <Text style={styles.browseText}>Voir les offres partenaires actives</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SPONSOR_THEME.background },
  content: {
    padding: spacing.lg,
    paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
    gap: spacing.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.sm,
  },
  backText: { color: SPONSOR_THEME.textSecondary, fontSize: 14, fontWeight: '700' },
  hero: {
    backgroundColor: SPONSOR_THEME.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: SPONSOR_THEME.borderSubtle,
    gap: spacing.sm,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: SPONSOR_THEME.goldSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { fontSize: 20, fontWeight: '800', color: SPONSOR_THEME.text, lineHeight: 26 },
  heroBody: { fontSize: 14, color: SPONSOR_THEME.textSecondary, lineHeight: 21 },
  pillars: { gap: spacing.sm },
  pillarCard: {
    backgroundColor: SPONSOR_THEME.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: SPONSOR_THEME.borderSubtle,
    gap: 4,
  },
  pillarTitle: { fontSize: 14, fontWeight: '800', color: SPONSOR_THEME.text, marginTop: 4 },
  pillarBody: { fontSize: 12, color: SPONSOR_THEME.textMuted, lineHeight: 17 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: SPONSOR_THEME.sectionLabel,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.sm,
  },
  footnote: {
    fontSize: 11,
    color: SPONSOR_THEME.textMuted,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  loginLink: { alignItems: 'center', paddingVertical: spacing.sm },
  loginLinkText: { fontSize: 13, fontWeight: '700', color: SPONSOR_THEME.primary },
  sponsorBanner: {
    backgroundColor: SPONSOR_THEME.primarySoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: SPONSOR_THEME.primary,
    gap: spacing.sm,
  },
  sponsorBannerTitle: { fontSize: 16, fontWeight: '800', color: SPONSOR_THEME.text },
  sponsorBannerSub: { fontSize: 13, color: SPONSOR_THEME.textSecondary, lineHeight: 18 },
  sponsorUpgradeBtn: {
    marginTop: spacing.sm,
    backgroundColor: SPONSOR_THEME.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  sponsorUpgradeText: { color: SPONSOR_THEME.onPrimary, fontWeight: '800', fontSize: 14 },
  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: SPONSOR_THEME.borderSubtle,
    backgroundColor: SPONSOR_THEME.surface,
  },
  browseText: { fontSize: 14, fontWeight: '700', color: SPONSOR_THEME.text },
});
