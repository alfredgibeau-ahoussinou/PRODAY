import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SupporterPageFrame } from '../components/supporter/SupporterPageFrame';
import { getSupporterPageIdentity, SUPPORTER_SITE } from '../content/supporterPageIdentity';
import { SupporterFilterBar } from '../components/supporter/SupporterFilterBar';
import { SupporterMatchCard } from '../components/supporter/SupporterMatchCard';
import { ProDayText } from '../components/ui/ProDayText';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LocaleContext';
import { useSeasonCalendar } from '../hooks/useAppData';
import { useTournaments } from '../hooks/useTournaments';
import { useTabNavigationActions } from '../hooks/useTabNavigationActions';
import { useSupporterMatchHub } from '../hooks/useSupporterMatchHub';
import { spacing } from '../theme/designTokens';
import { followsService } from '../services/follows.service';
import {
  loadSupporterMatchFilters,
  saveSupporterMatchFilters,
  type SupporterMatchFilters,
} from '../services/supporterPreferences.service';
import {
  DEFAULT_SUPPORTER_MATCHS_CHAPTER,
  groupUpcomingByDateThenCompetition,
  groupWorldItemsByCompetition,
  type SupporterMatchHubSection,
} from '../services/supporterMatchHub.service';
import type { Follow } from '../models/Follow';
import type { SupporterMatchViewItem } from '../utils/supporterMatchFilters';
import { formatCalendarDate } from '../utils/seasonCalendar';

type SupporterMatchsChapter = SupporterMatchHubSection;

const CHAPTER_KEYS: { id: SupporterMatchsChapter; labelKey: string }[] = [
  { id: 'upcoming', labelKey: 'supporter.chapters.upcoming' },
  { id: 'live', labelKey: 'supporter.chapters.live' },
  { id: 'proday', labelKey: 'supporter.chapters.proday' },
  { id: 'world', labelKey: 'supporter.chapters.world' },
  { id: 'follows', labelKey: 'supporter.chapters.follows' },
];

export const SupporterMatchsScreen: React.FC = () => {
  const { profile } = useAuth();
  const { t, locale } = useTranslation();
  const nav = useTabNavigationActions();
  const { events } = useSeasonCalendar(profile?.uid, profile?.profile.club_id);
  const { tournaments } = useTournaments();
  const [chapter, setChapter] = useState<SupporterMatchsChapter>(DEFAULT_SUPPORTER_MATCHS_CHAPTER);
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

  const renderCard = (item: SupporterMatchViewItem, hero = false) => (
    <SupporterMatchCard
      key={item.id}
      item={item}
      hero={hero}
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
    <View style={styles.empty}>
      <ProDayText variant="body" style={styles.emptyText}>
        {t(messageKey)}
      </ProDayText>
    </View>
  );

  const dateHeading = (kind: 'today' | 'tomorrow' | 'later', date: Date) => {
    if (kind === 'today') return t('supporter.date.today');
    if (kind === 'tomorrow') return t('supporter.date.tomorrow');
    return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(date);
  };

  const providerBanner = !hub.providerState.healthy ? (
    <View style={styles.providerBanner}>
      <ProDayText variant="caption" style={styles.providerTitle}>
        {hub.providerState.message ?? t('supporter.api.stub')}
      </ProDayText>
      <ProDayText variant="caption" style={styles.emptyText}>
        {t('supporter.api.stubHint')}
      </ProDayText>
      {hub.providerState.last_sync_at ? (
        <ProDayText variant="caption" style={styles.emptyText}>
          {t('supporter.api.lastSync', {
            time: formatCalendarDate(hub.providerState.last_sync_at),
          })}
        </ProDayText>
      ) : null}
    </View>
  ) : hub.providerState.last_sync_at ? (
    <ProDayText variant="caption" style={styles.syncLine}>
      {t('supporter.api.lastSync', {
        time: formatCalendarDate(hub.providerState.last_sync_at),
      })}
    </ProDayText>
  ) : null;

  let content: React.ReactNode = null;

  if (hub.loading && hub.sections.upcoming.length === 0 && hub.sections.live.length === 0) {
    content = <ActivityIndicator color={SUPPORTER_SITE.accent} style={{ marginTop: spacing.lg }} />;
  } else if (chapter === 'upcoming') {
    const heroIds = new Set(hub.heroKickoffs.map((item) => item.id));
    const rest = hub.sections.upcoming.filter((item) => !heroIds.has(item.id));
    const groups = groupUpcomingByDateThenCompetition(rest);
    content =
      groups.length > 0 ? (
        groups.map((group) => (
          <View key={group.dateKey} style={styles.dateGroup}>
            <ProDayText variant="caption" style={styles.dateTitle}>
              {dateHeading(group.kind, group.date)}
            </ProDayText>
            {group.competitions.map((competition) => (
              <View key={`${group.dateKey}-${competition.competition}`}>
                <ProDayText variant="caption" style={styles.compTitle}>
                  {competition.competition}
                </ProDayText>
                {competition.items.map((item) => renderCard(item))}
              </View>
            ))}
          </View>
        ))
      ) : hub.heroKickoffs.length > 0 ? null : (
        renderEmpty('supporter.empty.upcoming')
      );
  } else if (chapter === 'live') {
    content =
      hub.sections.live.length > 0 ? (
        hub.sections.live.map((item) => renderCard(item))
      ) : (
        renderEmpty('supporter.empty.live')
      );
  } else if (chapter === 'proday') {
    const prodayItems = [
      ...hub.sections.proday,
      ...hub.tournaments
        .filter((tournament) => !hub.sections.upcoming.some((item) => item.id === `tournament-${tournament.id}`))
        .map((tournament) => ({
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
          <View key={group.competition} style={styles.dateGroup}>
            <ProDayText variant="caption" style={styles.compTitle}>
              {group.competition}
            </ProDayText>
            {group.items.map((item) => renderCard(item))}
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
              <View key={follow.id} style={styles.followRow}>
                <ProDayText variant="section" style={styles.followTitle}>
                  {follow.target_label ?? follow.target_id}
                </ProDayText>
                <ProDayText variant="caption" style={styles.emptyText}>
                  {t(`supporter.followType.${follow.target_type}`)}
                </ProDayText>
              </View>
            ))
          : renderEmpty('supporter.empty.follows')}
        {hub.sections.follows.map((item) => renderCard(item))}
      </>
    );
  }

  const chapterCount = (id: SupporterMatchsChapter) => {
    if (id === 'upcoming') return hub.upcomingCount;
    if (id === 'live') return hub.liveCount;
    if (id === 'proday') return hub.sections.proday.length + hub.tournaments.length;
    if (id === 'world') return hub.sections.world.length;
    return hub.sections.follows.length;
  };

  return (
    <SupporterPageFrame identity={getSupporterPageIdentity('matchs')} badge="100 % gratuit">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
      >
        {CHAPTER_KEYS.map((entry) => {
          const active = entry.id === chapter;
          const count = chapterCount(entry.id);
          return (
            <Pressable key={entry.id} onPress={() => setChapter(entry.id)} style={styles.tab}>
              <ProDayText variant="caption" style={[styles.tabLabel, active && styles.tabLabelOn]}>
                {t(entry.labelKey)}
                {count > 0 ? `  ${count}` : ''}
              </ProDayText>
              <View style={[styles.tabRule, active && styles.tabRuleOn]} />
            </Pressable>
          );
        })}
      </ScrollView>
      <SupporterFilterBar
        filters={filters}
        onChange={handleFiltersChange}
        showCompetition={chapter === 'world' || chapter === 'live' || chapter === 'upcoming'}
      />
      {providerBanner}
      <ScrollView contentContainerStyle={styles.content}>
        {hub.heroKickoffs.length > 0 && chapter === 'upcoming' ? (
          <View style={styles.heroBlock}>
            <ProDayText variant="caption" style={styles.heroKicker}>
              {t('supporter.matchs.heroKickoffs')}
            </ProDayText>
            {hub.heroKickoffs.map((item) => renderCard(item, true))}
          </View>
        ) : null}
        {content}
      </ScrollView>
    </SupporterPageFrame>
  );
};

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    gap: spacing.lg,
    alignItems: 'flex-end',
  },
  tab: {
    paddingTop: spacing.xs,
    gap: 8,
  },
  tabLabel: {
    color: SUPPORTER_SITE.muted,
    letterSpacing: 1.2,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  tabLabelOn: {
    color: SUPPORTER_SITE.foreground,
  },
  tabRule: {
    height: 1,
    backgroundColor: 'transparent',
  },
  tabRuleOn: {
    backgroundColor: SUPPORTER_SITE.accent,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  empty: {
    paddingVertical: spacing.xl,
  },
  emptyText: {
    color: SUPPORTER_SITE.muted,
    lineHeight: 20,
  },
  followRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SUPPORTER_SITE.border,
    gap: 4,
  },
  followTitle: {
    color: SUPPORTER_SITE.foreground,
  },
  providerBanner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    gap: 4,
  },
  providerTitle: {
    color: SUPPORTER_SITE.accent,
  },
  syncLine: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    color: SUPPORTER_SITE.muted,
  },
  dateGroup: {
    marginTop: spacing.lg,
  },
  dateTitle: {
    color: SUPPORTER_SITE.foreground,
    letterSpacing: 1.8,
    fontSize: 11,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  compTitle: {
    color: SUPPORTER_SITE.accent,
    letterSpacing: 1.6,
    fontSize: 9,
    textTransform: 'uppercase',
    marginTop: spacing.sm,
  },
  heroBlock: {
    marginBottom: spacing.md,
  },
  heroKicker: {
    color: SUPPORTER_SITE.accent,
    letterSpacing: 2,
    fontSize: 10,
    textTransform: 'uppercase',
    marginTop: spacing.sm,
  },
});
