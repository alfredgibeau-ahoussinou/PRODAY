import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProDaySymbol } from '../../../components/branding/ProDaySymbol';
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
import { SHOWCASE_IMAGES } from '../../../content/showcaseAssets';
import {
  buildSponsorNextActions,
  resolveSponsorHubSubtitle,
  type SponsorNextAction,
} from '../../../utils/sponsorHubModel';
import { PressableSpring } from '../../../components/motion';

export const SponsorOverviewPage: React.FC = () => {
  const { t } = useTranslation();
  const profile = useSessionProfile();
  const { navigate, openChat, requestCreateOffer } = useSponsorShell();
  const { loading, dashboard, companyName, unreadMessages } = useSponsorData();
  const { colors: c } = useSponsorStyles();
  const { activeOffers, myOffers, analytics, activity, prospects, stats } = dashboard;
  const [detailOffer, setDetailOffer] = useState<SponsorOffer | null>(null);
  const styles = useMemo(() => createStyles(), []);
  const approved = profile?.sponsor_approved === true;

  const hubSubtitle = useMemo(
    () =>
      resolveSponsorHubSubtitle({
        approved,
        activeOffers: stats.activeOffers,
        prospectCount: prospects.length,
        unreadMessages,
        clubsSupported: stats.clubsSupported,
      }),
    [approved, stats.activeOffers, stats.clubsSupported, prospects.length, unreadMessages],
  );

  const nextActions = useMemo(
    () =>
      buildSponsorNextActions({
        approved,
        activeOffers: stats.activeOffers,
        prospectCount: prospects.length,
        unreadMessages,
        clubsSupported: stats.clubsSupported,
      }),
    [approved, stats.activeOffers, stats.clubsSupported, prospects.length, unreadMessages],
  );

  const runNextAction = (action: SponsorNextAction) => {
    if (action.createOffer) {
      requestCreateOffer();
      return;
    }
    navigate(sponsorTabRoute(action.tab, action.segment));
  };

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
      <View style={styles.heroBleed}>
        <Image
          source={SHOWCASE_IMAGES.expSponsors}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
        <LinearGradient
          colors={['rgba(7,6,5,0.35)', 'rgba(7,6,5,0.92)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heroInner}>
          <View style={styles.heroRow}>
            <View style={styles.heroLogo}>
              <ProDaySymbol size={56} variant="sponsor" tone="white" />
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.eyebrow} numberOfLines={1}>
                Pro Day Sponsor
              </Text>
              <Text
                style={styles.greeting}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                Bonjour, {companyName}
              </Text>
              <Text style={styles.sub} numberOfLines={2}>
                {hubSubtitle}
              </Text>
            </View>
          </View>
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

      {nextActions.length > 0 ? (
        <>
          <Text style={styles.sectionLabel}>À faire ensuite</Text>
          <View style={styles.nextCol}>
            {nextActions.map((action) => (
              <PressableSpring
                key={action.id}
                onPress={() => runNextAction(action)}
                scaleTo={0.98}
                haptic
                style={[styles.nextCard, action.primary && styles.nextCardPrimary]}
              >
                <View
                  style={[
                    styles.nextIcon,
                    {
                      backgroundColor: action.primary
                        ? SPONSOR_THEME.primarySoft
                        : sponsorChrome.shellElevated,
                    },
                  ]}
                >
                  <Icon
                    name={action.icon}
                    size={18}
                    color={action.primary ? SPONSOR_THEME.primary : sponsorChrome.gold}
                  />
                </View>
                <View style={styles.nextCopy}>
                  <Text style={styles.nextTitle}>{action.title}</Text>
                  <Text style={styles.nextHint} numberOfLines={2}>
                    {action.hint}
                  </Text>
                </View>
                <Icon name="chevron-forward" size={16} color={sponsorChrome.textMuted} />
              </PressableSpring>
            ))}
          </View>
        </>
      ) : null}

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
          description={
            unreadMessages > 0
              ? `${unreadMessages} message${unreadMessages > 1 ? 's' : ''} non lu${unreadMessages > 1 ? 's' : ''} · clubs à contacter`
              : 'Messages et clubs à contacter'
          }
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

      <SponsorActivityFeed
        items={activity}
        onEmptyPress={() => navigate(sponsorTabRoute('offres'))}
      />

      <Text style={styles.sectionLabel}>Mes offres</Text>
      {myOffers.length === 0 ? (
        <View style={styles.emptyCard}>
          <Icon name="briefcase" size={24} color={SPONSOR_THEME.primary} />
          <Text style={styles.emptyTitle}>Publiez votre première offre</Text>
          <Text style={styles.emptySub}>
            Équipement, visibilité ou financement. Touchez les clubs de votre zone.
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

      <Text style={[styles.sectionLabel, styles.sectionGap]}>Clubs à contacter</Text>
      {prospects.length === 0 ? (
        <View style={styles.emptyCard}>
          <Icon name="people" size={24} color={SPONSOR_THEME.primary} />
          <Text style={styles.emptyTitle}>Aucun club à contacter</Text>
          <Text style={styles.emptySub}>
            Publiez une offre active pour faire remonter des prospects de votre zone.
          </Text>
          <TouchableOpacity style={styles.cta} onPress={requestCreateOffer}>
            <Text style={styles.ctaText}>Créer une offre</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.ctaOutline}
            onPress={() => navigate(sponsorTabRoute('reseau', 'prospects'))}
          >
            <Text style={styles.ctaOutlineText}>Ouvrir le réseau</Text>
          </TouchableOpacity>
        </View>
      ) : (
        prospects.slice(0, 3).map((p) => (
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
        ))
      )}
    </SponsorPageScaffold>
  );
};

function createStyles() {
  return StyleSheet.create({
    heroBleed: {
      marginHorizontal: -spacing.lg,
      marginTop: -spacing.md,
      marginBottom: spacing.lg,
      minHeight: 220,
      overflow: 'hidden',
      borderBottomWidth: 1,
      borderBottomColor: sponsorChrome.gold,
    },
    heroInner: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
      paddingBottom: spacing.lg,
      gap: spacing.xs,
    },
    heroLogo: {
      width: 52,
      height: 52,
      borderRadius: radius.md,
      backgroundColor: 'rgba(7,6,5,0.72)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: sponsorChrome.gold,
      flexShrink: 0,
    },
    heroLogoImage: { width: 36, height: 36 },
    eyebrow: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      color: sponsorChrome.gold,
      marginBottom: 2,
      flexShrink: 1,
    },
    greeting: {
      fontSize: 22,
      lineHeight: 26,
      fontWeight: '800',
      color: '#FAFAF9',
      letterSpacing: -0.4,
      flexShrink: 1,
    },
    sub: {
      fontSize: 14,
      color: 'rgba(250,250,249,0.72)',
      lineHeight: 20,
      marginTop: 2,
    },
    heroRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minWidth: 0,
    },
    heroCopy: { flex: 1, flexShrink: 1, minWidth: 0, justifyContent: 'center' },
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
    nextCol: { gap: spacing.sm, marginBottom: spacing.sm },
    nextCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: sponsorChrome.shellElevated,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: sponsorChrome.shellBorder,
      padding: spacing.md,
    },
    nextCardPrimary: {
      borderColor: sponsorChrome.gold,
      backgroundColor: 'rgba(212, 175, 55, 0.08)',
    },
    nextIcon: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    nextCopy: { flex: 1, minWidth: 0, gap: 2 },
    nextTitle: { fontSize: 14, fontWeight: '800', color: sponsorChrome.text },
    nextHint: { fontSize: 12, color: sponsorChrome.textMuted, lineHeight: 16 },
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
