import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Icon } from '../components/ui/Icon';
import { useAuth } from '../context/AuthContext';
import { useSponsorsData } from '../hooks/useAppData';
import { sponsorsService } from '../services/sponsors.service';
import { CreateSponsorOfferScreen } from './CreateSponsorOfferScreen';
import { CreateClubFundingGoalScreen } from './CreateClubFundingGoalScreen';
import { TAB_BAR_CONTENT_INSET } from '../components/navigation/BottomTabBar';
import { colors, spacing, radius, shadows } from '../theme/designTokens';

type SponsorsView = 'main' | 'create_offer' | 'create_goal';

interface SponsorsScreenProps {
  onBack?: () => void;
  guestMode?: boolean;
  onLoginRequired?: () => void;
}

export const SponsorsScreen: React.FC<SponsorsScreenProps> = ({
  onBack,
  guestMode = false,
  onLoginRequired,
}) => {
  const { profile } = useAuth();
  const { offers, goals, loading, refresh } = useSponsorsData();
  const [view, setView] = useState<SponsorsView>('main');
  const [refreshing, setRefreshing] = useState(false);
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState('');
  const [contributing, setContributing] = useState(false);

  const totalRaised = goals.reduce((sum, g) => sum + g.raised_amount_eur, 0);
  const isSponsor = profile?.role === 'sponsor';
  const canCreateGoal =
    profile &&
    (profile.role === 'coach' || profile.role === 'organizer' || profile.role === 'agent');
  const clubId = profile?.profile.club_id ?? profile?.uid;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const requireAuth = (action: () => void) => {
    if (guestMode || !profile) {
      onLoginRequired?.();
      Alert.alert('Connexion requise', 'Connectez-vous pour utiliser le module Sponsors.');
      return;
    }
    action();
  };

  const handleContribute = async () => {
    if (!contributeGoalId || !profile) return;
    const amount = Number(contributeAmount.replace(',', '.'));
    if (!amount || amount <= 0) {
      Alert.alert('Montant invalide', 'Indiquez un montant en euros.');
      return;
    }
    setContributing(true);
    try {
      await sponsorsService.contributeToGoal(contributeGoalId, amount);
      Alert.alert('Merci !', `${amount} € ajoutés à la campagne.`);
      setContributeGoalId(null);
      setContributeAmount('');
      await refresh();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Contribution impossible.');
    } finally {
      setContributing(false);
    }
  };

  if (view === 'create_offer' && profile) {
    return (
      <CreateSponsorOfferScreen
        sponsorUid={profile.uid}
        onBack={() => setView('main')}
        onCreated={refresh}
      />
    );
  }

  if (view === 'create_goal' && clubId) {
    return (
      <CreateClubFundingGoalScreen
        clubId={clubId}
        onBack={() => setView('main')}
        onCreated={refresh}
      />
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {onBack ? (
          <ScreenHeader
            title="Sponsors"
            subtitle={guestMode ? 'Aperçu communauté' : 'Partenaires & financement'}
            onBack={onBack}
          />
        ) : (
          <ScreenHeader title="Sponsors" subtitle="Partenaires locaux & financement" showBrandLogo />
        )}

        {guestMode ? (
          <View style={styles.guestBanner}>
            <Text style={styles.guestBannerText}>
              Données réelles ProDay — connectez-vous pour publier ou soutenir une campagne.
            </Text>
          </View>
        ) : null}

        <View style={[styles.hero, shadows.card]}>
          <View style={styles.heroIcon}>
            <Icon name="star-four-points" size={26} color={colors.accent} />
          </View>
          <Text style={styles.heroEyebrow}>PARTENARIATS PRODAY</Text>
          <Text style={styles.heroTitle}>Soutenez le foot local</Text>
          <Text style={styles.heroSub}>
            Offres partenaires et campagnes de financement club — connectez votre territoire à
            votre projet sportif.
          </Text>
          {!loading && goals.length > 0 ? (
            <Text style={styles.heroStat}>
              {totalRaised.toLocaleString('fr-FR')} € déjà levés sur ProDay
            </Text>
          ) : null}
        </View>

        <Text style={styles.sectionLabel}>OFFRES PARTENAIRES</Text>
        {loading ? (
          <ActivityIndicator color={colors.accent} style={styles.loader} />
        ) : offers.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="business" size={32} color={colors.accent} />
            <Text style={styles.emptyText}>Aucune offre active pour le moment.</Text>
          </View>
        ) : (
          offers.map((o) => (
            <View key={o.id} style={styles.offer}>
              <View style={styles.offerIcon}>
                <Icon name="business" size={20} color={colors.accent} />
              </View>
              <View style={styles.offerBody}>
                <Text style={styles.offerTitle}>{o.company_name}</Text>
                <Text style={styles.offerDesc}>{o.description}</Text>
                {o.value ? <Text style={styles.offerValue}>{o.value}</Text> : null}
                {o.city ? <Text style={styles.offerCity}>{o.city}</Text> : null}
              </View>
            </View>
          ))
        )}

        <Text style={[styles.sectionLabel, styles.mt]}>FINANCEMENT CLUB</Text>
        {loading ? null : goals.length === 0 ? (
          <Text style={styles.hint}>Aucun objectif de financement pour le moment.</Text>
        ) : (
          goals.map((g) => {
            const pct =
              g.target_amount_eur > 0
                ? Math.min(100, Math.round((g.raised_amount_eur / g.target_amount_eur) * 100))
                : 0;
            const remaining = Math.max(0, g.target_amount_eur - g.raised_amount_eur);
            const isContributing = contributeGoalId === g.id;

            return (
              <View key={g.id} style={styles.progressCard}>
                <Text style={styles.progressTitle}>{g.title}</Text>
                {g.description ? (
                  <Text style={styles.progressDesc}>{g.description}</Text>
                ) : null}
                <View style={styles.barBg}>
                  <View style={[styles.barFill, { width: `${pct}%` }]} />
                </View>
                <Text style={styles.progressMeta}>
                  {g.raised_amount_eur.toLocaleString('fr-FR')} € /{' '}
                  {g.target_amount_eur.toLocaleString('fr-FR')} € — {pct} %
                </Text>
                {!guestMode && remaining > 0 ? (
                  isContributing ? (
                    <View style={styles.contributeRow}>
                      <TextInput
                        style={styles.contributeInput}
                        placeholder="Montant €"
                        keyboardType="decimal-pad"
                        value={contributeAmount}
                        onChangeText={setContributeAmount}
                        placeholderTextColor={colors.textMuted}
                      />
                      <TouchableOpacity
                        style={styles.contributeBtn}
                        onPress={handleContribute}
                        disabled={contributing}
                      >
                        <Text style={styles.contributeBtnText}>
                          {contributing ? '…' : 'OK'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setContributeGoalId(null)}>
                        <Icon name="close" size={20} color={colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.supportBtn}
                      onPress={() =>
                        requireAuth(() => {
                          setContributeGoalId(g.id);
                          setContributeAmount('');
                        })
                      }
                    >
                      <Text style={styles.supportBtnText}>
                        Soutenir · {remaining.toLocaleString('fr-FR')} € restants
                      </Text>
                    </TouchableOpacity>
                  )
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>

      {!guestMode && (isSponsor || canCreateGoal) ? (
        <View style={styles.fabRow}>
          {canCreateGoal ? (
            <TouchableOpacity
              style={[styles.fab, styles.fabSecondary]}
              onPress={() => requireAuth(() => setView('create_goal'))}
            >
              <Icon name="add" size={18} color={colors.accent} />
              <Text style={styles.fabSecondaryText}>Campagne</Text>
            </TouchableOpacity>
          ) : null}
          {isSponsor ? (
            <TouchableOpacity
              style={styles.fab}
              onPress={() => requireAuth(() => setView('create_offer'))}
            >
              <Icon name="add" size={18} color="#fff" />
              <Text style={styles.fabText}>Offre sponsor</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: TAB_BAR_CONTENT_INSET + 88 },
  guestBanner: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  guestBannerText: { fontSize: 12, color: colors.accent, fontWeight: '700', lineHeight: 17 },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  heroEyebrow: { fontSize: 10, fontWeight: '800', color: colors.accent, letterSpacing: 1 },
  heroTitle: { fontSize: 22, fontWeight: '900', color: colors.text, marginTop: 4 },
  heroSub: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginTop: spacing.xs,
  },
  heroStat: {
    marginTop: spacing.sm,
    fontSize: 12,
    fontWeight: '800',
    color: colors.brand,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  mt: { marginTop: spacing.xl },
  loader: { marginVertical: spacing.lg },
  empty: { alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
  emptyText: { color: colors.textMuted, fontSize: 14, fontWeight: '700' },
  hint: { color: colors.textMuted, fontSize: 13, marginBottom: spacing.md },
  offer: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  offerIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerBody: { flex: 1 },
  offerTitle: { color: colors.text, fontWeight: '900', fontSize: 16 },
  offerDesc: { color: colors.textSecondary, marginTop: 6, fontSize: 13, lineHeight: 18 },
  offerValue: { color: colors.accent, marginTop: 8, fontSize: 12, fontWeight: '800' },
  offerCity: { color: colors.textMuted, marginTop: 4, fontSize: 11 },
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressTitle: { color: colors.text, fontWeight: '800', fontSize: 15 },
  progressDesc: { color: colors.textSecondary, fontSize: 12, marginTop: 4, lineHeight: 17 },
  barBg: {
    height: 8,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 4,
    marginTop: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  barFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 4 },
  progressMeta: { color: colors.textMuted, fontSize: 12, marginTop: spacing.sm, fontWeight: '600' },
  supportBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  supportBtnText: { color: colors.accent, fontWeight: '800', fontSize: 13 },
  contributeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  contributeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontSize: 15,
    backgroundColor: colors.surface,
  },
  contributeBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  contributeBtnText: { color: '#fff', fontWeight: '800' },
  fabRow: {
    position: 'absolute',
    bottom: TAB_BAR_CONTENT_INSET + spacing.md,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  fab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.brand,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  fabText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  fabSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  fabSecondaryText: { color: colors.accent, fontWeight: '800', fontSize: 14 },
});
