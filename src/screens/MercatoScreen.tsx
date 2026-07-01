import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { User } from '../models/User';
import { Icon } from '../components/ui/Icon';
import { spacing } from '../theme/designTokens';
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
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useTranslation } from '../context/LocaleContext';
import { recruitmentService } from '../services/recruitment.service';
import { openContactConversation } from '../utils/openContactConversation';
import { guardStaffVerification } from '../utils/staffVerificationGuard';
import { ROLES_REQUIRING_VERIFICATION } from '../models/User';
import { profileService } from '../services/profile.service';
import { CandidatureScreen } from '../components/mercato/CandidatureScreen';
import { MercatoStaffHome } from '../components/mercato/MercatoStaffHome';
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
  | 'create_stage';

import type { MercatoPostScope } from '../utils/mercatoPostFilters';
import {
  filterRecruitmentPostsByScope,
  resolveMercatoPostScope,
} from '../utils/mercatoPostFilters';

type MercatoScreenProps = {
  /** Filtre les annonces (pro joueur / amateur). */
  postScope?: MercatoPostScope;
};

export const MercatoScreen: React.FC<MercatoScreenProps> = ({ postScope }) => {
  const [view, setView] = useState<MercatoView>('home');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [playerListQuery, setPlayerListQuery] = useState('');
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
  const { productLine, colors: themeColors, playerSegment } = useAppTheme();
  const { openChat, pendingMercatoView, clearPendingMercato } = useTabNavigation();
  const { openProfile } = useTabNavigationActions();
  const { requireAuth } = useRequireAuth();
  const { t } = useTranslation();
  const { stats, loading: loadingStats, posts, loadingLists, refreshLists } =
    useMercatoHome();

  const mercatoLine =
    productLine === 'pro_player' || postScope === 'pro'
      ? 'pro_player'
      : productLine === 'amateur' || postScope === 'amateur'
        ? 'amateur'
        : productLine;

  const config = useMemo(
    () => getMercatoExperienceConfig(mercatoLine, profile?.role, appSpace, t, playerSegment),
    [mercatoLine, profile?.role, appSpace, t, playerSegment],
  );

  const scope = postScope ?? resolveMercatoPostScope(mercatoLine);

  const scopedPosts = useMemo(
    () => filterRecruitmentPostsByScope(posts, scope),
    [posts, scope],
  );

  const spacePosts = useMemo(
    () => scopedPosts.filter((ad) => postMatchesAppSpace(ad, appSpace, mercatoLine)),
    [scopedPosts, appSpace, mercatoLine],
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
    if (
      profile &&
      pendingMercatoView === 'create_post' &&
      ROLES_REQUIRING_VERIFICATION.includes(profile.role) &&
      !profileService.canPerformSensitiveAction(profile)
    ) {
      Alert.alert(
        t('mercato.alert.verificationRequired.title'),
        t('mercato.alert.verificationRequired.body'),
      );
      setView('home');
      clearPendingMercato();
      return;
    }
    if (pendingMercatoView === 'home') {
      setView('home');
    } else if (pendingMercatoView === 'detections') {
      setView('detections');
    } else if (pendingMercatoView === 'create_post') {
      setView('create_post');
    } else if (pendingMercatoView === 'stages') {
      setView('stages');
    }
    clearPendingMercato();
  }, [pendingMercatoView, clearPendingMercato, profile]);

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
    if (!requireAuth(t('mercato.auth.contactProfile')) || !profile) return;
    await openContactConversation(profile, target, target.display_name, openChat);
  };

  const handleQuickTile = (id: MercatoQuickTileId) => {
    setView(id);
  };

  const showYouthSpaceBanner = productLine === 'amateur';

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
            ? () => {
                if (!guardStaffVerification(profile)) return;
                setView('create_stage');
              }
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
        initialQuery={playerListQuery}
        onBack={() => {
          setPlayerListQuery('');
          setView('home');
        }}
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
                if (!guardStaffVerification(profile)) return;
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

  const openFavorites = () => {
    if (!requireAuth(t('mercato.auth.favorites'))) return;
    setView('favorites');
  };

  const headerRight = config.showFavoritesHeader ? (
    <TouchableOpacity hitSlop={12} onPress={openFavorites}>
      <Icon name="bookmark" size={22} color={themeColors.text} />
    </TouchableOpacity>
  ) : config.showDetectionsHeader ? (
    <TouchableOpacity hitSlop={12} onPress={() => setView('detections')}>
      <Icon name="football" size={22} color={themeColors.text} />
    </TouchableOpacity>
  ) : null;

  const isPlayerHub = profile?.role === 'player';

  if (isPlayerHub && profile) {
    return (
        <CandidatureScreen
          profile={profile}
          config={config}
          stats={stats}
          loading={loading}
          posts={filteredPosts}
          search={search}
          onSearchChange={setSearch}
          emptyMessage={
            search.trim().length > 0
              ? config.postsEmptyFiltered
              : spacePosts.length === 0
                ? config.postsEmptyAll
                : config.postsEmptySpace
          }
          applicationsCount={applicationsCount}
          productLine={productLine}
          onSelectPost={(id) => {
            setSelectedPostId(id);
            setView('post_detail');
          }}
          onOpenApplications={() => openProfile('applications')}
          onSearchPlayers={(query) => {
            if (query?.trim()) setPlayerListQuery(query.trim());
            else setPlayerListQuery('');
            setView('players');
          }}
          onRefresh={async () => {
            await refreshLists();
          }}
        />
    );
  }

  return (
      <MercatoStaffHome
        profile={profile}
        config={config}
        themeColors={themeColors}
        productLine={productLine}
        stats={stats}
        loading={loading}
        filteredPosts={filteredPosts}
        spacePosts={spacePosts}
        search={search}
        onSearchChange={setSearch}
        headerRight={headerRight}
        showSpaceBanner={showYouthSpaceBanner}
        onOpenMenHub={() => setAppSpace('men')}
        onOpenWomenHub={() => setAppSpace('women')}
        onOpenUnderU13Hub={() => setAppSpace('under_u13')}
        onQuickTile={handleQuickTile}
        onFavorites={openFavorites}
        onStaff={() => setView('staff')}
        onSelectPost={(id) => {
          setSelectedPostId(id);
          setView('post_detail');
        }}
        onCreatePost={
          profile && canPublishRecruitmentPost(profile.role)
            ? () => {
                if (!guardStaffVerification(profile)) return;
                setView('create_post');
              }
            : undefined
        }
        onSearchPlayers={() => setView('players')}
      />
  );
};

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
