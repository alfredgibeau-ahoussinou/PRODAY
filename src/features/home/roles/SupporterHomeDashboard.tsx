import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import type { User } from '../../../models/User';
import {
  StaffRoleHomeShell,
  StaffSectionTitle,
  StaffListCard,
  StaffEmptyCard,
} from './staffRoleHomeShared';
import { PressableSpring, StaggerReveal, PushScreenTransition } from '../../../components/motion';
import { Icon, type IconName } from '../../../components/ui/Icon';
import { ProDayText } from '../../../components/ui/ProDayText';
import { useDashboardData } from '../../../hooks/useDashboardData';
import { useTournaments } from '../../../hooks/useTournaments';
import { useFavorites } from '../../../hooks/useFavorites';
import { useProDayBrain } from '../../../hooks/useProDayBrain';
import { useAppTheme } from '../../../context/ProductLineContext';
import { useTabNavigationActions } from '../../../hooks/useTabNavigationActions';
import { useTranslation } from '../../../context/LocaleContext';
import { formatCalendarDate } from '../../../utils/seasonCalendar';
import { ReelsPreviewStrip } from '../components/ReelsPreviewStrip';
import { WeeklyQuestionHomeCard } from '../../../components/weeklyQuestion/WeeklyQuestionHomeCard';
import { ActivityFeedStrip } from '../components/ActivityFeedStrip';
import { buildActivityFeed } from '../../v3/engines/activityFeed.engine';
import type { ActivityFeedItem } from '../../v3/engines/activityFeed.engine';
import { PlayersListScreen } from '../../../screens/PlayersListScreen';
import { PlayerProfileScreen } from '../../../screens/PlayerProfileScreen';
import { FavoritesListScreen } from '../../../screens/FavoritesListScreen';
import { useUserProfile } from '../../../hooks/useRecruitmentData';
import { spacing, radius } from '../../../theme/designTokens';
import type { AppColors } from '../../../theme/universeTheme';
import { trackV3Event } from '../../../core/analytics/v3Events';
import { SupporterLiveScoresStrip } from '../../../components/supporter/SupporterLiveScoresStrip';
import { followsService } from '../../../services/follows.service';
import type { Follow } from '../../../models/Follow';

export interface SupporterHomeProps {
  profile: User;
  unreadMessages: number;
  onRefresh?: () => Promise<void>;
  refreshing?: boolean;
}

type SupporterOverlay = 'players' | 'player_profile' | 'favorites' | null;

type SupporterQuickActionId =
  | 'matchs'
  | 'reels'
  | 'feed'
  | 'discovery'
  | 'favorites'
  | 'shop';

const QUICK_ACTIONS: {
  id: SupporterQuickActionId;
  icon: IconName;
  titleKey: string;
  subKey: string;
  accent?: boolean;
}[] = [
  {
    id: 'matchs',
    icon: 'calendar',
    titleKey: 'roleHome.supporter.action.matchs',
    subKey: 'roleHome.supporter.action.matchsSub',
    accent: true,
  },
  {
    id: 'reels',
    icon: 'videocam',
    titleKey: 'roleHome.supporter.action.reels',
    subKey: 'roleHome.supporter.action.reelsSub',
  },
  {
    id: 'feed',
    icon: 'star-four-points',
    titleKey: 'roleHome.supporter.action.feed',
    subKey: 'roleHome.supporter.action.feedSub',
  },
  {
    id: 'discovery',
    icon: 'search',
    titleKey: 'roleHome.supporter.action.discovery',
    subKey: 'roleHome.supporter.action.discoverySub',
  },
  {
    id: 'favorites',
    icon: 'heart',
    titleKey: 'roleHome.supporter.action.favorites',
    subKey: 'roleHome.supporter.action.favoritesSub',
  },
  {
    id: 'shop',
    icon: 'bag',
    titleKey: 'roleHome.supporter.action.shop',
    subKey: 'roleHome.supporter.action.shopSub',
  },
];

export const SupporterHomeDashboard: React.FC<SupporterHomeProps> = ({
  profile,
  unreadMessages,
  onRefresh,
  refreshing,
}) => {
  const { t } = useTranslation();
  const { colors, productLine } = useAppTheme();
  const styles = useMemo(() => createActionStyles(colors), [colors]);
  const { data, refresh } = useDashboardData(profile);
  const { tournaments, loading: tournamentsLoading, refresh: refreshTournaments } =
    useTournaments();
  const { ids: favoriteIds, loading: favoritesLoading, refresh: refreshFavorites } =
    useFavorites(profile.uid);
  const brain = useProDayBrain(profile, productLine);
  const nav = useTabNavigationActions();

  const [overlay, setOverlay] = useState<SupporterOverlay>(null);
  const [playerReturnOverlay, setPlayerReturnOverlay] = useState<SupporterOverlay>('players');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [follows, setFollows] = useState<Follow[]>([]);
  const { user: selectedPlayer } = useUserProfile(selectedPlayerId);

  const upcomingMatches = useMemo(
    () =>
      data.calendarItems
        .filter((item) => item.starts_at.getTime() > Date.now())
        .slice(0, 4),
    [data.calendarItems]
  );

  const upcomingTournaments = useMemo(
    () => tournaments.filter((tournament) => tournament.starts_at.getTime() > Date.now()).slice(0, 3),
    [tournaments]
  );

  const activityFeed = useMemo(
    () =>
      buildActivityFeed({
        uid: profile.uid,
        teamEvents: data.teamEvents,
        openMatches: data.openMatches,
        applications: data.myApplications,
      }),
    [profile.uid, data.teamEvents, data.openMatches, data.myApplications]
  );

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      refresh(),
      refreshTournaments(),
      refreshFavorites(),
      profile?.uid
        ? followsService.listByFollower(profile.uid).then(setFollows).catch(() => setFollows([]))
        : Promise.resolve(),
    ]);
    await onRefresh?.();
  }, [refresh, refreshTournaments, refreshFavorites, onRefresh, profile?.uid]);

  useEffect(() => {
    if (!profile?.uid) return;
    void followsService
      .listByFollower(profile.uid)
      .then(setFollows)
      .catch(() => setFollows([]));
  }, [profile?.uid]);

  const handleQuickAction = (id: SupporterQuickActionId) => {
    trackV3Event('supporter_home_action', { action: id });
    switch (id) {
      case 'matchs':
        nav.openMatchs({ homeTab: 'season' });
        break;
      case 'reels':
        nav.setActiveTab('reels');
        break;
      case 'feed':
        nav.setActiveTab('messages');
        break;
      case 'discovery':
        setOverlay('players');
        break;
      case 'favorites':
        nav.setActiveTab('feed');
        break;
      case 'shop':
        nav.openShop();
        break;
    }
  };

  const handleActivityPress = useCallback(
    (item: ActivityFeedItem) => {
      trackV3Event('activity_feed_tap', { kind: item.kind, tab: item.tab });
      nav.setActiveTab(item.tab as Parameters<typeof nav.setActiveTab>[0]);
    },
    [nav]
  );

  const favoriteCount = favoriteIds.size;
  const followedClubs = follows.filter((f) => f.target_type === 'club').slice(0, 4);
  const followedPlayers = follows.filter((f) => f.target_type === 'player').slice(0, 4);

  return (
    <>
      <StaffRoleHomeShell
        profile={profile}
        role="supporter"
        unreadMessages={unreadMessages}
        globalScore={data.pulse.score}
        loading={data.loading || tournamentsLoading || favoritesLoading}
        onRefresh={() => void handleRefresh()}
        refreshing={refreshing}
      >
        <StaffSectionTitle
          title={t('roleHome.supporter.quickActions')}
          subtitle={t('roleHome.supporter.quickActionsSub')}
        />
        <View style={styles.grid}>
          {QUICK_ACTIONS.map((action, index) => (
            <StaggerReveal key={action.id} index={index + 1} delayStep={40}>
              <PressableSpring
                style={[styles.tile, action.accent && { borderColor: colors.accent }]}
                onPress={() => handleQuickAction(action.id)}
                scaleTo={0.97}
                haptic
              >
                <Icon
                  name={action.icon}
                  size={20}
                  color={action.accent ? colors.accent : colors.text}
                />
                <ProDayText variant="body" style={styles.tileTitle}>
                  {t(action.titleKey)}
                </ProDayText>
                <ProDayText variant="caption" muted numberOfLines={2}>
                  {t(action.subKey)}
                </ProDayText>
              </PressableSpring>
            </StaggerReveal>
          ))}
        </View>

        <StaffSectionTitle
          title={t('supporter.home.liveTitle')}
          subtitle={t('supporter.home.liveSub')}
        />
        <SupporterLiveScoresStrip onViewAll={() => nav.openMatchs({ homeTab: 'season' })} />

        <StaffSectionTitle
          title={t('roleHome.supporter.matchesTitle')}
          subtitle={t('roleHome.supporter.matchesSub')}
        />
        {upcomingMatches.length === 0 ? (
          <StaffEmptyCard message={t('roleHome.supporter.noMatches')} />
        ) : (
          upcomingMatches.map((item, index) => (
            <StaffListCard
              key={item.id}
              index={index + 1}
              title={item.title}
              subtitle={item.subtitle}
              meta={formatCalendarDate(item.starts_at)}
              onPress={() => nav.openMatchs({ homeTab: 'season' })}
            />
          ))
        )}

        <StaffSectionTitle
          title={t('roleHome.supporter.tournamentsTitle')}
          subtitle={t('roleHome.supporter.tournamentsSub')}
        />
        {upcomingTournaments.length === 0 ? (
          <StaffEmptyCard message={t('roleHome.supporter.noTournaments')} />
        ) : (
          upcomingTournaments.map((tournament, index) => (
            <StaffListCard
              key={tournament.id}
              index={index + 5}
              title={tournament.title}
              subtitle={tournament.city}
              meta={formatCalendarDate(tournament.starts_at)}
              onPress={() => nav.openMatchs({ homeTab: 'tournois' })}
            />
          ))
        )}

        <StaffSectionTitle
          title={t('supporter.home.followedClubsTitle')}
          subtitle={t('supporter.home.followedClubsSub')}
        />
        {followedClubs.length === 0 ? (
          <StaffEmptyCard message={t('supporter.home.noFollowedClubs')} />
        ) : (
          followedClubs.map((follow, index) => (
            <StaffListCard
              key={follow.id}
              index={index + 6}
              title={follow.target_label ?? follow.target_id}
              subtitle={t('supporter.followType.club')}
              onPress={() => nav.setActiveTab('feed')}
            />
          ))
        )}

        <StaffSectionTitle
          title={t('supporter.home.followedPlayersTitle')}
          subtitle={t('supporter.home.followedPlayersSub')}
        />
        {followedPlayers.length === 0 ? (
          <StaffEmptyCard message={t('supporter.home.noFollowedPlayers')} />
        ) : (
          followedPlayers.map((follow, index) => (
            <StaffListCard
              key={follow.id}
              index={index + 7}
              title={follow.target_label ?? follow.target_id}
              subtitle={t('supporter.followType.player')}
              onPress={() => nav.setActiveTab('feed')}
            />
          ))
        )}

        <ReelsPreviewStrip
          items={brain.reelPreviews}
          onPress={() => nav.setActiveTab('reels')}
        />

        <WeeklyQuestionHomeCard profile={profile} onOpenFeed={() => nav.setActiveTab('messages')} />

        <StaffSectionTitle
          title={t('roleHome.supporter.favoritesTitle')}
          subtitle={t('roleHome.supporter.favoritesSub')}
        />
        <StaffListCard
          index={8}
          title={
            favoriteCount > 0
              ? t('roleHome.supporter.favoritesCount', { n: favoriteCount })
              : t('roleHome.supporter.favoritesEmpty')
          }
          subtitle={t('roleHome.supporter.favoritesHint')}
          meta={favoriteCount > 0 ? String(favoriteCount) : undefined}
          onPress={() => setOverlay('favorites')}
        />

        {activityFeed.length > 0 ? (
          <ActivityFeedStrip items={activityFeed} onPressItem={handleActivityPress} />
        ) : (
          <StaffListCard
            index={9}
            title={t('roleHome.supporter.feedTeaser')}
            subtitle={t('roleHome.supporter.feedTeaserSub')}
            onPress={() => nav.setActiveTab('messages')}
          />
        )}
      </StaffRoleHomeShell>

      <PushScreenTransition active={overlay === 'players'}>
        {overlay === 'players' ? (
          <PlayersListScreen
            onBack={() => setOverlay(null)}
            onSelectPlayer={(player) => {
              setSelectedPlayerId(player.uid);
              setPlayerReturnOverlay('players');
              setOverlay('player_profile');
            }}
          />
        ) : null}
      </PushScreenTransition>

      <PushScreenTransition active={overlay === 'player_profile' && Boolean(selectedPlayer)}>
        {overlay === 'player_profile' && selectedPlayer ? (
          <PlayerProfileScreen
            player={selectedPlayer}
            onBack={() => {
              setOverlay(playerReturnOverlay);
              setSelectedPlayerId(null);
            }}
          />
        ) : null}
      </PushScreenTransition>

      <PushScreenTransition active={overlay === 'favorites'}>
        {overlay === 'favorites' ? (
          <FavoritesListScreen
            onBack={() => setOverlay(null)}
            onSelectUser={(user) => {
              if (user.role === 'player') {
                setSelectedPlayerId(user.uid);
                setPlayerReturnOverlay('favorites');
                setOverlay('player_profile');
              }
            }}
          />
        ) : null}
      </PushScreenTransition>
    </>
  );
};

const createActionStyles = (c: AppColors) =>
  StyleSheet.create({
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    tile: {
      width: '48%',
      flexGrow: 1,
      minWidth: 140,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      gap: spacing.xs,
    },
    tileTitle: {
      fontWeight: '600',
    },
  });
