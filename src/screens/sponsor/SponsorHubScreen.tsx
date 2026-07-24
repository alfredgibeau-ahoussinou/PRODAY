import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Icon } from '../../components/ui/Icon';
import { SponsorScreenHeader } from '../../components/sponsor/SponsorScreenHeader';
import { SponsorPricingScreen } from '../../components/sponsor/SponsorPricingScreen';
import {
  SPONSOR_PRICING_INTRO,
  SPONSOR_VALUE_PILLARS,
} from '../../content/sponsorPricing';
import { SPONSOR_THEME } from '../../content/sponsorExperience';
import { SPONSOR_BRANDING_LOGOS } from '../../content/brandingAssets';
import { TAB_BAR_CONTENT_INSET } from '../../components/navigation/BottomTabBar';
import { SPONSOR_NAV_INSET } from '../../navigation/sponsorTabConfig';
import { spacing, radius } from '../../theme/designTokens';
import { isSponsorRole } from '../../content/sponsorExperience';
import { useAuth } from '../../context/AuthContext';

interface SponsorHubScreenProps {
  onBack?: () => void;
  onBrowseOffers?: () => void;
  shellMode?: boolean;
}

export const SponsorHubScreen: React.FC<SponsorHubScreenProps> = ({
  onBack,
  onBrowseOffers,
  shellMode = false,
}) => {
  const { profile } = useAuth();
  const isSponsor = isSponsorRole(profile?.role);
  const bottomInset = shellMode ? SPONSOR_NAV_INSET : TAB_BAR_CONTENT_INSET;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomInset + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {onBack && !shellMode ? (
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.85}>
            <Icon name="arrow-back" size={20} color={SPONSOR_THEME.text} />
            <Text style={styles.backText}>Retour</Text>
          </TouchableOpacity>
        ) : null}

        {!shellMode ? (
          <SponsorScreenHeader
            title={SPONSOR_PRICING_INTRO.title}
            subtitle={SPONSOR_PRICING_INTRO.subtitle}
          />
        ) : (
          <View style={styles.shellIntro}>
            <Text style={styles.shellIntroTitle}>{SPONSOR_PRICING_INTRO.title}</Text>
            <Text style={styles.shellIntroSub}>{SPONSOR_PRICING_INTRO.subtitle}</Text>
          </View>
        )}

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Image
              source={SPONSOR_BRANDING_LOGOS.picto}
              style={styles.heroLogo}
              resizeMode="contain"
              accessibilityLabel="Pro Day Sponsor"
            />
          </View>
          <Text style={styles.heroTitle}>Le foot local a besoin de sponsors engagés</Text>
          <Text style={styles.heroBody}>
            Équipementiers, enseignes locales, marques régionales. ProDay connecte votre offre aux
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
            <Text style={styles.sponsorBannerTitle}>Votre espace sponsor ProDay</Text>
            <Text style={styles.sponsorBannerSub}>
              Les formules ci-dessous sont les mêmes que sur le site ProDay.
            </Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Tarifs sponsors</Text>
        <SponsorPricingScreen embedded hideIntro onBack={onBack} />

        {onBrowseOffers ? (
          <TouchableOpacity style={styles.browseBtn} onPress={onBrowseOffers} activeOpacity={0.88}>
            <Icon name="business" size={18} color={SPONSOR_THEME.primary} />
            <Text style={styles.browseText}>Voir les offres sponsors actives</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </View>
  );
};

/** @deprecated Utiliser SponsorHubScreen */
export const SponsorPartnerHubScreen = SponsorHubScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SPONSOR_THEME.background },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  backText: { fontSize: 15, fontWeight: '700', color: SPONSOR_THEME.text },
  shellIntro: { gap: spacing.xs, marginBottom: spacing.sm },
  shellIntroTitle: { fontSize: 22, fontWeight: '800', color: SPONSOR_THEME.text },
  shellIntroSub: { fontSize: 14, color: SPONSOR_THEME.textSecondary, lineHeight: 20 },
  hero: {
    backgroundColor: SPONSOR_THEME.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: SPONSOR_THEME.borderSubtle,
    gap: spacing.sm,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    overflow: 'hidden',
    padding: 4,
  },
  heroLogo: { width: '100%', height: '100%' },
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
