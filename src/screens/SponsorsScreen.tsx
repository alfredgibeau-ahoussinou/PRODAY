import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useTabNavigationOptional } from '../context/TabNavigationContext';
import { useSponsorsData } from '../hooks/useAppData';
import { sponsorsService } from '../services/sponsors.service';
import { CreateSponsorOfferScreen } from './CreateSponsorOfferScreen';
import { CreateClubFundingGoalScreen } from './CreateClubFundingGoalScreen';
import { SponsorPublicProfileScreen } from './SponsorPublicProfileScreen';
import { TAB_BAR_CONTENT_INSET } from '../components/navigation/BottomTabBar';
import { spacing, radius, shadows } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';
import { useRequireAuth } from '../hooks/useRequireAuth';
import type { AppColors } from '../theme/universeTheme';
import { PushScreenTransition } from '../components/motion';

type SponsorsView = 'main' | 'create_offer' | 'create_goal' | 'sponsor_profile';

interface SponsorsScreenProps {
  onBack?: () => void;
  guestMode?: boolean;
  onLoginRequired?: () => void;
  onPartnerHub?: () => void;
}

export const SponsorsScreen: React.FC<SponsorsScreenProps> = ({
  onBack,
  guestMode = false,
  onLoginRequired,
  onPartnerHub,
}) => {
  const { profile } = useAuth();
  const tabNav = useTabNavigationOptional();
  const { requireAuth } = useRequireAuth();
  const { colors: c, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);
  const { offers, goals, loading, refresh } = useSponsorsData();
  const [view, setView] = useState<SponsorsView>('main');
  const [refreshing, setRefreshing] = useState(false);
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState('');
  const [contributing, setContributing] = useState(false);
  const [profileSponsorUid, setProfileSponsorUid] = useState<string | null>(null);
  const [profileOfferId, setProfileOfferId] = useState<string | undefined>();

  const totalRaised = goals.reduce((sum, g) => sum + g.raised_amount_eur, 0);
  const isSponsor = profile?.role === 'sponsor';
  const canCreateGoal =
    profile &&
    (profile.role === 'coach' ||
      profile.role === 'organizer' ||
      profile.role === 'agent' ||
      profile.role === 'club');
  const clubId = profile?.profile.club_id ?? profile?.uid;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  useEffect(() => {
    if (loading || offers.length === 0) return;
    for (const offer of offers) {
      void sponsorsService.trackOfferView(offer.id);
    }
  }, [loading, offers]);

  const openSponsorProfile = (offer: (typeof offers)[number]) => {
    if (!offer.sponsor_uid) return;
    void sponsorsService.trackOfferClick(offer.id);
    setProfileOfferId(offer.id);
    setProfileSponsorUid(offer.sponsor_uid);
    setView('sponsor_profile');
  };

  const handleOfferLead = (offer: (typeof offers)[number]) => {
    void sponsorsService.trackOfferLead(offer.id);
  };

  const guardAuth = (action: () => void) => {
    if (!requireAuth('Connectez-vous pour utiliser le module Sponsors.')) {
      if (guestMode) onLoginRequired?.();
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

  let subView: React.ReactNode = null;

  if (view === 'sponsor_profile' && profileSponsorUid) {
    subView = (
      <SponsorPublicProfileScreen
        sponsorUid={profileSponsorUid}
        initialOfferId={profileOfferId}
        guestMode={guestMode}
        onLoginRequired={onLoginRequired}
        onOpenChat={(threadId) => tabNav?.openChat(threadId)}
        onBack={() => {
          setView('main');
          setProfileSponsorUid(null);
          setProfileOfferId(undefined);
        }}
      />
    );
  } else if (view === 'create_offer' && profile) {
    subView = (
      <CreateSponsorOfferScreen
        sponsorUid={profile.uid}
        onBack={() => setView('main')}
        onCreated={refresh}
      />
    );
  } else if (view === 'create_goal' && clubId) {
    subView = (
      <CreateClubFundingGoalScreen
        clubId={clubId}
        onBack={() => setView('main')}
        onCreated={refresh}
      />
    );
  }

  return (
    <>
    <View style={[styles.root, rootStyle]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.brand} />
        }
      >
        {onBack ? (
          <ScreenHeader
            title="Sponsors"
            subtitle={guestMode ? 'Aperçu communauté' : 'Sponsors & financement'}
            onBack={onBack}
          />
        ) : (
          <ScreenHeader title="Sponsors" subtitle="Sponsors locaux & financement" showBrandLogo />
        )}

        {guestMode ? (
          <View style={styles.guestBanner}>
            <Text style={styles.guestBannerText}>
              Données réelles ProDay. Connectez-vous pour publier ou soutenir une campagne.
            </Text>
          </View>
        ) : null}

        {!guestMode && profile?.role !== 'sponsor' ? (
          <TouchableOpacity
            style={styles.partnerBanner}
            onPress={() => onPartnerHub?.()}
            activeOpacity={0.9}
          >
            <View style={styles.partnerBannerIcon}>
              <Icon name="star-four-points" size={22} color={c.brand} />
            </View>
            <View style={styles.partnerBannerBody}>
              <Text style={styles.partnerBannerTitle}>Devenir sponsor ProDay</Text>
              <Text style={styles.partnerBannerSub}>
                Espace dédié, tarifs dès 0 €. Visibilité clubs et joueurs
              </Text>
            </View>
            <Icon name="chevron-forward" size={18} color={c.textMuted} />
          </TouchableOpacity>
        ) : null}

        <View style={[styles.hero, shadows.card]}>
          <View style={styles.heroIcon}>
            <Icon name="star-four-points" size={26} color={c.brand} />
          </View>
          <Text style={styles.heroEyebrow}>PARTENARIATS PRODAY</Text>
          <Text style={styles.heroTitle}>Soutenez le foot local</Text>
          <Text style={styles.heroSub}>
            Offres sponsors et campagnes de financement club. Connectez votre territoire à
            votre projet sportif.
          </Text>
          {!loading && goals.length > 0 ? (
            <Text style={styles.heroStat}>
              {totalRaised.toLocaleString('fr-FR')} € déjà levés sur ProDay
            </Text>
          ) : null}
        </View>

        <Text style={styles.sectionLabel}>OFFRES SPONSORS</Text>
        {loading ? (
          <ActivityIndicator color={c.brand} style={styles.loader} />
        ) : offers.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="business" size={32} color={c.brand} />
            <Text style={styles.emptyText}>Aucune offre active pour le moment.</Text>
          </View>
        ) : (
          offers.map((o) => (
            <TouchableOpacity
              key={o.id}
              style={styles.offer}
              activeOpacity={0.92}
              onPress={() => openSponsorProfile(o)}
            >
              <View style={styles.offerIcon}>
                <Icon name="business" size={20} color={c.brand} />
              </View>
              <View style={styles.offerBody}>
                <Text style={styles.offerTitle}>{o.company_name}</Text>
                <Text style={styles.offerDesc}>{o.description}</Text>
                {o.value ? <Text style={styles.offerValue}>{o.value}</Text> : null}
                {o.city ? <Text style={styles.offerCity}>{o.city}</Text> : null}
                <TouchableOpacity
                  style={styles.offerCta}
                  onPress={() => {
                    openSponsorProfile(o);
                    handleOfferLead(o);
                  }}
                >
                  <Text style={styles.offerCtaText}>En savoir plus</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
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
                  {g.target_amount_eur.toLocaleString('fr-FR')} €. {pct} %
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
                        placeholderTextColor={c.textMuted}
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
                        <Icon name="close" size={20} color={c.textMuted} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.supportBtn}
                      onPress={() =>
                        guardAuth(() => {
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
              onPress={() => guardAuth(() => setView('create_goal'))}
            >
              <Icon name="add" size={18} color={c.brand} />
              <Text style={styles.fabSecondaryText}>Campagne</Text>
            </TouchableOpacity>
          ) : null}
          {isSponsor ? (
            <TouchableOpacity
              style={styles.fab}
              onPress={() => guardAuth(() => setView('create_offer'))}
            >
              <Icon name="add" size={18} color={c.brandInverse} />
              <Text style={styles.fabText}>Offre sponsor</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </View>
    <PushScreenTransition active={view !== 'main'}>{subView}</PushScreenTransition>
    </>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    container: { flex: 1 },
    content: { padding: spacing.lg, paddingBottom: TAB_BAR_CONTENT_INSET + 88 },
    guestBanner: {
      backgroundColor: c.brandSoft,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: c.brand,
    },
    guestBannerText: { fontSize: 12, color: c.brand, fontWeight: '700', lineHeight: 17 },
    partnerBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: c.brand,
    },
    partnerBannerIcon: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      backgroundColor: c.brandSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    partnerBannerBody: { flex: 1 },
    partnerBannerTitle: { fontSize: 14, fontWeight: '800', color: c.text },
    partnerBannerSub: { fontSize: 12, color: c.textSecondary, marginTop: 2, lineHeight: 16 },
    hero: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: c.brand,
    },
    heroIcon: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      backgroundColor: c.brandSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    heroEyebrow: { fontSize: 10, fontWeight: '800', color: c.brand, letterSpacing: 1 },
    heroTitle: { fontSize: 22, fontWeight: '900', color: c.text, marginTop: 4 },
    heroSub: {
      fontSize: 13,
      color: c.textSecondary,
      lineHeight: 19,
      marginTop: spacing.xs,
    },
    heroStat: {
      marginTop: spacing.sm,
      fontSize: 12,
      fontWeight: '800',
      color: c.brand,
    },
    sectionLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: c.brand,
      letterSpacing: 1,
      marginBottom: spacing.md,
    },
    mt: { marginTop: spacing.xl },
    loader: { marginVertical: spacing.lg },
    empty: { alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
    emptyText: { color: c.textMuted, fontSize: 14, fontWeight: '700' },
    hint: { color: c.textMuted, fontSize: 13, marginBottom: spacing.md },
    offer: {
      flexDirection: 'row',
      gap: spacing.md,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: c.border,
    },
    offerIcon: {
      width: 44,
      height: 44,
      borderRadius: radius.sm,
      backgroundColor: c.brandSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    offerBody: { flex: 1 },
    offerTitle: { color: c.text, fontWeight: '900', fontSize: 16 },
    offerDesc: { color: c.textSecondary, marginTop: 6, fontSize: 13, lineHeight: 18 },
    offerValue: { color: c.brand, marginTop: 8, fontSize: 12, fontWeight: '800' },
    offerCity: { color: c.textMuted, marginTop: 4, fontSize: 11 },
    offerCta: {
      marginTop: spacing.sm,
      alignSelf: 'flex-start',
      backgroundColor: c.brandSoft,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderWidth: 1,
      borderColor: c.brand,
    },
    offerCtaText: { color: c.brand, fontWeight: '800', fontSize: 12 },
    progressCard: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: c.border,
    },
    progressTitle: { color: c.text, fontWeight: '800', fontSize: 15 },
    progressDesc: { color: c.textSecondary, fontSize: 12, marginTop: 4, lineHeight: 17 },
    barBg: {
      height: 8,
      backgroundColor: c.surfaceMuted,
      borderRadius: 4,
      marginTop: spacing.md,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.border,
    },
    barFill: { height: '100%', backgroundColor: c.brand, borderRadius: 4 },
    progressMeta: { color: c.textMuted, fontSize: 12, marginTop: spacing.sm, fontWeight: '600' },
    supportBtn: {
      marginTop: spacing.md,
      backgroundColor: c.brandSoft,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.brand,
    },
    supportBtnText: { color: c.brand, fontWeight: '800', fontSize: 13 },
    contributeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    contributeInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      padding: spacing.sm,
      fontSize: 15,
      backgroundColor: c.surface,
      color: c.text,
    },
    contributeBtn: {
      backgroundColor: c.brand,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
    },
    contributeBtnText: { color: c.brandInverse, fontWeight: '800' },
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
      backgroundColor: c.brand,
      borderRadius: radius.lg,
      paddingVertical: spacing.md,
    },
    fabText: { color: c.brandInverse, fontWeight: '800', fontSize: 14 },
    fabSecondary: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.brand,
      borderRadius: radius.lg,
      paddingVertical: spacing.md,
    },
    fabSecondaryText: { color: c.brand, fontWeight: '800', fontSize: 14 },
  });
}
