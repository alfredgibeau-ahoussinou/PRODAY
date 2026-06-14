import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { PressableSpring } from '../../components/motion';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useSponsorDashboard } from '../../hooks/useSponsorDashboard';
import { SponsorScreenHeader } from '../../components/sponsor/SponsorScreenHeader';
import { SponsorOfferCard } from '../../components/sponsor/SponsorOfferCard';
import { SponsorOfferDetailScreen } from './SponsorOfferDetailScreen';
import { CreateSponsorOfferScreen } from '../CreateSponsorOfferScreen';
import { sponsorsService } from '../../services/sponsors.service';
import { Icon } from '../../components/ui/Icon';
import { TAB_BAR_CONTENT_INSET } from '../../components/navigation/BottomTabBar';
import { SPONSOR_THEME } from '../../content/sponsorExperience';
import { spacing, radius } from '../../theme/designTokens';
import type { SponsorOffer } from '../../models/SponsorOffer';

type CampaignFilter = 'mine' | 'clubs' | 'all';
type ClubSort = 'progress' | 'amount';

export const SponsorCampaignsScreen: React.FC = () => {
  const profile = useSessionProfile();
  const company = profile?.profile.job_title ?? profile?.display_name;
  const [filter, setFilter] = useState<CampaignFilter>('mine');
  const [clubSort, setClubSort] = useState<ClubSort>('progress');
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [detailOffer, setDetailOffer] = useState<SponsorOffer | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [contributeId, setContributeId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [contributing, setContributing] = useState(false);
  const { offers, myOffers, goals, contributions, loading, refresh } = useSponsorDashboard(
    profile?.uid,
    company
  );

  const filteredOffers = useMemo(() => {
    if (filter === 'mine') return myOffers;
    if (filter === 'clubs') return [];
    return offers;
  }, [filter, myOffers, offers]);

  const sortedGoals = useMemo(() => {
    let list = [...goals];
    if (urgentOnly) {
      list = list.filter((g) => g.raised_amount_eur / g.target_amount_eur < 0.5);
    }
    if (clubSort === 'progress') {
      list.sort(
        (a, b) =>
          a.raised_amount_eur / a.target_amount_eur - b.raised_amount_eur / b.target_amount_eur
      );
    } else {
      list.sort((a, b) => b.target_amount_eur - a.target_amount_eur);
    }
    return list;
  }, [goals, clubSort, urgentOnly]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleToggleOffer = async (offer: SponsorOffer) => {
    try {
      await sponsorsService.toggleOfferActive(offer.id, !offer.active);
      await refresh();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Action impossible.');
    }
  };

  const handleDuplicateOffer = async (offer: SponsorOffer) => {
    try {
      await sponsorsService.duplicateOffer(offer);
      Alert.alert('Offre dupliquée', 'La copie est disponible dans Mes offres.');
      await refresh();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Duplication impossible.');
    }
  };

  const handleContribute = async () => {
    if (!contributeId || !profile) return;
    const value = Number(amount.replace(',', '.'));
    if (!value || value <= 0) {
      Alert.alert('Montant invalide', 'Indiquez un montant en euros.');
      return;
    }
    setContributing(true);
    try {
      await sponsorsService.contributeToGoal(contributeId, value, profile.uid);
      Alert.alert('Merci !', `${value} € ajoutés à la campagne.`);
      setContributeId(null);
      setAmount('');
      await refresh();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Contribution impossible.');
    } finally {
      setContributing(false);
    }
  };

  if (!profile) {
    return (
      <View style={styles.root}>
        <Text style={styles.guest}>Connectez-vous pour gérer vos campagnes.</Text>
      </View>
    );
  }

  if (detailOffer) {
    return (
      <SponsorOfferDetailScreen
        offer={detailOffer}
        onBack={() => setDetailOffer(null)}
        onUpdated={() => void refresh()}
      />
    );
  }

  if (showCreate) {
    return (
      <CreateSponsorOfferScreen
        sponsorUid={profile.uid}
        onBack={() => setShowCreate(false)}
        onCreated={refresh}
      />
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={SPONSOR_THEME.primary} />
      }
    >
      <SponsorScreenHeader
        title="Campagnes"
        subtitle="Gérez vos offres, financez les clubs et suivez vos contributions."
      />

      <PressableSpring style={styles.createBtn} onPress={() => setShowCreate(true)}>
        <Icon name="add" size={18} color={SPONSOR_THEME.onPrimary} />
        <Text style={styles.createBtnText}>Nouvelle offre partenaire</Text>
      </PressableSpring>

      <View style={styles.filters}>
        {(
          [
            { id: 'mine' as const, label: 'Mes offres' },
            { id: 'clubs' as const, label: 'Clubs' },
            { id: 'all' as const, label: 'Écosystème' },
          ] as const
        ).map((f) => (
          <PressableSpring
            key={f.id}
            style={[styles.filterChip, filter === f.id && styles.filterChipOn]}
            onPress={() => setFilter(f.id)}
          >
            <Text style={[styles.filterText, filter === f.id && styles.filterTextOn]}>{f.label}</Text>
          </PressableSpring>
        ))}
      </View>

      {loading ? <ActivityIndicator color={SPONSOR_THEME.primary} style={styles.loader} /> : null}

      {filter !== 'clubs' ? (
        <>
          <Text style={styles.sectionTitle}>
            Offres {filter === 'mine' ? `(${myOffers.length})` : ''}
          </Text>
          {filteredOffers.length === 0 ? (
            <Text style={styles.empty}>Aucune offre dans cette vue.</Text>
          ) : (
            filteredOffers.map((offer) => (
              <SponsorOfferCard
                key={offer.id}
                offer={offer}
                owned={offer.sponsor_uid === profile.uid}
                onPress={() => setDetailOffer(offer)}
                onToggleActive={
                  offer.sponsor_uid === profile.uid
                    ? () => void handleToggleOffer(offer)
                    : undefined
                }
                onDuplicate={
                  offer.sponsor_uid === profile.uid
                    ? () => void handleDuplicateOffer(offer)
                    : undefined
                }
              />
            ))
          )}
        </>
      ) : null}

      {filter !== 'mine' ? (
        <>
          <View style={styles.clubToolbar}>
            <Text style={[styles.sectionTitle, styles.sectionGap]}>Campagnes clubs</Text>
            <View style={styles.clubFilters}>
              <PressableSpring
                style={[styles.miniChip, urgentOnly && styles.miniChipOn]}
                onPress={() => setUrgentOnly((v) => !v)}
              >
                <Text style={[styles.miniChipText, urgentOnly && styles.miniChipTextOn]}>
                  Urgentes
                </Text>
              </PressableSpring>
              <PressableSpring
                style={styles.miniChip}
                onPress={() => setClubSort((s) => (s === 'progress' ? 'amount' : 'progress'))}
              >
                <Text style={styles.miniChipText}>
                  Tri : {clubSort === 'progress' ? '% atteint' : 'montant'}
                </Text>
              </PressableSpring>
            </View>
          </View>
          {sortedGoals.length === 0 ? (
            <Text style={styles.empty}>Aucune campagne club active.</Text>
          ) : (
            sortedGoals.map((goal) => {
              const pct = Math.min(
                100,
                Math.round((goal.raised_amount_eur / goal.target_amount_eur) * 100)
              );
              const isOpen = contributeId === goal.id;
              return (
                <View key={goal.id} style={styles.goalCard}>
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                  <Text style={styles.goalDesc}>{goal.description}</Text>
                  <View style={styles.goalTrack}>
                    <View style={[styles.goalFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={styles.goalAmount}>
                    {goal.raised_amount_eur} € / {goal.target_amount_eur} € ({pct} %)
                  </Text>
                  {isOpen ? (
                    <View style={styles.contribRow}>
                      <TextInput
                        style={styles.contribInput}
                        placeholder="Montant €"
                        placeholderTextColor={SPONSOR_THEME.textMuted}
                        keyboardType="decimal-pad"
                        value={amount}
                        onChangeText={setAmount}
                      />
                      <PressableSpring
                        style={styles.contribBtn}
                        onPress={() => void handleContribute()}
                        disabled={contributing}
                      >
                        <Text style={styles.contribBtnText}>{contributing ? '…' : 'Soutenir'}</Text>
                      </PressableSpring>
                    </View>
                  ) : (
                    <PressableSpring style={styles.supportBtn} onPress={() => setContributeId(goal.id)}>
                      <Text style={styles.supportBtnText}>Financer ce club</Text>
                    </PressableSpring>
                  )}
                </View>
              );
            })
          )}
        </>
      ) : null}

      {contributions.length > 0 ? (
        <>
          <Text style={[styles.sectionTitle, styles.sectionGap]}>Mes contributions</Text>
          {contributions.map((c) => (
            <View key={c.id} style={styles.contribCard}>
              <Text style={styles.contribTitle}>{c.goal_title}</Text>
              <Text style={styles.contribMeta}>
                {c.amount_eur} € · {c.at.toLocaleDateString('fr-FR')}
              </Text>
            </View>
          ))}
        </>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SPONSOR_THEME.background },
  content: { padding: spacing.lg, paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl },
  guest: { textAlign: 'center', color: SPONSOR_THEME.textMuted, padding: spacing.xl },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: SPONSOR_THEME.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  createBtnText: { color: SPONSOR_THEME.onPrimary, fontWeight: '800', fontSize: 14 },
  filters: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: SPONSOR_THEME.borderSubtle,
    backgroundColor: SPONSOR_THEME.surface,
  },
  filterChipOn: { backgroundColor: SPONSOR_THEME.primary, borderColor: SPONSOR_THEME.primary },
  filterText: { fontSize: 12, fontWeight: '700', color: SPONSOR_THEME.textMuted },
  filterTextOn: { color: SPONSOR_THEME.onPrimary },
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
  clubToolbar: { marginBottom: spacing.sm },
  clubFilters: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  miniChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: SPONSOR_THEME.borderSubtle,
    backgroundColor: SPONSOR_THEME.surface,
  },
  miniChipOn: { backgroundColor: SPONSOR_THEME.primarySoft, borderColor: SPONSOR_THEME.primary },
  miniChipText: { fontSize: 10, fontWeight: '700', color: SPONSOR_THEME.textMuted },
  miniChipTextOn: { color: SPONSOR_THEME.heroSubtext },
  empty: { fontSize: 13, color: SPONSOR_THEME.textMuted, marginBottom: spacing.md },
  goalCard: {
    backgroundColor: SPONSOR_THEME.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: SPONSOR_THEME.borderSubtle,
    marginBottom: spacing.sm,
  },
  goalTitle: { fontSize: 15, fontWeight: '800', color: SPONSOR_THEME.text },
  goalDesc: { fontSize: 12, color: SPONSOR_THEME.textMuted, marginTop: 4, lineHeight: 16 },
  goalTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: SPONSOR_THEME.primarySoft,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  goalFill: { height: '100%', backgroundColor: SPONSOR_THEME.primary },
  goalAmount: { fontSize: 12, fontWeight: '700', color: SPONSOR_THEME.textSecondary, marginTop: spacing.xs },
  supportBtn: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: SPONSOR_THEME.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  supportBtnText: { fontSize: 12, fontWeight: '800', color: SPONSOR_THEME.heroSubtext },
  contribRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  contribInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: SPONSOR_THEME.borderSubtle,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: SPONSOR_THEME.surfaceMuted,
    color: SPONSOR_THEME.text,
  },
  contribBtn: {
    backgroundColor: SPONSOR_THEME.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  contribBtnText: { color: SPONSOR_THEME.onPrimary, fontWeight: '800', fontSize: 12 },
  contribCard: {
    backgroundColor: SPONSOR_THEME.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: SPONSOR_THEME.borderSubtle,
    marginBottom: spacing.sm,
  },
  contribTitle: { fontSize: 14, fontWeight: '800', color: SPONSOR_THEME.text },
  contribMeta: { fontSize: 12, color: SPONSOR_THEME.textMuted, marginTop: 4 },
});
