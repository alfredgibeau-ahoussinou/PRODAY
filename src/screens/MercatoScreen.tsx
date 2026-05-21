import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { recruitmentService, formatTimeAgo } from '../services/recruitment.service';
import { Icon } from '../components/ui/Icon';
import { colors, spacing, radius, shadows } from '../theme/designTokens';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { SearchBar } from '../components/ui/SearchBar';
import { QuickAccessCard } from '../components/ui/QuickAccessCard';
import { RecruitmentAdCard } from '../components/ui/RecruitmentAdCard';
import { PlayersListScreen } from './PlayersListScreen';
import { PlayerProfileScreen } from './PlayerProfileScreen';
import { CoachesListScreen } from './CoachesListScreen';
import { CoachProfileScreen } from './CoachProfileScreen';
import { useMercatoHome, useUserProfile } from '../hooks/useRecruitmentData';
import { useAuth } from '../context/AuthContext';
import { formatCount } from '../services/stats.service';

type MercatoView =
  | 'home'
  | 'players'
  | 'player_profile'
  | 'clubs'
  | 'staff_profile';

export const MercatoScreen: React.FC = () => {
  const [view, setView] = useState<MercatoView>('home');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { user: selectedPlayer, loading: loadingPlayer } =
    useUserProfile(selectedPlayerId);
  const { user: selectedStaff, loading: loadingStaff } =
    useUserProfile(selectedStaffId);

  const { profile } = useAuth();
  const { stats, loading: loadingStats, posts, loadingLists, refreshLists } =
    useMercatoHome();
  const [creatingPost, setCreatingPost] = useState(false);

  const handleCreatePost = async () => {
    if (!profile) {
      Alert.alert('Connexion requise', 'Connectez-vous depuis l’onglet Profil pour publier.');
      return;
    }
    setCreatingPost(true);
    try {
      await recruitmentService.createPost({
        club_id: profile.profile.club_id ?? profile.uid,
        club_name: profile.display_name,
        title: 'Recherche joueur',
        position: 'Milieu',
        category: 'Seniors',
        level: 'R2',
        city: 'Marseille',
        description: 'Annonce publiée depuis l’application ProDay.',
      });
      await refreshLists();
      Alert.alert('Annonce créée', 'Votre annonce est visible dans Recrutements populaires.');
    } catch (e) {
      Alert.alert(
        'Erreur',
        e instanceof Error ? e.message : 'Connexion Firebase requise pour publier.'
      );
    } finally {
      setCreatingPost(false);
    }
  };

  if (view === 'players') {
    return (
      <PlayersListScreen
        onBack={() => setView('home')}
        onSelectPlayer={(p) => {
          setSelectedPlayerId(p.uid);
          setView('player_profile');
        }}
      />
    );
  }

  if (view === 'player_profile' && selectedPlayerId) {
    if (loadingPlayer || !selectedPlayer) {
      return (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      );
    }
    return (
      <PlayerProfileScreen
        player={selectedPlayer}
        onBack={() => setView('players')}
      />
    );
  }

  if (view === 'clubs') {
    return (
      <CoachesListScreen
        onBack={() => setView('home')}
        onSelect={(u) => {
          setSelectedStaffId(u.uid);
          setView('staff_profile');
        }}
      />
    );
  }

  if (view === 'staff_profile' && selectedStaffId) {
    if (loadingStaff || !selectedStaff) {
      return (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      );
    }
    return (
      <CoachProfileScreen
        staff={selectedStaff}
        onBack={() => setView('home')}
      />
    );
  }

  const loading = loadingStats || loadingLists;

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Recrutement"
          subtitle="Le bon profil pour le bon projet."
          showBrandLogo
          rightAction={
            <TouchableOpacity hitSlop={12}>
              <Icon name="notifications" size={22} color={colors.text} />
            </TouchableOpacity>
          }
        />
        <SearchBar
          placeholder="Rechercher un joueur, un poste…"
          value={search}
          onChangeText={setSearch}
        />

        <View style={styles.quickRow}>
          <QuickAccessCard
            icon="people"
            title="Joueurs"
            count={
              stats
                ? formatCount(stats.players, 'profil')
                : loading
                  ? '…'
                  : '0 profil'
            }
            loading={loading}
            onPress={() => setView('players')}
          />
          <QuickAccessCard
            icon="business"
            title="Clubs"
            count={
              stats
                ? formatCount(stats.clubs, 'club')
                : loading
                  ? '…'
                  : '0 club'
            }
            loading={loading}
            onPress={() => setView('clubs')}
          />
        </View>

        <Text style={styles.sectionTitle}>Recrutements populaires</Text>
        {loading ? (
          <ActivityIndicator color={colors.brand} style={styles.loaderInline} />
        ) : posts.length === 0 ? (
          <RecruitmentAdCard
            clubName="US Marseille"
            roleLine="Recherche Attaquant"
            meta="U19 · R1 · Publiez une annonce pour commencer"
          />
        ) : (
          posts.map((ad) => (
            <RecruitmentAdCard
              key={ad.id}
              clubName={ad.club_name}
              roleLine={ad.title || `Recherche ${ad.position}`}
              meta={`${ad.category} · ${ad.level} · ${formatTimeAgo(ad.created_at)}`}
            />
          ))
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, shadows.fab, creatingPost && styles.fabDisabled]}
        onPress={handleCreatePost}
        disabled={creatingPost}
      >
        {creatingPost ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <Icon name="add" size={20} color="#FFFFFF" />
            <Text style={styles.fabText}>Publier une annonce</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { paddingBottom: spacing.md },
  quickRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  bottomSpacer: { height: 88 },
  fab: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.md,
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  fabText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  fabDisabled: { opacity: 0.75 },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loaderInline: { marginVertical: spacing.lg },
});
