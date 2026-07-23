import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { PressableSpring } from '../../components/motion';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useSponsorDashboard } from '../../hooks/useSponsorDashboard';
import { useTranslation } from '../../context/LocaleContext';
import { useSponsorShellOptional, sponsorTabRoute } from '../../context/SponsorShellContext';
import { openSponsorProspectChat } from '../../utils/openSponsorProspectChat';
import { SPONSOR_NAV_INSET } from '../../navigation/sponsorTabConfig';
import { SPONSOR_THEME } from '../../content/sponsorExperience';
import { spacing, radius } from '../../theme/designTokens';
import type { SponsorProspect } from '../../models/SponsorOffer';

interface SponsorContactsScreenProps {
  shellMode?: boolean;
  onOpenChat?: (prospect: SponsorProspect) => void;
}

type PartnerContact = {
  goalId: string;
  clubId: string;
  title: string;
  fundedEur: number;
  targetEur: number;
  raisedEur: number;
};

/** Clubs partenaires (déjà financés) — distinct des prospects réseau. */
export const SponsorContactsScreen: React.FC<SponsorContactsScreenProps> = ({
  shellMode = true,
  onOpenChat,
}) => {
  const { t } = useTranslation();
  const profile = useSessionProfile();
  const company = profile?.profile.job_title ?? profile?.display_name;
  const sponsorShell = useSponsorShellOptional();
  const { prospects, goals, contributions, loading } = useSponsorDashboard(
    profile?.uid,
    company,
  );

  const partners = useMemo<PartnerContact[]>(() => {
    const byGoal = new Map<string, number>();
    for (const c of contributions) {
      byGoal.set(c.goal_id, (byGoal.get(c.goal_id) ?? 0) + c.amount_eur);
    }
    return goals
      .filter((g) => (byGoal.get(g.id) ?? 0) > 0)
      .map((g) => ({
        goalId: g.id,
        clubId: g.club_id,
        title: g.title,
        fundedEur: byGoal.get(g.id) ?? 0,
        targetEur: g.target_amount_eur,
        raisedEur: g.raised_amount_eur,
      }))
      .sort((a, b) => b.fundedEur - a.fundedEur);
  }, [goals, contributions]);

  const handleContactProspect = (prospect: SponsorProspect) => {
    if (!profile) return;
    if (onOpenChat) {
      onOpenChat(prospect);
      return;
    }
    void openSponsorProspectChat(profile, prospect, () => {
      Alert.alert(t('sponsor.contacts.chatOpened'));
    });
  };

  const goToClubs = () => {
    sponsorShell?.navigate(sponsorTabRoute('clubs'));
  };

  const goToProspects = () => {
    sponsorShell?.navigate(sponsorTabRoute('reseau', 'prospects'));
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: (shellMode ? SPONSOR_NAV_INSET : 24) + spacing.xl },
      ]}
    >
      <Text style={styles.subtitle}>{t('sponsor.contacts.subtitle')}</Text>

      {loading ? (
        <ActivityIndicator color={SPONSOR_THEME.primary} style={styles.loader} />
      ) : (
        <>
          <Text style={styles.sectionLabel}>{t('sponsor.contacts.partnersSection')}</Text>
          {partners.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>{t('sponsor.contacts.emptyPartners')}</Text>
              <Text style={styles.emptyBody}>{t('sponsor.contacts.emptyPartnersHint')}</Text>
              {sponsorShell ? (
                <PressableSpring
                  style={styles.cta}
                  onPress={goToClubs}
                  scaleTo={0.97}
                  haptic
                >
                  <Text style={styles.ctaText}>{t('sponsor.contacts.fundCta')}</Text>
                </PressableSpring>
              ) : null}
            </View>
          ) : (
            partners.map((partner) => (
              <View key={partner.goalId} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.clubName}>{partner.title}</Text>
                  <Text style={styles.badgePartner}>{t('sponsor.contacts.statusPartner')}</Text>
                </View>
                <Text style={styles.meta}>
                  {t('sponsor.contacts.fundedMeta', {
                    funded: String(partner.fundedEur),
                    raised: String(partner.raisedEur),
                    target: String(partner.targetEur),
                  })}
                </Text>
                <PressableSpring
                  style={styles.cta}
                  onPress={goToClubs}
                  scaleTo={0.97}
                  haptic
                >
                  <Text style={styles.ctaText}>{t('sponsor.contacts.viewCampaignCta')}</Text>
                </PressableSpring>
              </View>
            ))
          )}

          <Text style={[styles.sectionLabel, styles.sectionGap]}>
            {t('sponsor.contacts.activateSection')}
          </Text>
          {prospects.length === 0 ? (
            <Text style={styles.empty}>{t('sponsor.contacts.empty')}</Text>
          ) : (
            prospects.slice(0, 5).map((prospect) => (
              <View key={prospect.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.clubName}>{prospect.name}</Text>
                  <Text style={styles.badge}>{t('sponsor.contacts.statusProspect')}</Text>
                </View>
                <Text style={styles.meta}>
                  {prospect.city} · {prospect.category}
                </Text>
                <Text style={styles.reason}>{prospect.reason}</Text>
                <Text style={styles.score}>
                  {t('sponsor.contacts.matchScore', { n: String(prospect.match_score) })}
                </Text>
                <PressableSpring
                  style={styles.cta}
                  onPress={() => handleContactProspect(prospect)}
                  scaleTo={0.97}
                  haptic
                >
                  <Text style={styles.ctaText}>{t('sponsor.contacts.activateCta')}</Text>
                </PressableSpring>
              </View>
            ))
          )}
          {prospects.length > 5 && sponsorShell ? (
            <PressableSpring style={styles.ctaGhost} onPress={goToProspects} scaleTo={0.97}>
              <Text style={styles.ctaGhostText}>{t('sponsor.contacts.seeAllProspects')}</Text>
            </PressableSpring>
          ) : null}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SPONSOR_THEME.background },
  content: { padding: spacing.lg, gap: spacing.sm },
  subtitle: { color: SPONSOR_THEME.textSecondary, fontSize: 14, marginBottom: spacing.sm },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: SPONSOR_THEME.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: spacing.sm,
  },
  sectionGap: { marginTop: spacing.lg },
  loader: { marginTop: spacing.xl },
  empty: { color: SPONSOR_THEME.textMuted, textAlign: 'center', marginTop: spacing.md },
  emptyCard: {
    backgroundColor: SPONSOR_THEME.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: SPONSOR_THEME.border,
    gap: spacing.xs,
  },
  emptyTitle: { color: SPONSOR_THEME.text, fontWeight: '800', fontSize: 15 },
  emptyBody: { color: SPONSOR_THEME.textSecondary, fontSize: 13, lineHeight: 18 },
  card: {
    backgroundColor: SPONSOR_THEME.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: SPONSOR_THEME.border,
    gap: spacing.xs,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clubName: { color: SPONSOR_THEME.text, fontWeight: '800', fontSize: 16, flex: 1 },
  badge: {
    color: SPONSOR_THEME.primary,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  badgePartner: {
    color: SPONSOR_THEME.gold,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  meta: { color: SPONSOR_THEME.textMuted, fontSize: 12 },
  reason: { color: SPONSOR_THEME.textSecondary, fontSize: 13, lineHeight: 18 },
  score: { color: SPONSOR_THEME.textMuted, fontSize: 11, fontWeight: '700' },
  cta: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: SPONSOR_THEME.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  ctaText: { color: SPONSOR_THEME.primary, fontWeight: '800', fontSize: 12 },
  ctaGhost: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: SPONSOR_THEME.border,
  },
  ctaGhostText: { color: SPONSOR_THEME.textMuted, fontWeight: '700', fontSize: 12 },
});
