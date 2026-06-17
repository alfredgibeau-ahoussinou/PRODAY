import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, RefreshControl, View } from 'react-native';
import type { User } from '../../models/User';
import type { FriendlyMatch } from '../../models/FriendlyMatch';
import type { TeamEvent, RsvpStatus } from '../../models/TeamEvent';
import type { MatchChapterId, CalendarKindFilter, AmicauxStatusFilter } from '../../content/matchChapters';
import {
  groupByMonth,
  type SeasonCalendarItem,
} from '../../utils/seasonCalendar';
import {
  filterCalendarItems,
  filterFriendlyMatches,
  countWeekEvents,
} from '../../utils/matchFilters';
import { TabScreenShell } from '../app/TabScreenShell';
import { MatchPager } from './MatchPager';
import { MatchCenterPanel } from './MatchCenterPanel';
import { MatchSeasonStatsPanel } from './MatchSeasonStatsPanel';
import { isInMatchWindow } from '../../utils/matchLive';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { SkeletonList } from '../motion';
import { MatchGeoMapPanel } from './MatchGeoMapPanel';
import { useMatchGeoMap } from '../../hooks/useMatchGeoMap';
import type { GeoMarker } from '../../core/types/geo';
import { OfflineCacheBanner } from '../ui/OfflineCacheBanner';
import type { SectionIntelligence } from '../../features/v3/models/sectionIntelligence';
import { MatchCalendarChapter } from './chapters/MatchCalendarChapter';
import { MatchConvocationsChapter } from './chapters/MatchConvocationsChapter';
import { MatchAmicauxChapter } from './chapters/MatchAmicauxChapter';
import { MATCH_CHAPTER_PAD } from './chapters/matchChapterLayout';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';

interface MatchHomeScreenProps {
  profile: User | null;
  items: SeasonCalendarItem[];
  teamEvents: TeamEvent[];
  matches: FriendlyMatch[];
  pendingConvocations: TeamEvent[];
  myUpcomingEvents: TeamEvent[];
  nextItem: SeasonCalendarItem | null;
  loadingCalendar: boolean;
  loadingMatches: boolean;
  fromCache?: boolean;
  canManageEvents: boolean;
  myClubId: string | null;
  initialChapter?: MatchChapterId;
  rsvpBusy?: boolean;
  canAccept: (m: FriendlyMatch) => boolean;
  onPropose: () => void;
  onSearch: () => void;
  onCreateEvent: () => void;
  onOpenCalendarItem: (item: SeasonCalendarItem) => void;
  onOpenEvent: (eventId: string, hubChapter?: 'apercu' | 'live' | 'composition' | 'stats' | 'effectif') => void;
  onRsvp: (eventId: string, status: RsvpStatus) => void;
  onAcceptMatch: (m: FriendlyMatch) => void;
  onCancelMatch: (m: FriendlyMatch) => void;
  onMarkPlayed: (m: FriendlyMatch) => void;
  onRefresh: () => void;
  onOpenCarpoolForEvent?: (eventId: string) => void;
  intelligence?: SectionIntelligence | null;
  getMatchIaScore?: (matchId: string) => number | undefined;
  getMatchHealthWarning?: (matchId: string) => string | undefined;
}

export const MatchHomeScreen: React.FC<MatchHomeScreenProps> = ({
  profile,
  items,
  teamEvents,
  matches,
  pendingConvocations,
  myUpcomingEvents,
  nextItem,
  loadingCalendar,
  loadingMatches,
  fromCache = false,
  canManageEvents,
  myClubId,
  initialChapter = 'calendrier',
  rsvpBusy,
  canAccept,
  onPropose,
  onSearch,
  onCreateEvent,
  onOpenCalendarItem,
  onOpenEvent,
  onRsvp,
  onAcceptMatch,
  onCancelMatch,
  onMarkPlayed,
  onRefresh,
  onOpenCarpoolForEvent,
  intelligence,
  getMatchIaScore,
  getMatchHealthWarning,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const { openAuth } = useTabNavigation();
  const [chapter, setChapter] = useState<MatchChapterId>(initialChapter);
  const [refreshing, setRefreshing] = useState(false);
  const [calendarSearch, setCalendarSearch] = useState('');
  const [calendarKind, setCalendarKind] = useState<CalendarKindFilter>('all');
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [amicauxSearch, setAmicauxSearch] = useState('');
  const [amicauxStatus, setAmicauxStatus] = useState<AmicauxStatusFilter>('all');

  useEffect(() => {
    setChapter(initialChapter);
  }, [initialChapter]);

  const weekDays = useMemo(() => countWeekEvents(items), [items]);
  const openMatchesCount = matches.filter((m) => m.status === 'OPEN').length;
  const liveMatchCount = useMemo(
    () => teamEvents.filter((e) => isInMatchWindow(e)).length,
    [teamEvents]
  );

  const filteredCalendar = useMemo(() => {
    let list = filterCalendarItems(items, {
      search: calendarSearch,
      kind: calendarKind,
      upcomingOnly: true,
    });
    if (selectedDay) {
      const start = new Date(selectedDay);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 1);
      list = list.filter((item) => item.starts_at >= start && item.starts_at < end);
    }
    return list;
  }, [items, calendarSearch, calendarKind, selectedDay]);

  const monthGroups = useMemo(() => groupByMonth(filteredCalendar), [filteredCalendar]);

  const staggeredCalendarGroups = useMemo(() => {
    let index = 0;
    return monthGroups.map((group) => ({
      ...group,
      items: group.items.map((item) => ({ item, staggerIndex: index++ })),
    }));
  }, [monthGroups]);

  const filteredMatches = useMemo(
    () =>
      filterFriendlyMatches(matches, {
        status: amicauxStatus,
        search: amicauxSearch,
        myClubId,
      }),
    [matches, amicauxStatus, amicauxSearch, myClubId]
  );

  const handleRefresh = () => {
    setRefreshing(true);
    onRefresh();
    setTimeout(() => setRefreshing(false), 400);
  };

  const handleDaySelect = (date: Date) => {
    setSelectedDay((prev) =>
      prev && prev.toDateString() === date.toDateString() ? null : date
    );
  };

  const geo = useMatchGeoMap(profile, matches, teamEvents, items);

  const handleGeoMarkerPress = (marker: GeoMarker) => {
    if (marker.kind === 'event') {
      onOpenEvent(marker.entityId);
      return;
    }
    if (marker.kind === 'match') {
      setChapter('amicaux');
    }
  };

  const chapterRefresh = {
    refreshing,
    onRefresh: handleRefresh,
  };

  const pages = [
    {
      id: 'calendrier' as const,
      render: () => (
        <MatchCalendarChapter
          profile={profile}
          items={items}
          nextItem={nextItem}
          weekDays={weekDays}
          selectedDay={selectedDay}
          onSelectDay={handleDaySelect}
          calendarSearch={calendarSearch}
          onCalendarSearchChange={setCalendarSearch}
          calendarKind={calendarKind}
          onCalendarKindChange={setCalendarKind}
          loadingCalendar={loadingCalendar}
          filteredCalendar={filteredCalendar}
          staggeredCalendarGroups={staggeredCalendarGroups}
          {...chapterRefresh}
          onOpenCalendarItem={onOpenCalendarItem}
          onPropose={onPropose}
          onLogin={() => openAuth('login')}
          geoMap={
            <MatchGeoMapPanel
              userLocation={geo.userLocation}
              markers={geo.allMarkers}
              density={geo.density}
              radiusKm={geo.radiusKm}
              onRadiusChange={geo.setRadiusKm}
              onRefreshLocation={() => void geo.refreshLocation()}
              locating={geo.locating}
              locError={geo.locError}
              onMarkerPress={handleGeoMarkerPress}
              onPropose={onPropose}
              onSearch={onSearch}
              onCreateEvent={canManageEvents ? onCreateEvent : undefined}
            />
          }
        />
      ),
    },
    {
      id: 'centre' as const,
      render: () => (
        <ScrollView
          contentContainerStyle={MATCH_CHAPTER_PAD}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {loadingCalendar ? (
            <SkeletonList count={3} variant="card" />
          ) : (
            <MatchCenterPanel
              events={teamEvents}
              onOpenEvent={(id) => {
                const ev = teamEvents.find((e) => e.id === id);
                onOpenEvent(id, ev && isInMatchWindow(ev) ? 'live' : 'apercu');
              }}
            />
          )}
        </ScrollView>
      ),
    },
    {
      id: 'stats' as const,
      render: () => (
        <ScrollView
          contentContainerStyle={MATCH_CHAPTER_PAD}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <MatchSeasonStatsPanel profile={profile} events={teamEvents} />
        </ScrollView>
      ),
    },
    {
      id: 'convocations' as const,
      render: () => (
        <MatchConvocationsChapter
          profile={profile}
          pendingConvocations={pendingConvocations}
          myUpcomingEvents={myUpcomingEvents}
          loadingCalendar={loadingCalendar}
          rsvpBusy={rsvpBusy}
          {...chapterRefresh}
          onOpenEvent={(id) => onOpenEvent(id)}
          onRsvp={onRsvp}
          onOpenCarpoolForEvent={onOpenCarpoolForEvent}
          onLogin={() => openAuth('login')}
        />
      ),
    },
    {
      id: 'amicaux' as const,
      render: () => (
        <MatchAmicauxChapter
          profile={profile}
          matches={matches}
          filteredMatches={filteredMatches}
          loadingMatches={loadingMatches}
          amicauxSearch={amicauxSearch}
          onAmicauxSearchChange={setAmicauxSearch}
          amicauxStatus={amicauxStatus}
          onAmicauxStatusChange={setAmicauxStatus}
          myClubId={myClubId}
          canAccept={canAccept}
          {...chapterRefresh}
          onPropose={onPropose}
          onSearch={onSearch}
          onAcceptMatch={onAcceptMatch}
          onCancelMatch={onCancelMatch}
          onMarkPlayed={onMarkPlayed}
          getMatchIaScore={getMatchIaScore}
          getMatchHealthWarning={getMatchHealthWarning}
        />
      ),
    },
  ];

  const body = (
    <>
      <OfflineCacheBanner visible={fromCache} onRefresh={onRefresh} />
      <MatchPager
        pages={pages}
        activeChapter={chapter}
        onChapterChange={setChapter}
        amicauxBadge={openMatchesCount}
        convocationsBadge={pendingConvocations.length}
        centreBadge={liveMatchCount > 0 ? 'LIVE' : undefined}
      />
    </>
  );

  return (
    <TabScreenShell
      caption={t('matchs.caption')}
      title={t('matchs.title')}
      subtitle={t('matchs.subtitle')}
      flat
    >
      {body}
    </TabScreenShell>
  );
};
