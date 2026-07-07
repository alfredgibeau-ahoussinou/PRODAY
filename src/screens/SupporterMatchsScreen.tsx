import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { TabScreenShell } from '../components/app/TabScreenShell';
import { SupporterFilterBar } from '../components/supporter/SupporterFilterBar';
import { SupporterMatchCard } from '../components/supporter/SupporterMatchCard';
import { PressableSpring } from '../components/motion';
import { ProDayText } from '../components/ui/ProDayText';
import { ProDaySurface } from '../components/ui/ProDaySurface';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LocaleContext';
import { useSeasonCalendar } from '../hooks/useAppData';
import { useTournaments } from '../hooks/useTournaments';
import { useTabNavigationActions } from '../hooks/useTabNavigationActions';
import { isInMatchWindow } from '../utils/matchLive';
import { isExternalFixtureLiveNow, isProdayEventLiveNow } from '../utils/supporterLiveMatches';
import { spacing, radius } from '../theme/designTokens';
import { useAppTheme } from '../context/ProductLineContext';
import { followsService } from '../services/follows.service';
import {
  loadSupporterMatchFilters,
  saveSupporterMatchFilters,
  type SupporterMatchFilters,
} from '../services/supporterPreferences.service';
import type { Follow } from '../models/Follow';
import { teamEventsService } from '../services/teamEvents.service';
import { externalScoresService } from '../services/externalScores.service';
import {
  buildFollowContext,
  externalFixtureToMatchItem,
  filterMatchItems,
  filterTournaments,
  teamEventToMatchItem,
  type SupporterMatchViewItem,
} from '../utils/supporterMatchFilters';

type SupporterMatchsChapter = 'live' | 'today' | 'tournaments' | 'follows';

const CHAPTER_KEYS: { id: SupporterMatchsChapter; labelKey: string }[] = [
  { id: 'live', labelKey: 'supporter.chapters.live' },
  { id: 'today', labelKey: 'supporter.chapters.today' },
  { id: 'tournaments', labelKey: 'supporter.chapters.tournaments' },
  { id: 'follows', labelKey: 'supporter.chapters.follows' },
];

export const SupporterMatchsScreen: React.FC = () => {
  const { profile } = useAuth();
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const nav = useTabNavigationActions();
  const { events } = useSeasonCalendar(profile?.uid, profile?.profile.club_id);
  const { tournaments } = useTournaments();
  const [chapter, setChapter] = useState<SupporterMatchsChapter>('live');
  const [follows, setFollows] = useState<Follow[]>([]);
  const [publicEvents, setPublicEvents] = useState<typeof events>([]);
  const [worldFixtures, setWorldFixtures] = useState<Awaited<
    ReturnType<typeof externalScoresService.listFixtures>
  >>([]);
  const [filters, setFilters] = useState<SupporterMatchFilters>({
    gender: 'all',
    source: 'all',
    scope: 'all',
  });

  const loadFollows = useCallback(async () => {
    if (!profile?.uid) return;
    const list = await followsService.listByFollower(profile.uid);
    setFollows(list);
  }, [profile?.uid]);

  useEffect(() => {
    if (!profile?.uid) return;
    loadSupporterMatchFilters(profile.uid)
      .then(setFilters)
      .catch(() => undefined);
    void loadFollows();
  }, [profile?.uid, loadFollows]);

  const loadLiveData = useCallback(async () => {
    const [upcoming, fixtures] = await Promise.all([
      teamEventsService.listUpcoming(60).catch(() => [] as typeof events),
      externalScoresService.listFixtures().catch(() => []),
    ]);
    setPublicEvents(upcoming);
    setWorldFixtures(fixtures);
  }, []);

  useEffect(() => {
    void loadLiveData();
  }, [loadLiveData]);

  useEffect(() => {
    if (chapter !== 'live') return undefined;
    const timer = setInterval(() => {
      void loadLiveData();
    }, 45_000);
    return () => clearInterval(timer);
  }, [chapter, loadLiveData]);

  const followContext = useMemo(() => buildFollowContext(follows), [follows]);
  const followedKeys = useMemo(
    () => new Set(follows.map((f) => `${f.target_type}:${f.target_id}`)),
    [follows]
  );

  const handleFiltersChange = useCallback(
    (next: SupporterMatchFilters) => {
      setFilters(next);
      if (profile?.uid) {
        void saveSupporterMatchFilters(profile.uid, next);
      }
    },
    [profile?.uid]
  );

  const toggleFollow = useCallback(
    async (type: 'club' | 'tournament', id: string, label: string) => {
      if (!profile?.uid) return;
      await followsService.toggle(profile.uid, type, id, label);
      await loadFollows();
    },
    [profile?.uid, loadFollows]
  );

  const liveItems = useMemo(() => {
    const mergedEvents = [...publicEvents, ...events].filter(
      (event, index, list) => list.findIndex((row) => row.id === event.id) === index
    );
    const prodayLive = mergedEvents
      .filter(isProdayEventLiveNow)
      .map(teamEventToMatchItem)
      .filter((item) => item.status === 'live');
    const worldLive = worldFixtures
      .filter(isExternalFixtureLiveNow)
      .map(externalFixtureToMatchItem);
    const raw: SupporterMatchViewItem[] = [...worldLive, ...prodayLive];
    return filterMatchItems(raw, filters, followContext).slice(0, 12);
  }, [publicEvents, events, worldFixtures, filters, followContext]);

  const todayItems = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);

    const localToday = publicEvents.filter(
      (event) => event.starts_at >= start && event.starts_at < end
    );
    const calendarToday = events.filter(
      (event) => event.starts_at >= start && event.starts_at < end
    );
    const worldToday = worldFixtures.filter(
      (fixture) => fixture.starts_at >= start && fixture.starts_at < end
    );

    const raw: SupporterMatchViewItem[] = [
      ...localToday.map(teamEventToMatchItem),
      ...calendarToday.map(teamEventToMatchItem),
      ...worldToday.map(externalFixtureToMatchItem),
    ];
    return filterMatchItems(raw, filters, followContext).slice(0, 16);
  }, [publicEvents, events, worldFixtures, filters, followContext]);

  const tournamentItems = useMemo(() => {
    return filterTournaments(tournaments, filters, followContext).slice(0, 12);
  }, [tournaments, filters, followContext]);

  const followedMatchItems = useMemo(() => {
    const followedEvents = publicEvents
      .filter(
        (event) =>
          (event.club_id && followContext.clubIds.has(event.club_id)) ||
          (event.tournament_id && followContext.tournamentIds.has(event.tournament_id))
      )
      .map(teamEventToMatchItem);
    return filterMatchItems(followedEvents, filters, followContext).slice(0, 12);
  }, [publicEvents, followContext, filters]);

  const renderEmpty = (messageKey: string) => (
    <ProDaySurface variant="module" style={[styles.empty, { borderColor: colors.border }]}>
      <ProDayText variant="body">{t(messageKey)}</ProDayText>
    </ProDaySurface>
  );

  let content: React.ReactNode = null;

  if (chapter === 'live') {
    content =
      liveItems.length > 0 ? (
        liveItems.map((item) => (
          <SupporterMatchCard
            key={item.id}
            item={item}
            isFollowed={
              item.followTarget
                ? followedKeys.has(`${item.followTarget.type}:${item.followTarget.id}`)
                : false
            }
            onToggleFollow={
              item.followTarget
                ? () =>
                    void toggleFollow(
                      item.followTarget!.type,
                      item.followTarget!.id,
                      item.followTarget!.label
                    )
                : undefined
            }
            onDebate={() => nav.setActiveTab('messages')}
            onMoment={() => nav.setActiveTab('reels')}
          />
        ))
      ) : (
        renderEmpty('supporter.empty.live')
      );
  } else if (chapter === 'today') {
    content =
      todayItems.length > 0 ? (
        todayItems.map((item) => (
          <SupporterMatchCard
            key={item.id}
            item={item}
            isFollowed={
              item.followTarget
                ? followedKeys.has(`${item.followTarget.type}:${item.followTarget.id}`)
                : false
            }
            onToggleFollow={
              item.followTarget
                ? () =>
                    void toggleFollow(
                      item.followTarget!.type,
                      item.followTarget!.id,
                      item.followTarget!.label
                    )
                : undefined
            }
            onDebate={() => nav.setActiveTab('messages')}
            onMoment={() => nav.setActiveTab('reels')}
          />
        ))
      ) : (
        renderEmpty('supporter.empty.today')
      );
  } else if (chapter === 'tournaments') {
    content =
      tournamentItems.length > 0 ? (
        tournamentItems.map((tournament) => {
          const item: SupporterMatchViewItem = {
            id: `tournament-${tournament.id}`,
            source: 'proday',
            status: 'upcoming',
            genderScope: 'unspecified',
            homeLabel: tournament.title,
            awayLabel: tournament.city,
            startsAt: tournament.starts_at,
            tournamentId: tournament.id,
            followTarget: {
              type: 'tournament',
              id: tournament.id,
              label: tournament.title,
            },
            meta: tournament.categories.join(' · ') || undefined,
            timeLabel: tournament.starts_at.toLocaleDateString('fr-FR'),
          };
          return (
            <SupporterMatchCard
              key={item.id}
              item={item}
              isFollowed={followedKeys.has(`tournament:${tournament.id}`)}
              onToggleFollow={() =>
                void toggleFollow('tournament', tournament.id, tournament.title)
              }
              onDebate={() => nav.setActiveTab('messages')}
              onMoment={() => nav.setActiveTab('reels')}
            />
          );
        })
      ) : (
        renderEmpty('supporter.empty.tournaments')
      );
  } else {
    const followedOnly = follows.filter(
      (follow) =>
        follow.target_type === 'club' ||
        follow.target_type === 'tournament' ||
        follow.target_type === 'player'
    );
    content = (
      <>
        {followedOnly.length > 0
          ? followedOnly.map((follow) => (
              <ProDaySurface
                key={follow.id}
                variant="module"
                style={[styles.followRow, { borderColor: colors.border }]}
              >
                <ProDayText variant="section">{follow.target_label ?? follow.target_id}</ProDayText>
                <ProDayText variant="caption" muted>
                  {t(`supporter.followType.${follow.target_type}`)}
                </ProDayText>
              </ProDaySurface>
            ))
          : renderEmpty('supporter.empty.follows')}
        {followedMatchItems.map((item) => (
          <SupporterMatchCard
            key={item.id}
            item={item}
            isFollowed
            onToggleFollow={
              item.followTarget
                ? () =>
                    void toggleFollow(
                      item.followTarget!.type,
                      item.followTarget!.id,
                      item.followTarget!.label
                    )
                : undefined
            }
            onDebate={() => nav.setActiveTab('messages')}
            onMoment={() => nav.setActiveTab('reels')}
          />
        ))}
      </>
    );
  }

  return (
    <TabScreenShell
      caption={t('supporter.shell.caption')}
      title={t('supporter.matchs.title')}
      subtitle={t('supporter.matchs.subtitle')}
      flat
    >
      <View style={styles.chips}>
        {CHAPTER_KEYS.map((entry) => {
          const active = entry.id === chapter;
          return (
            <PressableSpring
              key={entry.id}
              onPress={() => setChapter(entry.id)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.accent : colors.surface,
                  borderColor: active ? colors.accent : colors.border,
                },
              ]}
            >
              <ProDayText variant="caption" style={{ color: active ? '#fff' : colors.textSecondary }}>
                {t(entry.labelKey)}
              </ProDayText>
            </PressableSpring>
          );
        })}
      </View>
      <SupporterFilterBar filters={filters} onChange={handleFiltersChange} />
      <ScrollView contentContainerStyle={styles.content}>{content}</ScrollView>
    </TabScreenShell>
  );
};

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  empty: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  followRow: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 4,
  },
});
