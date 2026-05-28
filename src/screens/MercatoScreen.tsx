import React, { useEffect, useMemo, useState } from 'react';
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
import { formatTimeAgo } from '../services/recruitment.service';
import { Icon } from '../components/ui/Icon';
import { TAB_BAR_CONTENT_INSET } from '../components/navigation/BottomTabBar';
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
import { FavoritesListScreen } from './FavoritesListScreen';
import { DetectionEventsScreen } from './DetectionEventsScreen';
import { useMercatoHome, useUserProfile } from '../hooks/useRecruitmentData';
import { useAuth } from '../context/AuthContext';
import { useTabNavigation } from '../context/TabNavigationContext';
import { formatCount } from '../services/stats.service';
import { recruitmentService } from '../services/recruitment.service';
import { openContactConversation } from '../utils/openContactConversation';
import { MercatoHero } from '../components/mercato/MercatoHero';
import { useAppSpace } from '../context/AppSpaceContext';
import { postMatchesAppSpace } from '../constants/appSpaces';
import {
  APP_SPACE_LABELS,
  isFeminineAppSpace,
  isMasculineAppSpace,
  isUnderU13AppSpace,
} from '../models/AppSpace';

type MercatoView =
  | 'home'
  | 'players'
  | 'player_profile'
  | 'clubs'
  | 'staff'
  | 'staff_profile'
  | 'create_post'
  | 'create_club'
  | 'post_detail'
  | 'favorites'
  | 'detections';

export const MercatoScreen: React.FC = () => {
  const [view, setView] = useState<MercatoView>('home');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [returnView, setReturnView] = useState<MercatoView>('home');
  const [applicationsCount, setApplicationsCount] = useState(0);

  const { user: selectedPlayer, loading: loadingPlayer } =
    useUserProfile(selectedPlayerId);
  const { user: selectedStaff, loading: loadingStaff } =
    useUserProfile(selectedStaffId);

  const { profile } = useAuth();
  const { appSpace } = useAppSpace();
  const { openChat, pendingMercatoView, clearPendingMercato } = useTabNavigation();
  const { stats, loading: loadingStats, posts, loadingLists, refreshLists } =
    useMercatoHome();

  const spacePosts = useMemo(
    () => posts.filter((ad) => postMatchesAppSpace(ad, appSpace)),
    [posts, appSpace]
  );

  const filteredPosts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return spacePosts;
    return spacePosts.filter(
      (ad) =>
        ad.club_name.toLowerCase().includes(q) ||
        ad.position.toLowerCase().includes(q) ||
        (ad.title?.toLowerCase().includes(q) ?? false) ||
        ad.city.toLowerCase().includes(q) ||
        ad.category.toLowerCase().includes(q)
    );
  }, [spacePosts, search]);

  useEffect(() => {
    if (!pendingMercatoView) return;
    setView(pendingMercatoView);
    clearPendingMercato();
  }, [pendingMercatoView, clearPendingMercato]);

  useEffect(() => {
    if (!profile || profile.role !== 'player') {
      setApplicationsCount(0);
      return;
    }
    recruitmentService.listMyApplications(profile.uid).then((apps) => {
      setApplicationsCount(apps.length);
    });
  }, [profile]);

  const handleContact = async (target: User) => {
    if (!profile) {
      Alert.alert('Connexion requise', 'Connectez-vous depuis l’onglet Profil.');
      return;
    }
    await openContactConversation(profile, target, target.display_name, openChat);
  };

  if (view === 'detections') {
    return <DetectionEventsScreen onBack={() => setView('home')} />;
  }

  if (view === 'favorites' && profile) {
    return (
      <FavoritesListScreen
        onBack={() => setView('home')}
        onSelectUser={(u) => {
          if (u.role === 'player') {
            setSelectedPlayerId(u.uid);
            setReturnView('favorites');
            setView('player_profile');
          } else {
            setSelectedStaffId(u.uid);
            setReturnView('favorites');
            setView('staff_profile');
          }
        }}
      />
    );
  }

  if (view === 'post_detail' && selectedPostId) {
    return (
      <RecruitmentPostScreen
        postId={selectedPostId}
        profile={profile}
        onBack={() => {
          setSelectedPostId(null);
          setView('home');
        }}
        onViewPlayer={(uid) => {
          setSelectedPlayerId(uid);
          setReturnView('post_detail');
          setView('player_profile');
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
        onBack={() => setView(returnView === 'post_detail' ? 'post_detail' : returnView === 'favorites' ? 'favorites' : 'players')}
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
        onSelectClub={(club) => {
          setSearch(club.name);
          setView('home');
        }}
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
        onCreatePost={() => {
          setReturnView('staff');
          setView('create_post');
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
        onBack={() => setView(returnView === 'favorites' ? 'favorites' : 'staff')}
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
          label="Mercato"
          title={APP_SPACE_LABELS[appSpace]}
          subtitle={
            isUnderU13AppSpace(appSpace)
              ? 'U7, U9, U11 — école de foot et détections poussins.'
              : isFeminineAppSpace(appSpace)
                ? 'Annonces et profils filtrés pour le football féminin.'
                : isMasculineAppSpace(appSpace)
                  ? 'Annonces et profils filtrés pour le football masculin.'
                  : 'Espace dédié.'
          }
          showBrandLogo
          rightAction={
            profile?.role === 'player' ? (
              <TouchableOpacity
                hitSlop={12}
                onPress={() => setView('favorites')}
              >
                <Icon name="bookmark" size={22} color={colors.text} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                hitSlop={12}
                onPress={() => setView('detections')}
              >
                <Icon name="football" size={22} color={colors.text} />
              </TouchableOpacity>
            )
          }
        />
        <MercatoHero
          stats={stats}
          loading={loadingStats}
          applicationsCount={
            profile?.role === 'player' ? applicationsCount : undefined
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
          <QuickAccessCard
            icon="football"
            title="Détections"
            count="Essais & scouting"
            loading={false}
            onPress={() => setView('detections')}
          />
        </View>
        {profile ? (
          <TouchableOpacity
            style={styles.favoritesLink}
            onPress={() => setView('favorites')}
          >
            <Icon name="bookmark" size={18} color={colors.brand} />
            <Text style={styles.favoritesLinkText}>Mes favoris</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity style={styles.staffLink} onPress={() => setView('staff')}>
          <Text style={styles.staffLinkText}>
            Coachs & agents
            {stats
              ? ` · ${formatCount(stats.coaches + stats.agents, 'profil')}`
              : ''}
          </Text>
          <Icon name="chevron-forward" size={18} color={colors.brand} />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>
          Recrutements populaires
          {!loading && posts.length > 0 ? (
            <Text style={styles.liveBadge}> · Live Firebase</Text>
          ) : null}
        </Text>
        {loading ? (
          <ActivityIndicator color={colors.brand} style={styles.loaderInline} />
        ) : filteredPosts.length === 0 ? (
          <Text style={styles.emptyHint}>
            {posts.length === 0
              ? 'Aucune annonce ouverte pour le moment. Soyez le premier à publier une offre Mercato.'
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
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchHintText: { color: colors.text, fontWeight: '800', fontSize: 13 },
  favoritesLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  favoritesLinkText: { color: colors.text, fontWeight: '800', fontSize: 14 },
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
  staffLinkText: { color: colors.text, fontWeight: '800', fontSize: 14 },
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
  liveBadge: { fontSize: 12, fontWeight: '800', color: colors.brand },
  emptyPosts: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  emptyHint: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  bottomSpacer: { height: TAB_BAR_CONTENT_INSET + spacing.lg },
  fab: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: TAB_BAR_CONTENT_INSET - spacing.sm,
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
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
