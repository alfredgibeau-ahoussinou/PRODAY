import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTranslation } from '../../../context/LocaleContext';
import { useSessionProfile } from '../../../hooks/useSessionProfile';
import { useSponsorData } from '../../../context/SponsorDataContext';
import { useSponsorShell, sponsorTabRoute } from '../../../context/SponsorShellContext';
import { SponsorKpiStrip, SponsorQuickLink } from '../../../components/sponsor/SponsorKpiStrip';
import { SponsorAnalyticsPanel } from '../../../components/sponsor/SponsorAnalyticsPanel';
import { SponsorActivityFeed } from '../../../components/sponsor/SponsorActivityFeed';
import { SponsorOfferCard } from '../../../components/sponsor/SponsorOfferCard';
import { SponsorOfferDetailScreen } from '../SponsorOfferDetailScreen';
import { Icon } from '../../../components/ui/Icon';
import { useSponsorStyles, sponsorChrome } from '../../../components/sponsor/sponsorStyles';
import { SPONSOR_THEME } from '../../../content/sponsorExperience';
import { spacing, radius } from '../../../theme/designTokens';
import type { SponsorOffer } from '../../../models/SponsorOffer';
import type { SponsorProspect } from '../../../models/SponsorOffer';
import { useState } from 'react';
import { openSponsorProspectChat } from '../../../utils/openSponsorProspectChat';
import { SponsorPageScaffold } from '../../../components/sponsor/SponsorPageScaffold';
import { SponsorTierStatusBanner } from '../../../components/sponsor/SponsorTierStatusBanner';
import { SponsorQuotaBanner } from '../../../components/sponsor/SponsorQuotaBanner';
import { SPONSOR_BRANDING_LOGOS } from '../../../content/brandingAssets';

export const SponsorOverviewPage: React.FC = () => {
  const { t } = useTranslation();
  const profile = useSessionProfile();
  const { navigate, openChat, requestCreateOffer } = useSponsorShell();
  const { loading, dashboard, companyName } = useSponsorData();
  const { colors: c } = useSponsorStyles();
  const { activeOffers, myOffers, analytics, activity, prospects, stats } = dashboard;
  const [detailOffer, setDetailOffer] = useState<SponsorOffer | null>(null);
  const styles = useMemo(() => createStyles(), []);
  const approved = profile?.sponsor_approved === true;

  const handleContactProspect = (prospect: SponsorProspect) => {
    if (!profile) return;
    void openSponsorProspectChat(profile, prospect, (threadId, draft) => {
      openChat(threadId, draft);
    });
  };

  if (!profile) return null;

  if (detailOffer) {
    return (
      <SponsorOfferDetailScreen
        offer={detailOffer}
        onBack={() => setDetailOffer(null)}
        onUpdated={() => void dashboard.refresh()}
      />
    );
  }

  return (
    <SponsorPageScaffold loading={loading}>
      <View style={styles.heroRow}>
        <View style={styles.heroLogo}>
          <Image
            source={SPONSOR_BRANDING_LOGOS.picto}
            style={styles.heroLogoImage}
            resizeMode="contain"
            accessibilityLabel="Pro Day Sponsor"
          />
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>Espace sponsor</Text>
          <Text style={styles.greeting}>Bonjour, {companyName}</Text>
          <Text style={styles.sub}>{t('sponsor.dashboard.subtitle')}</Text>
        </View>
      </View>

      {!approved ? (
        <View style={styles.onboardingCard}>
          <Text style={styles.onboardingTitle}>Votre espace marque est prêt</Text>
          <Text style={styles.onboardingBody}>
            Validation admin en cours (~48 h). En attendant, explorez les formules, préparez votre
            première offre et consultez les prospects de votre zone.
          </Text>
          <View style={styles.onboardingActions}>
            <TouchableOpacity
              style={styles.cta}
              onPress={() => navigate(sponsorTabRoute('tarifs'))}
            >
              <Text style={styles.ctaText}>Voir les formules</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ctaOutline}
              onPress={() => navigate(sponsorTabRoute('reseau', 'prospects'))}
            >
              <Text style={styles.ctaOutlineText}>Explorer les prospects</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <SponsorTierStatusBanner profile={profile} />
      <SponsorQuotaBanner profile={profile} activeOffers={stats.activeOffers} />

      <SponsorKpiStrip
        items={[
          {
            key: 'offers',
            label: 'Offres actives',
            value: stats.activeOffers,
            icon: 'briefcase',
          },
          {
            key: 'funded',
            label: 'Financé (€)',
            value: stats.totalFunded,
            icon: 'bag',
            alert: stats.totalFunded > 0,
          },
          {
            key: 'clubs',
            label: 'Clubs soutenus',
            value: stats.clubsSupported,
            icon: 'handshake',
          },
          {
            key: 'leads',
            label: 'Prospects',
            value: prospects.length,
            icon: 'people',
            alert: prospects.length > 0,
          },
        ]}
      />

      {analytics ? <SponsorAnalyticsPanel analytics={analytics} /> : null}

      <Text style={styles.sectionLabel}>Actions rapides</Text>
      <View style={styles.quickCol}>
        <SponsorQuickLink
          label="Créer une offre"
          description="Publier une campagne de visibilité ou financement"
          icon="add"
          onPress={requestCreateOffer}
          colors={c}
        />
        <SponsorQuickLink
          label="Financement clubs"
          description="Voir les objectifs de collecte en cours"
          icon="handshake"
          onPress={() => navigate(sponsorTabRoute('clubs'))}
          colors={c}
        />
        <SponsorQuickLink
          label={t('sponsor.network')}
          description="Messages et clubs à contacter"
          icon="chat"
          onPress={() => navigate(sponsorTabRoute('reseau', 'messages'))}
          colors={c}
        />
        <SponsorQuickLink
          label="Formules & tarifs"
          description="Comparer les packs sponsors ProDay"
          icon="star"
          onPress={() => navigate(sponsorTabRoute('tarifs'))}
          colors={c}
        />
      </View>

      <SponsorActivityFeed items={activity} />

      <Text style={styles.sectionLabel}>Mes offres</Text>
      {myOffers.length === 0 ? (
        <View style={styles.emptyCard}>
          <Icon name="briefcase" size={24} color={SPONSOR_THEME.primary} />
          <Text style={styles.emptyTitle}>Publiez votre première offre</Text>
          <Text style={styles.emptySub}>
            Équipement, visibilité ou financement — touchez les clubs de votre zone.
          </Text>
          <TouchableOpacity style={styles.cta} onPress={requestCreateOffer}>
            <Text style={styles.ctaText}>Créer une offre</Text>
          </TouchableOpacity>
        </View>
      ) : (
        activeOffers.slice(0, 3).map((offer) => (
          <SponsorOfferCard
            key={offer.id}
            offer={offer}
            owned
            onPress={() => setDetailOffer(offer)}
          />
        ))
      )}

      {prospects.length > 0 ? (
        <>
          <Text style={[styles.sectionLabel, styles.sectionGap]}>Clubs à contacter</Text>
          {prospects.slice(0, 3).map((p) => (
            <View key={p.id} style={styles.prospectCard}>
              <TouchableOpacity
                style={styles.prospectMain}
                onPress={() => navigate(sponsorTabRoute('reseau', 'prospects'))}
              >
                <View style={styles.prospectScore}>
                  <Text style={styles.prospectScoreText}>{p.match_score}</Text>
                </View>
                <View style={styles.prospectBody}>
                  <Text style={styles.prospectName}>{p.name}</Text>
                  <Text style={styles.prospectMeta}>
                    {p.city} · {p.category}
                  </Text>
                  <Text style={styles.prospectReason}>{p.reason}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.prospectContactBtn}
                onPress={() => handleContactProspect(p)}
              >
                <Text style={styles.prospectContactText}>Contacter</Text>
              </TouchableOpacity>
            </View>
          ))}
        </>
      ) : null}
    </SponsorPageScaffold>
  );
};

function createStyles() {
  return StyleSheet.create({
    heroRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    heroLogo: {
      width: 56,
      height: 56,
      borderRadius: radius.md,
      backgroundColor: sponsorChrome.overlayStrong,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: sponsorChrome.gold,
    },
    heroLogoImage: { width: 40, height: 40 },
    heroCopy: { flex: 1 },
    eyebrow: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      color: sponsorChrome.gold,
      marginBottom: spacing.xs,
    },
    greeting: {
      fontSize: 28,
      fontWeight: '900',
      color: sponsorChrome.text,
      letterSpacing: -0.5,
    },
    sub: {
      fontSize: 14,
      color: sponsorChrome.textMuted,
      marginTop: spacing.xs,
      lineHeight: 20,
    },
    onboardingCard: {
      backgroundColor: sponsorChrome.overlayStrong,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: sponsorChrome.gold,
      gap: spacing.sm,
    },
    onboardingTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: sponsorChrome.text,
    },
    onboardingBody: {
      fontSize: 13,
      color: sponsorChrome.textMuted,
      lineHeight: 19,
    },
    onboardingActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: sponsorChrome.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    sectionGap: { marginTop: spacing.md },
    quickCol: { gap: spacing.sm },
    emptyCard: {
      alignItems: 'center',
      padding: spacing.xl,
      backgroundColor: sponsorChrome.shellElevated,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: sponsorChrome.shellBorder,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: sponsorChrome.text,
      marginTop: spacing.sm,
    },
    emptySub: {
      fontSize: 13,
      color: sponsorChrome.textMuted,
      textAlign: 'center',
      marginTop: spacing.xs,
      lineHeight: 18,
    },
    cta: {
      marginTop: spacing.md,
      backgroundColor: sponsorChrome.accent,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
    },
    ctaOutline: {
      marginTop: spacing.md,
      borderWidth: 1,
      borderColor: sponsorChrome.gold,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
    },
    ctaText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
    ctaOutlineText: { color: sponsorChrome.gold, fontWeight: '800', fontSize: 13 },
    prospectCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: sponsorChrome.shellElevated,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: sponsorChrome.shellBorder,
    },
    prospectMain: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    prospectScore: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: SPONSOR_THEME.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    prospectScoreText: { fontSize: 13, fontWeight: '900', color: SPONSOR_THEME.primary },
    prospectBody: { flex: 1 },
    prospectName: { fontSize: 14, fontWeight: '800', color: sponsorChrome.text },
    prospectMeta: { fontSize: 11, color: sponsorChrome.textMuted, marginTop: 2 },
    prospectReason: { fontSize: 11, color: SPONSOR_THEME.textSecondary, marginTop: 4 },
    prospectContactBtn: {
      backgroundColor: SPONSOR_THEME.primary,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.md,
    },
    prospectContactText: { fontSize: 10, fontWeight: '800', color: SPONSOR_THEME.onPrimary },
  });
}
