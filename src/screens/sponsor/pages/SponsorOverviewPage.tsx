import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { ProDaySymbol } from '../../../components/branding/ProDaySymbol';
import { useSessionProfile } from '../../../hooks/useSessionProfile';
import { useSponsorData } from '../../../context/SponsorDataContext';
import { useSponsorShell, sponsorTabRoute } from '../../../context/SponsorShellContext';
import { SponsorKpiStrip } from '../../../components/sponsor/SponsorKpiStrip';
import { SponsorAnalyticsPanel } from '../../../components/sponsor/SponsorAnalyticsPanel';
import { SponsorActivityFeed } from '../../../components/sponsor/SponsorActivityFeed';
import { SponsorOfferCard } from '../../../components/sponsor/SponsorOfferCard';
import { SponsorOfferDetailScreen } from '../SponsorOfferDetailScreen';
import { Icon } from '../../../components/ui/Icon';
import { sponsorChrome } from '../../../components/sponsor/sponsorStyles';
import { SPONSOR_THEME } from '../../../content/sponsorExperience';
import { spacing, radius } from '../../../theme/designTokens';
import type { SponsorOffer } from '../../../models/SponsorOffer';
import type { SponsorProspect } from '../../../models/SponsorOffer';
import { openSponsorProspectChat } from '../../../utils/openSponsorProspectChat';
import { SponsorPageScaffold } from '../../../components/sponsor/SponsorPageScaffold';
import { SponsorTierStatusBanner } from '../../../components/sponsor/SponsorTierStatusBanner';
import { SponsorQuotaBanner } from '../../../components/sponsor/SponsorQuotaBanner';
import {
  buildSponsorNextActions,
  resolveSponsorHubSubtitle,
  type SponsorNextAction,
} from '../../../utils/sponsorHubModel';
import { AnimatedEntrance, PressableSpring } from '../../../components/motion';

/**
 * Pilotage Sponsor — dashboard léger : statut, KPIs, une action prioritaire, offres.
 */
export const SponsorOverviewPage: React.FC = () => {
  const profile = useSessionProfile();
  const { navigate, openChat, requestCreateOffer } = useSponsorShell();
  const { loading, dashboard, companyName, unreadMessages } = useSponsorData();
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

  const primaryAction = nextActions.find((a) => a.primary) ?? nextActions[0];
  const secondaryActions = nextActions.filter((a) => a.id !== primaryAction?.id).slice(0, 2);

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
      <AnimatedEntrance kind="fadeUp" index={0}>
        <View style={styles.hero}>
          <ProDaySymbol size={48} variant="sponsor" tone="white" />
          <Text style={styles.eyebrow}>ProDay Sponsor</Text>
          <Text
            style={styles.greeting}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {companyName}
          </Text>
          <Text style={styles.sub} numberOfLines={2}>
            {hubSubtitle}
          </Text>
        </View>
      </AnimatedEntrance>

      {!approved ? (
        <AnimatedEntrance kind="fadeUp" index={1}>
          <View style={styles.onboardingCard}>
            <Text style={styles.onboardingTitle}>Espace en validation</Text>
            <Text style={styles.onboardingBody}>
              Accord admin sous ~48 h. En attendant : formules, première offre, prospects de zone.
            </Text>
            {primaryAction ? (
              <PressableSpring
                style={styles.cta}
                onPress={() => runNextAction(primaryAction)}
                scaleTo={0.98}
                haptic
              >
                <Text style={styles.ctaText}>{primaryAction.title}</Text>
              </PressableSpring>
            ) : null}
          </View>
        </AnimatedEntrance>
      ) : null}

      <SponsorTierStatusBanner profile={profile} />
      <SponsorQuotaBanner profile={profile} activeOffers={stats.activeOffers} />

      <AnimatedEntrance kind="fadeUp" index={2}>
        <SponsorKpiStrip
          items={[
            {
              key: 'offers',
              label: 'Offres',
              value: stats.activeOffers,
              icon: 'briefcase',
            },
            {
              key: 'clubs',
              label: 'Clubs',
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
      </AnimatedEntrance>

      {analytics ? <SponsorAnalyticsPanel analytics={analytics} /> : null}

      {approved && primaryAction ? (
        <AnimatedEntrance kind="fadeUp" index={3}>
          <Text style={styles.sectionLabel}>Priorité</Text>
          <PressableSpring
            onPress={() => runNextAction(primaryAction)}
            scaleTo={0.98}
            haptic
            style={styles.primaryCard}
          >
            <View style={styles.primaryIcon}>
              <Icon name={primaryAction.icon} size={20} color={SPONSOR_THEME.onPrimary} />
            </View>
            <View style={styles.nextCopy}>
              <Text style={styles.primaryTitle}>{primaryAction.title}</Text>
              <Text style={styles.nextHint} numberOfLines={2}>
                {primaryAction.hint}
              </Text>
            </View>
            <Icon name="chevron-forward" size={16} color={SPONSOR_THEME.onPrimary} />
          </PressableSpring>
          {secondaryActions.length > 0 ? (
            <View style={styles.nextCol}>
              {secondaryActions.map((action) => (
                <PressableSpring
                  key={action.id}
                  onPress={() => runNextAction(action)}
                  scaleTo={0.98}
                  style={styles.nextCard}
                >
                  <Icon name={action.icon} size={16} color={SPONSOR_THEME.primary} />
                  <Text style={styles.nextTitle} numberOfLines={1}>
                    {action.title}
                  </Text>
                  <Icon name="chevron-forward" size={14} color={sponsorChrome.textMuted} />
                </PressableSpring>
              ))}
            </View>
          ) : null}
        </AnimatedEntrance>
      ) : null}

      <SponsorActivityFeed
        items={activity}
        limit={3}
        onEmptyPress={() => navigate(sponsorTabRoute('offres'))}
      />

      <Text style={styles.sectionLabel}>Mes offres</Text>
      {myOffers.length === 0 ? (
        <View style={styles.emptyCard}>
          <Icon name="briefcase" size={22} color={SPONSOR_THEME.primary} />
          <Text style={styles.emptyTitle}>Première campagne</Text>
          <Text style={styles.emptySub}>
            Visibilité, équipement ou financement — touchez les clubs de votre zone.
          </Text>
          <PressableSpring style={styles.cta} onPress={requestCreateOffer} scaleTo={0.98} haptic>
            <Text style={styles.ctaText}>Créer une offre</Text>
          </PressableSpring>
        </View>
      ) : (
        activeOffers.slice(0, 2).map((offer) => (
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
          {prospects.slice(0, 2).map((p) => (
            <View key={p.id} style={styles.prospectCard}>
              <PressableSpring
                style={styles.prospectMain}
                onPress={() => navigate(sponsorTabRoute('reseau', 'prospects'))}
                scaleTo={0.98}
              >
                <View style={styles.prospectScore}>
                  <Text style={styles.prospectScoreText}>{p.match_score}</Text>
                </View>
                <View style={styles.prospectBody}>
                  <Text style={styles.prospectName}>{p.name}</Text>
                  <Text style={styles.prospectMeta}>
                    {p.city} · {p.category}
                  </Text>
                </View>
              </PressableSpring>
              <PressableSpring
                style={styles.prospectContactBtn}
                onPress={() => handleContactProspect(p)}
                scaleTo={0.96}
                haptic
              >
                <Text style={styles.prospectContactText}>Contacter</Text>
              </PressableSpring>
            </View>
          ))}
        </>
      ) : null}
    </SponsorPageScaffold>
  );
};

function createStyles() {
  return StyleSheet.create({
    hero: {
      alignItems: 'center',
      gap: spacing.xs,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: SPONSOR_THEME.borderSubtle,
      marginBottom: spacing.sm,
    },
    eyebrow: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1.8,
      textTransform: 'uppercase',
      color: SPONSOR_THEME.primary,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    greeting: {
      fontSize: 24,
      lineHeight: 28,
      fontWeight: '800',
      color: SPONSOR_THEME.text,
      letterSpacing: -0.5,
      textAlign: 'center',
    },
    sub: {
      fontSize: 13,
      color: SPONSOR_THEME.textMuted,
      lineHeight: 18,
      textAlign: 'center',
      maxWidth: 320,
    },
    onboardingCard: {
      backgroundColor: SPONSOR_THEME.primarySoft,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: SPONSOR_THEME.border,
      gap: spacing.sm,
    },
    onboardingTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: SPONSOR_THEME.text,
    },
    onboardingBody: {
      fontSize: 13,
      color: SPONSOR_THEME.textSecondary,
      lineHeight: 19,
    },
    sectionLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: SPONSOR_THEME.sectionLabel,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
    },
    sectionGap: { marginTop: spacing.md },
    primaryCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: SPONSOR_THEME.primary,
      borderRadius: radius.lg,
      padding: spacing.md,
    },
    primaryIcon: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: 'rgba(255,255,255,0.16)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: SPONSOR_THEME.onPrimary,
    },
    nextCol: { gap: spacing.xs, marginTop: spacing.sm },
    nextCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: SPONSOR_THEME.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: SPONSOR_THEME.borderSubtle,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    nextCopy: { flex: 1, minWidth: 0, gap: 2 },
    nextTitle: { flex: 1, fontSize: 13, fontWeight: '700', color: SPONSOR_THEME.text },
    nextHint: { fontSize: 12, color: 'rgba(255,255,255,0.78)', lineHeight: 16 },
    emptyCard: {
      alignItems: 'center',
      padding: spacing.xl,
      backgroundColor: SPONSOR_THEME.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: SPONSOR_THEME.borderSubtle,
      gap: spacing.xs,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: SPONSOR_THEME.text,
      marginTop: spacing.xs,
    },
    emptySub: {
      fontSize: 13,
      color: SPONSOR_THEME.textMuted,
      textAlign: 'center',
      lineHeight: 18,
    },
    cta: {
      marginTop: spacing.sm,
      backgroundColor: SPONSOR_THEME.primary,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm + 2,
      borderRadius: radius.pill,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'stretch',
    },
    ctaText: { color: SPONSOR_THEME.onPrimary, fontWeight: '800', fontSize: 14 },
    prospectCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: SPONSOR_THEME.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: SPONSOR_THEME.borderSubtle,
    },
    prospectMain: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    prospectScore: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: SPONSOR_THEME.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    prospectScoreText: { fontSize: 12, fontWeight: '900', color: SPONSOR_THEME.primary },
    prospectBody: { flex: 1 },
    prospectName: { fontSize: 14, fontWeight: '800', color: SPONSOR_THEME.text },
    prospectMeta: { fontSize: 11, color: SPONSOR_THEME.textMuted, marginTop: 2 },
    prospectContactBtn: {
      backgroundColor: SPONSOR_THEME.primary,
      paddingHorizontal: spacing.sm,
      paddingVertical: 8,
      borderRadius: radius.pill,
    },
    prospectContactText: { fontSize: 11, fontWeight: '800', color: SPONSOR_THEME.onPrimary },
  });
}
