import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { TournamentCard } from '../components/TournamentCard';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Icon } from '../components/ui/Icon';
import { useArenaData } from '../hooks/useAppData';
import { useAuth } from '../context/AuthContext';
import { useTabNavigation } from '../context/TabNavigationContext';
import { tournamentService } from '../services/tournament.service';
import { CreateTournamentScreen } from './CreateTournamentScreen';
import { TournamentDetailScreen } from './TournamentDetailScreen';
import type { Tournament } from '../models/Tournament';
import { spacing, radius, shadows } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';
import type { AppColors } from '../theme/universeTheme';
import { useShowcaseImages } from '../hooks/useShowcaseImages';

interface ArenaScreenProps {
  onBack?: () => void;
  guestMode?: boolean;
  onLoginRequired?: () => void;
}

type ArenaView = 'list' | 'create' | 'detail';

export const ArenaScreen: React.FC<ArenaScreenProps> = ({
  onBack,
  guestMode = false,
  onLoginRequired,
}) => {
  const { profile } = useAuth();
  const { colors: c, productLine, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);
  const isWoman = productLine === 'woman';
  const bestPlayerLabel = isWoman ? 'Meilleure joueuse' : 'Meilleur joueur';
  const { pendingArenaTournamentId, clearPendingArenaTournament } = useTabNavigation();
  const [view, setView] = useState<ArenaView>('list');
  const [detailId, setDetailId] = useState<string | null>(null);
  const { tournaments, honorTournament, loading, refresh } = useArenaData();
  const showcase = useShowcaseImages();
  const awards = honorTournament?.awards_names;

  useEffect(() => {
    if (!pendingArenaTournamentId) return;
    setDetailId(pendingArenaTournamentId);
    setView('detail');
    clearPendingArenaTournament();
  }, [pendingArenaTournamentId, clearPendingArenaTournament]);

  const openDetail = (t: Tournament) => {
    setDetailId(t.id);
    setView('detail');
  };

  const handleRegister = async (t: Tournament) => {
    if (guestMode || !profile) {
      onLoginRequired?.();
      Alert.alert('Connexion requise', 'Connectez-vous pour inscrire votre club.');
      return;
    }
    const clubUid = profile.profile.club_id ?? profile.uid;
    if (t.subscriber_uids?.includes(clubUid)) {
      Alert.alert('Déjà inscrit', 'Votre club est déjà inscrit à ce tournoi.');
      return;
    }
    try {
      await tournamentService.registerClub(t.id, clubUid);
      Alert.alert('Inscription enregistrée', `Vous êtes inscrit à ${t.name}.`);
      refresh();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Inscription impossible.');
    }
  };

  if (view === 'create' && profile) {
    return (
      <CreateTournamentScreen
        profile={profile}
        onBack={() => setView('list')}
        onCreated={refresh}
      />
    );
  }

  if (view === 'detail' && detailId) {
    return (
      <TournamentDetailScreen
        tournamentId={detailId}
        onBack={() => {
          setView('list');
          setDetailId(null);
        }}
        onRegistered={refresh}
      />
    );
  }

  const openCount = tournaments.filter((t) => t.status === 'OPEN').length;

  return (
    <View style={[styles.root, rootStyle]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {onBack ? (
          <ScreenHeader title="Arena" subtitle="Tournois ProDay" onBack={onBack} />
        ) : (
          <ScreenHeader title="Arena" subtitle="Tournois ProDay" showBrandLogo />
        )}

        {guestMode ? (
          <View style={styles.guestBanner}>
            <Text style={styles.guestBannerText}>
              Tournois réels sur ProDay — connectez-vous pour créer ou inscrire un club.
            </Text>
          </View>
        ) : null}

        <View style={[styles.hero, shadows.card]}>
          <Image
            source={showcase.arenaTournament}
            style={styles.heroBanner}
            resizeMode="cover"
          />
          <View style={styles.heroIcon}>
            <Icon name="trophy" size={26} color={c.accent} />
          </View>
          <Text style={styles.heroTitle}>Arena ProDay</Text>
          <Text style={styles.heroSub}>
            Tournois locaux, inscriptions club et palmarès — le terrain où votre saison brille.
          </Text>
          {!loading && (
            <Text style={styles.heroStat}>
              {openCount} tournoi{openCount !== 1 ? 's' : ''} ouvert{openCount !== 1 ? 's' : ''}
              {tournaments.length > 0
                ? ` · ${tournaments.length} au total`
                : ''}
            </Text>
          )}
        </View>

        <Text style={styles.section}>Tournois proches</Text>
        {loading ? (
          <ActivityIndicator color={c.brand} style={styles.loader} />
        ) : tournaments.length === 0 ? (
          <Text style={styles.hint}>
            Aucun tournoi pour le moment. Créez le premier avec le bouton ci-dessous.
          </Text>
        ) : (
          tournaments.map((t) => (
            <TournamentCard
              key={t.id}
              tournament={t}
              onPress={openDetail}
              onRegister={
                !guestMode && t.status === 'OPEN' ? handleRegister : undefined
              }
            />
          ))
        )}

        <Text style={[styles.section, styles.mt]}>Tableau d&apos;honneur</Text>
        <View style={styles.honor}>
          <HonorSlot styles={styles} label={bestPlayerLabel} name={awards?.best_player ?? '—'} />
          <HonorSlot styles={styles} label="Buteur" name={awards?.top_scorer ?? '—'} />
          <HonorSlot styles={styles} label="Gardien" name={awards?.best_goalkeeper ?? '—'} />
        </View>
        {!loading && !honorTournament && (
          <Text style={styles.hintSmall}>Publié après clôture d&apos;un tournoi.</Text>
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {profile && !guestMode ? (
        <TouchableOpacity
          style={[styles.fab, shadows.fab]}
          onPress={() => setView('create')}
        >
          <Icon name="add" size={20} color="#FFFFFF" />
          <Text style={styles.fabText}>Créer un tournoi</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const HonorSlot: React.FC<{
  styles: ReturnType<typeof createStyles>;
  label: string;
  name: string;
}> = ({ styles, label, name }) => (
  <View style={styles.honorItem}>
    <Text style={styles.honorLabel}>{label}</Text>
    <Text style={styles.honorName}>{name}</Text>
  </View>
);

function createStyles(c: AppColors) {
  return StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 120 },
  guestBanner: {
    backgroundColor: c.accentSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: c.accent,
  },
  guestBannerText: { fontSize: 12, color: c.accent, fontWeight: '700', lineHeight: 17 },
  hero: {
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: c.accent,
    overflow: 'hidden',
  },
  heroBanner: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.25,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: c.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  heroTitle: { fontSize: 20, fontWeight: '900', color: c.text },
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
  section: {
    fontSize: 13,
    fontWeight: '800',
    color: c.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  mt: { marginTop: spacing.lg },
  loader: { marginVertical: spacing.lg },
  hint: { color: c.textMuted, fontSize: 14, lineHeight: 20 },
  hintSmall: { color: c.textMuted, fontSize: 12, marginTop: spacing.xs },
  honor: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  honorItem: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: c.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: c.border,
  },
  honorLabel: { fontSize: 11, color: c.textMuted, fontWeight: '700' },
  honorName: { fontSize: 14, fontWeight: '800', color: c.text, marginTop: 4 },
  bottomSpacer: { height: spacing.xl },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: c.brand,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  fabText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  featured: {
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: c.border,
    overflow: 'hidden',
  },
  featuredImage: { width: '100%', height: 120 },
  featuredBody: { padding: spacing.md },
  featuredEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: c.accent,
    letterSpacing: 0.8,
  },
  featuredTitle: { fontSize: 17, fontWeight: '900', color: c.text, marginTop: 4 },
  featuredMeta: { fontSize: 12, color: c.textSecondary, marginTop: 4 },
  featuredStat: { fontSize: 11, fontWeight: '800', color: c.brand, marginTop: 6 },
  });
}
