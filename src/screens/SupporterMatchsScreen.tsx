import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SupporterPageFrame } from '../components/supporter/SupporterPageFrame';
import { getSupporterPageIdentity, SUPPORTER_SITE } from '../content/supporterPageIdentity';
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
import { useSupporterMatchHub } from '../hooks/useSupporterMatchHub';
import { spacing, radius } from '../theme/designTokens';
import { useAppTheme } from '../context/ProductLineContext';
import { followsService } from '../services/follows.service';
import {
  loadSupporterMatchFilters,
  saveSupporterMatchFilters,
  type SupporterMatchFilters,
} from '../services/supporterPreferences.service';
import { groupWorldItemsByCompetition } from '../services/supporterMatchHub.service';
import type { Follow } from '../models/Follow';
import type { SupporterMatchViewItem } from '../utils/supporterMatchFilters';
import { formatCalendarDate } from '../utils/seasonCalendar';

type SupporterMatchsChapter = 'live' | 'proday' | 'world' | 'follows';

const CHAPTER_KEYS: { id: SupporterMatchsChapter; labelKey: string }[] = [
  { id: 'live', labelKey: 'supporter.chapters.live' },
  { id: 'proday', labelKey: 'supporter.chapters.proday' },
  { id: 'world', labelKey: 'supporter.chapters.world' },
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
  const [filters, setFilters] = useState<SupporterMatchFilters>({
    gender: 'all',
    source: 'all',
    scope: 'all',
    competition: 'all',
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.uid, loadFollows]);

  const hub = useSupporterMatchHub({
    calendarEvents: events,
    tournaments,
    follows,
    filters,
    pollLive: chapter === 'live',
  });

  const followedKeys = useMemo(
    () => new Set(follows.map((f) => `${f.target_type}:${f.target_id}`)),
    [follows],
  );

  const handleFiltersChange = useCallback(
    (next: SupporterMatchFilters) => {
      setFilters(next);
      if (profile?.uid) {
        void saveSupporterMatchFilters(profile.uid, next);
      }
    },
    [profile?.uid],
  );

  const toggleFollow = useCallback(
    async (type: 'club' | 'tournament', id: string, label: string) => {
      if (!profile?.uid) return;
      await followsService.toggle(profile.uid, type, id, label);
      await loadFollows();
    },
    [profile?.uid, loadFollows],
  );

  const renderCard = (item: SupporterMatchViewItem) => (
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
                item.followTarget!.label,
              )
          : undefined
      }
      onDebate={() => nav.setActiveTab('messages')}
      onMoment={() => nav.setActiveTab('reels')}
    />
  );

  const renderEmpty = (messageKey: string) => (
    <ProDaySurface variant="module" style={[styles.empty, { borderColor: colors.border }]}>
      <ProDayText variant="body">{t(messageKey)}</ProDayText>
    </ProDaySurface>
  );

  const providerBanner = !hub.providerState.healthy ? (
    <ProDaySurface variant="module" style={[styles.providerBanner, { borderColor: colors.border }]}>
      <ProDayText variant="caption" style={{ color: SUPPORTER_SITE.free }}>
        {hub.providerState.message ?? t('supporter.api.stub')}
      </ProDayText>
      <ProDayText variant="caption" muted>
        {t('supporter.api.stubHint')}
      </ProDayText>
      {hub.providerState.last_sync_at ? (
        <ProDayText variant="caption" muted>
          {t('supporter.api.lastSync', {
            time: formatCalendarDate(hub.providerState.last_sync_at),
          })}
        </ProDayText>
      ) : null}
    </ProDaySurface>
  ) : hub.providerState.last_sync_at ? (
    <ProDayText variant="caption" muted style={styles.syncLine}>
      {t('supporter.api.lastSync', {
        time: formatCalendarDate(hub.providerState.last_sync_at),
      })}
    </ProDayText>
  ) : null;

  let content: React.ReactNode = null;

  if (hub.loading && hub.sections.live.length === 0) {
    content = <ActivityIndicator color={SUPPORTER_SITE.accent} style={{ marginTop: spacing.lg }} />;
  } else if (chapter === 'live') {
    content =
      hub.sections.live.length > 0 ? (
        hub.sections.live.map(renderCard)
      ) : (
        renderEmpty('supporter.empty.live')
      );
  } else if (chapter === 'proday') {
    const prodayItems = [
      ...hub.sections.proday,
      ...hub.tournaments.map((tournament) => ({
        id: `tournament-${tournament.id}`,
        source: 'proday' as const,
        status: 'upcoming' as const,
        genderScope: 'unspecified' as const,
        homeLabel: tournament.title,
        awayLabel: tournament.city,
        startsAt: tournament.starts_at,
        tournamentId: tournament.id,
        followTarget: {
          type: 'tournament' as const,
          id: tournament.id,
          label: tournament.title,
        },
        meta: tournament.categories.join(' · ') || undefined,
        timeLabel: formatCalendarDate(tournament.starts_at),
      })),
    ];
    content =
      prodayItems.length > 0 ? (
        prodayItems.map((item) => renderCard(item))
      ) : (
        renderEmpty('supporter.empty.proday')
      );
  } else if (chapter === 'world') {
    const groups = groupWorldItemsByCompetition(hub.sections.world);
    content =
      groups.length > 0 ? (
        groups.map((group) => (
          <View key={group.competition} style={styles.worldGroup}>
            <ProDayText variant="caption" style={styles.worldGroupTitle}>
              {group.competition}
            </ProDayText>
            {group.items.map(renderCard)}
          </View>
        ))
      ) : (
        renderEmpty('supporter.empty.world')
      );
  } else {
    const followedOnly = follows.filter(
      (follow) =>
        follow.target_type === 'club' ||
        follow.target_type === 'tournament' ||
        follow.target_type === 'player',
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
        {hub.sections.follows.map(renderCard)}
      </>
    );
  }

  return (
    <SupporterPageFrame identity={getSupporterPageIdentity('matchs')} badge="100 % gratuit">
      <View style={styles.chips}>
        {CHAPTER_KEYS.map((entry) => {
          const active = entry.id === chapter;
          const count =
            entry.id === 'live'
              ? hub.liveCount
              : entry.id === 'proday'
                ? hub.sections.proday.length + hub.tournaments.length
                : entry.id === 'world'
                  ? hub.sections.world.length
                  : hub.sections.follows.length;
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
                {count > 0 ? ` · ${count}` : ''}
              </ProDayText>
            </PressableSpring>
          );
        })}
      </View>
      <SupporterFilterBar
        filters={filters}
        onChange={handleFiltersChange}
        showCompetition={chapter === 'world' || chapter === 'live'}
      />
      {providerBanner}
      <ScrollView contentContainerStyle={styles.content}>{content}</ScrollView>
    </SupporterPageFrame>
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
  providerBanner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 4,
  },
  syncLine: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  worldGroup: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  worldGroupTitle: {
    color: SUPPORTER_SITE.bright,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '800',
    fontSize: 10,
  },
});
