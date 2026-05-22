import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { User } from '../models/User';
import { ROLES_REQUIRING_VERIFICATION } from '../models/User';
import { formatTimeAgo } from '../services/recruitment.service';
import { messagesService } from '../services/messages.service';
import { profileService } from '../services/profile.service';
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
import { ClubsListScreen } from './ClubsListScreen';
import { CreateClubScreen } from './CreateClubScreen';
import { CreateRecruitmentPostScreen } from './CreateRecruitmentPostScreen';
import { RecruitmentPostScreen } from './RecruitmentPostScreen';
import { useMercatoHome, useUserProfile } from '../hooks/useRecruitmentData';
import { useAuth } from '../context/AuthContext';
import { useTabNavigation } from '../context/TabNavigationContext';
import { formatCount } from '../services/stats.service';

type MercatoView =
  | 'home'
  | 'players'
  | 'player_profile'
  | 'clubs'
  | 'staff'
  | 'staff_profile'
  | 'create_post'
  | 'create_club'
  | 'post_detail';

export const MercatoScreen: React.FC = () => {
  const [view, setView] = useState<MercatoView>('home');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const { user: selectedPlayer, loading: loadingPlayer } =
    useUserProfile(selectedPlayerId);
  const { user: selectedStaff, loading: loadingStaff } =
    useUserProfile(selectedStaffId);

  const { profile } = useAuth();
  const { openChat } = useTabNavigation();
  const { stats, loading: loadingStats, posts, loadingLists, refreshLists } =
    useMercatoHome();

  const filteredPosts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter(
      (ad) =>
        ad.club_name.toLowerCase().includes(q) ||
        ad.position.toLowerCase().includes(q) ||
        (ad.title?.toLowerCase().includes(q) ?? false) ||
        ad.city.toLowerCase().includes(q) ||
        ad.category.toLowerCase().includes(q)
    );
  }, [posts, search]);

  const handleContact = async (target: User) => {
    if (!profile) {
      Alert.alert('Connexion requise', 'Connectez-vous depuis l’onglet Profil.');
      return;
    }
    if (
      ROLES_REQUIRING_VERIFICATION.includes(profile.role) &&
      !profileService.canPerformSensitiveAction(profile)
    ) {
      Alert.alert(
        'Vérification requise',
        'Validez votre diplôme ou licence pour contacter d’autres profils.'
      );
      return;
    }
    try {
      const threadId = await messagesService.getOrCreateThread(
        profile.uid,
        profile.display_name,
        target.uid,
        target.display_name
      );
      openChat(threadId);
    } catch (e) {
      Alert.alert(
        'Erreur',
        e instanceof Error ? e.message : 'Impossible d’ouvrir la conversation.'
      );
    }
  };

  if (view === 'post_detail' && selectedPostId) {
    return (
      <RecruitmentPostScreen
        postId={selectedPostId}
        profile={profile}
        onBack={() => {
          setSelectedPostId(null);
          setView('home');
        }}
      />
    );
  }

  if (view === 'create_post' && profile) {
    return (
      <CreateRecruitmentPostScreen
        profile={profile}
        onBack={() => setView('home')}
        onCreated={refreshLists}
      />
    );
  }

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
        onContact={handleContact}
      />
    );
  }

  if (view === 'create_club' && profile) {
    return (
      <CreateClubScreen
        profile={profile}
        onBack={() => setView('clubs')}
        onCreated={refreshLists}
      />
    );
  }

  if (view === 'clubs') {
    return (
      <ClubsListScreen
        onBack={() => setView('home')}
        onCreateClub={
          profile
            ? () => setView('create_club')
            : undefined
        }
      />
    );
  }

  if (view === 'staff') {
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
        onBack={() => setView('staff')}
        onContact={handleContact}
        onHire={handleContact}
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
        {search.trim().length > 0 && (
          <TouchableOpacity
            style={styles.searchHint}
            onPress={() => setView('players')}
          >
            <Text style={styles.searchHintText}>
              Voir les joueurs correspondant à « {search.trim()} »
            </Text>
          </TouchableOpacity>
        )}

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
        <TouchableOpacity style={styles.staffLink} onPress={() => setView('staff')}>
          <Text style={styles.staffLinkText}>
            Coachs & agents
            {stats
              ? ` · ${formatCount(stats.coaches + stats.agents, 'profil')}`
              : ''}
          </Text>
          <Icon name="chevron-forward" size={18} color={colors.brand} />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Recrutements populaires</Text>
        {loading ? (
          <ActivityIndicator color={colors.brand} style={styles.loaderInline} />
        ) : filteredPosts.length === 0 ? (
          <Text style={styles.emptyPosts}>
            {posts.length === 0
              ? 'Aucune annonce. Publiez la première depuis le bouton ci-dessous.'
              : 'Aucune annonce ne correspond à votre recherche.'}
          </Text>
        ) : (
          filteredPosts.map((ad) => (
            <RecruitmentAdCard
              key={ad.id}
              clubName={ad.club_name}
              roleLine={ad.title || `Recherche ${ad.position}`}
              meta={`${ad.category} · ${ad.level} · ${formatTimeAgo(ad.created_at)}`}
              onPress={() => {
                setSelectedPostId(ad.id);
                setView('post_detail');
              }}
            />
          ))
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, shadows.fab]}
        onPress={() => {
          if (!profile) {
            Alert.alert('Connexion requise', 'Connectez-vous pour publier une annonce.');
            return;
          }
          setView('create_post');
        }}
      >
        <Icon name="add" size={20} color="#FFFFFF" />
        <Text style={styles.fabText}>Publier une annonce</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { paddingBottom: spacing.md },
  searchHint: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.brandSoft,
    borderRadius: radius.md,
  },
  searchHintText: { color: colors.brand, fontWeight: '600', fontSize: 13 },
  staffLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  staffLinkText: { color: colors.brand, fontWeight: '700', fontSize: 14 },
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
  emptyPosts: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
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
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loaderInline: { marginVertical: spacing.lg },
});
