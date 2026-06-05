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
import { Icon } from '../components/ui/Icon';
import { TAB_BAR_CONTENT_INSET } from '../components/navigation/BottomTabBar';
import { spacing, radius, shadows } from '../theme/designTokens';
import { SearchBar } from '../components/ui/SearchBar';
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
import { StagesListScreen } from './StagesListScreen';
import { StageDetailScreen } from './StageDetailScreen';
import { CreateStageScreen } from './CreateStageScreen';
import { canPublishRecruitmentPost, canPublishStages } from '../utils/roleCapabilities';
import { useMercatoHome, useUserProfile } from '../hooks/useRecruitmentData';
import { useAuth } from '../context/AuthContext';
import { useTabNavigation } from '../context/TabNavigationContext';
import { useTabNavigationActions } from '../hooks/useTabNavigationActions';
import { formatCount } from '../services/stats.service';
import { recruitmentService } from '../services/recruitment.service';
import { openContactConversation } from '../utils/openContactConversation';
import { MercatoHero } from '../components/mercato/MercatoHero';
import { MercatoScreenHeader } from '../components/mercato/MercatoScreenHeader';
import { MercatoQuickGrid } from '../components/mercato/MercatoQuickGrid';
import { MercatoActionRow } from '../components/mercato/MercatoActionRow';
import { MercatoPostsSection } from '../components/mercato/MercatoPostsSection';
import { AppSpaceBanner } from '../components/appSpace/AppSpaceBanner';
import { WomenHubScreen } from './women/WomenHubScreen';
import { UnderU13HubScreen } from './underU13/UnderU13HubScreen';
import { useAppSpace } from '../context/AppSpaceContext';
import { useAppTheme } from '../context/ProductLineContext';
import { postMatchesAppSpace } from '../constants/appSpaces';
import {
  getMercatoExperienceConfig,
  type MercatoQuickTileId,
} from '../content/mercatoExperience';

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
  | 'detections'
  | 'stages'
  | 'stage_detail'
  | 'create_stage'
  | 'women_hub'
  | 'under_u13_hub';

export const MercatoScreen: React.FC = () => {
  const [view, setView] = useState<MercatoView>('home');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [returnView, setReturnView] = useState<MercatoView>('home');
  const [applicationsCount, setApplicationsCount] = useState(0);

  const { user: selectedPlayer, loading: loadingPlayer } =
    useUserProfile(selectedPlayerId);
  const { user: selectedStaff, loading: loadingStaff } =
    useUserProfile(selectedStaffId);

  const { profile } = useAuth();
  const { appSpace, setAppSpace } = useAppSpace();
  const { productLine, colors: themeColors, enterWomanSpace } = useAppTheme();
  const { openChat, pendingMercatoView, clearPendingMercato } = useTabNavigation();
  const { openProfile } = useTabNavigationActions();
  const { stats, loading: loadingStats, posts, loadingLists, refreshLists } =
    useMercatoHome();

  const config = useMemo(
    () => getMercatoExperienceConfig(productLine, profile?.role, appSpace),
    [productLine, profile?.role, appSpace]
  );

  const spacePosts = useMemo(
    () => posts.filter((ad) => postMatchesAppSpace(ad, appSpace, productLine)),
    [posts, appSpace, productLine]
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

  const handleQuickTile = (id: MercatoQuickTileId) => {
    setView(id);
  };

  if (view === 'women_hub') {
    return <WomenHubScreen onBack={() => setView('home')} />;
  }

  if (view === 'under_u13_hub') {
    return <UnderU13HubScreen onBack={() => setView('home')} />;
  }

  if (view === 'detections') {
    return <DetectionEventsScreen onBack={() => setView('home')} />;
  }

  if (view === 'stages') {
    return (
      <StagesListScreen
        profile={profile}
        onBack={() => setView('home')}
        onSelectStage={(id) => {
          setSelectedStageId(id);
          setView('stage_detail');
        }}
        onCreateStage={
          profile && canPublishStages(profile.role)
            ? () => setView('create_stage')
            : undefined
        }
      />
    );
  }

  if (view === 'create_stage' && profile) {
    return (
      <CreateStageScreen
        profile={profile}
        onBack={() => setView('stages')}
        onCreated={() => setView('stages')}
      />
    );
  }

  if (view === 'stage_detail' && selectedStageId) {
    return (
      <StageDetailScreen
        stageId={selectedStageId}
        profile={profile}
        onBack={() => {
          setSelectedStageId(null);
          setView('stages');
        }}
      />
    );
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
        <View style={[styles.loader, { backgroundColor: themeColors.background }]}>
          <ActivityIndicator size="large" color={themeColors.brand} />
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
        onCreatePost={
          profile && canPublishRecruitmentPost(profile.role)
            ? () => {
                setReturnView('staff');
                setView('create_post');
              }
            : undefined
        }
      />
    );
  }

  if (view === 'staff_profile' && selectedStaffId) {
    if (loadingStaff || !selectedStaff) {
      return (
        <View style={[styles.loader, { backgroundColor: themeColors.background }]}>
          <ActivityIndicator size="large" color={themeColors.brand} />
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

  const headerRight = config.showFavoritesHeader ? (
    <TouchableOpacity hitSlop={12} onPress={() => setView('favorites')}>
      <Icon name="bookmark" size={22} color={themeColors.text} />
    </TouchableOpacity>
  ) : config.showDetectionsHeader ? (
    <TouchableOpacity hitSlop={12} onPress={() => setView('detections')}>
      <Icon name="football" size={22} color={themeColors.text} />
    </TouchableOpacity>
  ) : null;

  return (
    <View style={[styles.root, { backgroundColor: themeColors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <MercatoScreenHeader
          eyebrow={config.eyebrow}
          title={config.screenTitle}
          subtitle={config.screenSubtitle}
          colors={themeColors}
          badgeIcon={config.heroIcon}
          rightAction={headerRight}
        />

        <View style={styles.bannerWrap}>
          <AppSpaceBanner
            showHubLinks={productLine === 'homme' || productLine === 'woman'}
            onOpenMenHub={() => setAppSpace('men')}
            onOpenWomenHub={() =>
              productLine === 'homme'
                ? void enterWomanSpace()
                : setView('women_hub')
            }
            onOpenUnderU13Hub={() =>
              productLine === 'homme'
                ? setAppSpace('under_u13')
                : setView('under_u13_hub')
            }
          />
        </View>

        <MercatoHero
          colors={themeColors}
          title={config.heroTitle}
          subtitle={config.heroSubtitle}
          icon={config.heroIcon}
          playersStatLabel={config.playersStatLabel}
          stats={stats}
          loading={loadingStats}
          applicationsCount={
            profile?.role === 'player' ? applicationsCount : undefined
          }
          onApplicationsPress={
            profile?.role === 'player' && applicationsCount > 0
              ? () => openProfile('applications')
              : undefined
          }
        />

        <View style={styles.searchWrap}>
          <SearchBar
            placeholder={config.searchPlaceholder}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {search.trim().length > 0 ? (
          <TouchableOpacity
            style={[
              styles.searchHint,
              {
                backgroundColor: themeColors.surfaceMuted,
                borderColor: themeColors.border,
              },
            ]}
            onPress={() => setView('players')}
          >
            <Icon name="people" size={18} color={themeColors.brand} />
            <Text style={[styles.searchHintText, { color: themeColors.text }]}>
              {config.playersSearchHint} « {search.trim()} »
            </Text>
          </TouchableOpacity>
        ) : null}

        <MercatoQuickGrid
          tiles={config.quickTiles}
          colors={themeColors}
          stats={stats}
          loading={loading}
          onPress={handleQuickTile}
        />

        <MercatoActionRow
          colors={themeColors}
          showFavorites={config.showFavoritesRow}
          staffLabel={config.staffRowLabel}
          staffCount={
            stats
              ? formatCount(stats.coaches + stats.agents, 'profil')
              : undefined
          }
          onFavorites={() => setView('favorites')}
          onStaff={() => setView('staff')}
        />

        <MercatoPostsSection
          colors={themeColors}
          title={config.postsSectionTitle}
          loading={loading}
          posts={filteredPosts}
          hasSpacePosts={spacePosts.length > 0}
          searchActive={search.trim().length > 0}
          emptyAll={config.postsEmptyAll}
          emptySpace={config.postsEmptySpace}
          emptyFiltered={config.postsEmptyFiltered}
          onSelectPost={(id) => {
            setSelectedPostId(id);
            setView('post_detail');
          }}
        />

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {profile && canPublishRecruitmentPost(profile.role) ? (
        <TouchableOpacity
          style={[
            styles.fab,
            shadows.fab,
            { backgroundColor: themeColors.brand, borderColor: themeColors.border },
          ]}
          onPress={() => setView('create_post')}
        >
          <Icon name="add" size={20} color="#FFFFFF" />
          <Text style={styles.fabText}>{config.fabLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingBottom: spacing.md },
  bannerWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  searchWrap: {
    paddingHorizontal: spacing.lg,
  },
  searchHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  searchHintText: { fontWeight: '800', fontSize: 13, flex: 1 },
  bottomSpacer: { height: TAB_BAR_CONTENT_INSET + spacing.lg },
  fab: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: TAB_BAR_CONTENT_INSET - spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  fabText: { fontWeight: '700', fontSize: 16 },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
