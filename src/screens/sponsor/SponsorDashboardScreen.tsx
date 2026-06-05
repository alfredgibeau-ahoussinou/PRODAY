import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import type { User } from '../../models/User';
import { Icon } from '../../components/ui/Icon';
import { SponsorHomeTopBar } from '../../components/sponsor/SponsorHomeTopBar';
import { SponsorScreenHeader } from '../../components/sponsor/SponsorScreenHeader';
import { SponsorAnalyticsPanel } from '../../components/sponsor/SponsorAnalyticsPanel';
import { SponsorActivityFeed } from '../../components/sponsor/SponsorActivityFeed';
import { SponsorOfferCard } from '../../components/sponsor/SponsorOfferCard';
import { SponsorOfferDetailScreen } from './SponsorOfferDetailScreen';
import { useSponsorDashboard } from '../../hooks/useSponsorDashboard';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { useUnreadMessageCount } from '../../hooks/useUnreadMessages';
import { TAB_BAR_CONTENT_INSET } from '../../components/navigation/BottomTabBar';
import { SPONSOR_THEME } from '../../content/sponsorExperience';
import { spacing, radius } from '../../theme/designTokens';
import type { SponsorOffer } from '../../models/SponsorOffer';

interface SponsorDashboardScreenProps {
  profile: User;
}

export const SponsorDashboardScreen: React.FC<SponsorDashboardScreenProps> = ({ profile }) => {
  const nav = useTabNavigationActions();
  const { count: unreadCount } = useUnreadMessageCount();
  const company = profile.profile.job_title ?? profile.display_name;
  const {
    activeOffers,
    myOffers,
    analytics,
    activity,
    prospects,
    stats,
    loading,
    refresh,
  } = useSponsorDashboard(profile.uid, company);
  const [refreshing, setRefreshing] = useState(false);
  const [detailOffer, setDetailOffer] = useState<SponsorOffer | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  if (detailOffer) {
    return (
      <SponsorOfferDetailScreen
        offer={detailOffer}
        onBack={() => setDetailOffer(null)}
        onUpdated={() => void refresh()}
      />
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={SPONSOR_THEME.primary} />
        }
      >
        <SponsorHomeTopBar
          profile={profile}
          unreadMessages={unreadCount}
          onMessagesPress={() => nav.setActiveTab('messages')}
          onProfilePress={() => nav.setActiveTab('profil')}
        />

        <SponsorScreenHeader
          title={`Bonjour, ${company}`}
          subtitle="Tableau de bord marque — performance, offres et réseau local."
        />

        {analytics ? <SponsorAnalyticsPanel analytics={analytics} /> : null}

        <View style={styles.statsRow}>
          <StatCard label="Offres actives" value={String(stats.activeOffers)} />
          <StatCard label="Contacts" value={String(stats.leads)} highlight={stats.leads > 0} />
          <StatCard label="Soutien" value={`${stats.totalFunded} €`} />
        </View>

        <View style={styles.quickRow}>
          <QuickAction icon="add" label="Offre" onPress={() => nav.setActiveTab('matchs')} />
          <QuickAction icon="briefcase" label="Campagnes" onPress={() => nav.setActiveTab('matchs')} />
          <QuickAction icon="chat" label="Réseau" onPress={() => nav.setActiveTab('messages')} />
          <QuickAction icon="people" label="Prospects" onPress={() => nav.setActiveTab('messages')} />
        </View>

        <SponsorActivityFeed items={activity} />

        {loading ? <ActivityIndicator color={SPONSOR_THEME.primary} style={styles.loader} /> : null}

        <Text style={styles.sectionTitle}>Mes offres</Text>
        {myOffers.length === 0 ? (
          <View style={styles.emptyCard}>
            <Icon name="briefcase" size={24} color={SPONSOR_THEME.primary} />
            <Text style={styles.emptyTitle}>Publiez votre première offre</Text>
            <Text style={styles.emptySub}>
              Équipement, visibilité ou financement — touchez les clubs de votre zone.
            </Text>
            <TouchableOpacity style={styles.cta} onPress={() => nav.setActiveTab('matchs')}>
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
            <Text style={[styles.sectionTitle, styles.sectionGap]}>Clubs à contacter</Text>
            {prospects.slice(0, 3).map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.prospectCard}
                onPress={() => nav.setActiveTab('messages')}
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
                <Icon name="chevron-forward" size={16} color={SPONSOR_THEME.textMuted} />
              </TouchableOpacity>
            ))}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
};

const StatCard: React.FC<{ label: string; value: string; highlight?: boolean }> = ({
  label,
  value,
  highlight,
}) => (
  <View style={[styles.statCard, highlight && styles.statCardHighlight]}>
    <Text style={[styles.statValue, highlight && styles.statValueHighlight]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const QuickAction: React.FC<{
  icon: 'add' | 'briefcase' | 'chat' | 'people';
  label: string;
  onPress: () => void;
}> = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.quickAction} onPress={onPress}>
    <Icon name={icon} size={18} color={SPONSOR_THEME.primary} />
    <Text style={styles.quickLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SPONSOR_THEME.background },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
  },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: SPONSOR_THEME.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: SPONSOR_THEME.borderSubtle,
    alignItems: 'center',
  },
  statCardHighlight: {
    borderColor: SPONSOR_THEME.primary,
    backgroundColor: SPONSOR_THEME.primarySoft,
  },
  statValue: { fontSize: 18, fontWeight: '900', color: SPONSOR_THEME.text },
  statValueHighlight: { color: SPONSOR_THEME.primary },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: SPONSOR_THEME.textMuted,
    marginTop: 4,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  quickRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    backgroundColor: SPONSOR_THEME.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: SPONSOR_THEME.borderSubtle,
  },
  quickLabel: { fontSize: 10, fontWeight: '800', color: SPONSOR_THEME.textSecondary },
  loader: { marginVertical: spacing.lg },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: SPONSOR_THEME.sectionLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  sectionGap: { marginTop: spacing.lg },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: SPONSOR_THEME.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: SPONSOR_THEME.borderSubtle,
    marginBottom: spacing.md,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: SPONSOR_THEME.text, marginTop: spacing.sm },
  emptySub: { fontSize: 13, color: SPONSOR_THEME.textMuted, textAlign: 'center', marginTop: spacing.xs, lineHeight: 18 },
  cta: {
    marginTop: spacing.md,
    backgroundColor: SPONSOR_THEME.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  ctaText: { color: SPONSOR_THEME.onPrimary, fontWeight: '800', fontSize: 13 },
  prospectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: SPONSOR_THEME.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: SPONSOR_THEME.borderSubtle,
    marginBottom: spacing.sm,
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
  prospectName: { fontSize: 14, fontWeight: '800', color: SPONSOR_THEME.text },
  prospectMeta: { fontSize: 11, color: SPONSOR_THEME.textMuted, marginTop: 2 },
  prospectReason: { fontSize: 11, color: SPONSOR_THEME.textSecondary, marginTop: 4 },
});
