import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, RefreshControl, View } from 'react-native';
import type { User } from '../../models/User';
import type { FriendlyMatch } from '../../models/FriendlyMatch';
import type { Tournament } from '../../models/Tournament';
import type { TeamEvent, RsvpStatus } from '../../models/TeamEvent';
import type { MatchChapterId, CalendarKindFilter, AmicauxStatusFilter } from '../../content/matchChapters';
import {
  filterJoueurMatchChapters,
  normalizeJoueurMatchChapter,
} from '../../content/matchChapters';
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
import { ImmersivePoleHero } from '../poles';
import { MatchPager } from './MatchPager';
import { CoachPane } from '../coach/CoachScreenHeader';
import { getCoachPageIdentity } from '../../content/coachPageIdentity';
import { MatchCenterPanel } from './MatchCenterPanel';
import { CoachSeasonStatsPanel } from '../coach/CoachSeasonStatsPanel';
import { CoachMatchSkinProvider, JoueurMatchSkinProvider } from './matchCenterUi';
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
import { MatchJoueurMatchsChapter } from './chapters/MatchJoueurMatchsChapter';
import { MatchTournamentsChapter } from './chapters/MatchTournamentsChapter';
import { MatchCompetitionsChapter } from './chapters/MatchCompetitionsChapter';
import { MATCH_CHAPTER_PAD } from './chapters/matchChapterLayout';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { usePlayerThemeColors } from '../../context/PlayerThemeContext';
import { useJoueurSession } from '../../context/JoueurSessionContext';
import { useJoueurProgress } from '../../context/JoueurProgressContext';
import type { Competition, CompetitionFixture, CompetitionSeason } from '../../models/Competition';

interface MatchHomeScreenProps {
  profile: User | null;
  items: SeasonCalendarItem[];
  teamEvents: TeamEvent[];
  matches: FriendlyMatch[];
  tournaments: Tournament[];
  loadingTournaments: boolean;
  competitions?: Competition[];
  competitionSeasons?: CompetitionSeason[];
  competitionFixtures?: CompetitionFixture[];
  loadingCompetitions?: boolean;
  pendingConvocations: TeamEvent[];
  myUpcomingEvents: TeamEvent[];
  nextItem: SeasonCalendarItem | null;
  loadingCalendar: boolean;
  loadingMatches: boolean;
  fromCache?: boolean;
  /** Création convocations / événements équipe (Staff premium). */
  canManageEvents: boolean;
  /** Création tournois — défaut = canManageEvents. */
  canManageTournaments?: boolean;
  myClubId: string | null;
  initialChapter?: MatchChapterId;
  rsvpBusy?: boolean;
  canAccept: (m: FriendlyMatch) => boolean;
  onPropose: () => void;
  onSearch: () => void;
  onOrganize?: () => void;
  onCreateEvent: () => void;
  onOpenCalendarItem: (item: SeasonCalendarItem) => void;
  onOpenEvent: (eventId: string, hubChapter?: 'apercu' | 'live' | 'composition' | 'stats' | 'effectif') => void;
  onRsvp: (eventId: string, status: RsvpStatus) => void;
  onAcceptMatch: (m: FriendlyMatch) => void;
  onCancelMatch: (m: FriendlyMatch) => void;
  onMarkPlayed: (m: FriendlyMatch) => void;
  onOpenTournament: (id: string) => void;
  onCreateTournament?: () => void;
  onOpenCompetitionSeason?: (seasonId: string) => void;
  onOpenCompetitionFixture?: (fixtureId: string) => void;
  onOrganizeCompetition?: () => void;
  onRefresh: () => void;
  onOpenCarpoolForEvent?: (eventId: string) => void;
  intelligence?: SectionIntelligence | null;
  getMatchIaScore?: (matchId: string) => number | undefined;
  getMatchHealthWarning?: (matchId: string) => string | undefined;
  /** Dans CoachPageFrame : pas de double hero immersif. */
  embeddedInShell?: boolean;
}

export const MatchHomeScreen: React.FC<MatchHomeScreenProps> = ({
  profile,
  items,
  teamEvents,
  matches,
  tournaments,
  loadingTournaments,
  competitions = [],
  competitionSeasons = [],
  competitionFixtures = [],
  loadingCompetitions = false,
  pendingConvocations,
  myUpcomingEvents,
  nextItem,
  loadingCalendar,
  loadingMatches,
  fromCache = false,
  canManageEvents,
  canManageTournaments,
  myClubId,
  initialChapter = 'calendrier',
  rsvpBusy,
  canAccept,
  onPropose,
  onSearch,
  onOrganize,
  onCreateEvent,
  onOpenCalendarItem,
  onOpenEvent,
  onRsvp,
  onAcceptMatch,
  onCancelMatch,
  onMarkPlayed,
  onOpenTournament,
  onCreateTournament,
  onOpenCompetitionSeason,
  onOpenCompetitionFixture,
  onOrganizeCompetition,
  onRefresh,
  onOpenCarpoolForEvent,
  intelligence,
  getMatchIaScore,
  getMatchHealthWarning,
  embeddedInShell = false,
}) => {
  const { colors } = useAppTheme();
  const playerTheme = usePlayerThemeColors();
  const { t } = useTranslation();
  const { openAuth } = useTabNavigation();
  const joueurSession = useJoueurSession();
  const joueurProgress = useJoueurProgress();
  const isJoueur =
    Boolean(joueurSession?.isJoueurPlayer && joueurSession.ready && !joueurSession.needsGate);
  const refreshTint = isJoueur ? playerTheme.accent : colors.accent;

  const [chapter, setChapter] = useState<MatchChapterId>(() =>
    isJoueur ? normalizeJoueurMatchChapter(initialChapter) : initialChapter,
  );
  const [refreshing, setRefreshing] = useState(false);
  const [calendarSearch, setCalendarSearch] = useState('');
  const [calendarKind, setCalendarKind] = useState<CalendarKindFilter>('all');
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [amicauxSearch, setAmicauxSearch] = useState('');
  const [amicauxStatus, setAmicauxStatus] = useState<AmicauxStatusFilter>('all');

  useEffect(() => {
    setChapter(isJoueur ? normalizeJoueurMatchChapter(initialChapter) : initialChapter);
  }, [initialChapter, isJoueur]);

  const weekDays = useMemo(() => countWeekEvents(items), [items]);
  const openMatchesCount = matches.filter((m) => m.status === 'OPEN').length;
  const weekEventCount = useMemo(
    () => weekDays.reduce((sum, d) => sum + d.count, 0),
    [weekDays],
  );
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

  const matchsInitialSegment =
    initialChapter === 'tournois'
      ? ('tournois' as const)
      : initialChapter === 'competitions'
        ? ('competitions' as const)
        : ('amicaux' as const);

  const calendrierLivePanel =
    isJoueur && liveMatchCount > 0 ? (
      loadingCalendar ? (
        <SkeletonList count={2} variant="card" />
      ) : (
        <MatchCenterPanel
          events={teamEvents}
          onOpenEvent={(id) => {
            const ev = teamEvents.find((e) => e.id === id);
            onOpenEvent(id, ev && isInMatchWindow(ev) ? 'live' : 'apercu');
          }}
        />
      )
    ) : undefined;

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
          livePanel={calendrierLivePanel}
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
              tintColor={refreshTint}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {loadingCalendar ? (
            <SkeletonList count={3} variant="card" />
          ) : (
            <MatchCenterPanel
              events={teamEvents}
              onCreateEvent={canManageEvents ? onCreateEvent : undefined}
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
              tintColor={refreshTint}
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
      render: () =>
        isJoueur ? (
          <MatchJoueurMatchsChapter
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
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onPropose={onPropose}
            onSearch={onSearch}
            onOrganize={onOrganize}
            onAcceptMatch={onAcceptMatch}
            onCancelMatch={onCancelMatch}
            onMarkPlayed={onMarkPlayed}
            getMatchIaScore={getMatchIaScore}
            getMatchHealthWarning={getMatchHealthWarning}
            tournaments={tournaments}
            loadingTournaments={loadingTournaments}
            onOpenTournament={onOpenTournament}
            onCreateTournament={
              (canManageTournaments ?? canManageEvents) ? onCreateTournament : undefined
            }
            competitions={competitions}
            competitionSeasons={competitionSeasons}
            competitionFixtures={competitionFixtures}
            loadingCompetitions={loadingCompetitions}
            onOpenCompetitionSeason={onOpenCompetitionSeason}
            onOpenCompetitionFixture={onOpenCompetitionFixture}
            onOrganizeCompetition={
              (canManageTournaments ?? canManageEvents) ? onOrganizeCompetition : undefined
            }
            initialSegment={matchsInitialSegment}
          />
        ) : (
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
            onOrganize={onOrganize}
            onAcceptMatch={onAcceptMatch}
            onCancelMatch={onCancelMatch}
            onMarkPlayed={onMarkPlayed}
            getMatchIaScore={getMatchIaScore}
            getMatchHealthWarning={getMatchHealthWarning}
          />
        ),
    },
    {
      id: 'tournois' as const,
      render: () => (
        <MatchTournamentsChapter
          profile={profile}
          tournaments={tournaments}
          loading={loadingTournaments}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onOpenTournament={onOpenTournament}
          onCreateTournament={
            (canManageTournaments ?? canManageEvents) ? onCreateTournament : undefined
          }
          myClubId={myClubId}
        />
      ),
    },
    {
      id: 'competitions' as const,
      render: () => (
        <MatchCompetitionsChapter
          profile={profile}
          competitions={competitions}
          seasons={competitionSeasons}
          fixtures={competitionFixtures}
          loading={loadingCompetitions}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onOpenSeason={(id) => onOpenCompetitionSeason?.(id)}
          onOpenFixture={(id) => onOpenCompetitionFixture?.(id)}
          onOrganize={
            (canManageTournaments ?? canManageEvents) ? onOrganizeCompetition : undefined
          }
        />
      ),
    },
  ];

  const visiblePages = isJoueur ? filterJoueurMatchChapters(pages) : pages;

  const isClubOps = profile?.role === 'club';
  const hidePoleHero = isClubOps || embeddedInShell || isJoueur;

  useEffect(() => {
    if (!isJoueur || !joueurProgress?.ready) return;
    void joueurProgress.claimDaily('daily-match', 25, 1);
  }, [isJoueur, joueurProgress?.ready]);

  const matchCopy = useMemo(() => {
    if (!isJoueur || !joueurSession) {
      return {
        caption: t('matchs.caption'),
        title: t('matchs.title'),
        subtitle: t('matchs.subtitle'),
      };
    }
    const g = joueurSession.ageGroup;
    if (g === 'youth') {
      return {
        caption: 'Matchs',
        title: 'Arena',
        subtitle: 'Calendrier · Convocs · En direct — joue ta semaine.',
      };
    }
    if (g === 'teen') {
      return {
        caption: 'Matchs',
        title: 'Centre match',
        subtitle: 'Convocs, stats, missions terrain.',
      };
    }
    return {
      caption: 'Matchs',
      title: 'Centre Match',
      subtitle: 'Calendrier · En direct · Championnat.',
    };
  }, [isJoueur, joueurSession, t]);

  if (embeddedInShell) {
    return (
      <CoachPane
        title={getCoachPageIdentity('match_center').title}
        actions={
          canManageEvents
            ? [
                {
                  icon: 'add',
                  onPress: onCreateEvent,
                  accessibilityLabel: 'Créer un événement',
                },
              ]
            : undefined
        }
      >
        <CoachMatchSkinProvider enabled>
          <ScrollView
            contentContainerStyle={MATCH_CHAPTER_PAD}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={refreshTint}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            <CoachSeasonStatsPanel events={teamEvents} profile={profile} />
          </ScrollView>
        </CoachMatchSkinProvider>
      </CoachPane>
    );
  }

  const body = (
    <>
      <OfflineCacheBanner visible={fromCache} onRefresh={onRefresh} />
      {!hidePoleHero ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 4 }}>
          <ImmersivePoleHero
            kicker={t('matchs.caption')}
            title={t('matchs.title')}
            support={
              weekEventCount > 0
                ? `${weekEventCount} rendez-vous cette semaine · calendrier, convocations, amicaux.`
                : t('matchs.subtitle')
            }
            primaryLabel={canManageEvents ? 'Organiser' : 'Proposer'}
            onPrimaryPress={canManageEvents && onOrganize ? onOrganize : onPropose}
            secondaryLabel="Chercher"
            onSecondaryPress={onSearch}
            mood="dynamic_competitive"
            accentHex={isJoueur ? playerTheme.accent : colors.accent}
          />
        </View>
      ) : null}
      <MatchPager
        pages={visiblePages}
        activeChapter={chapter}
        onChapterChange={setChapter}
        amicauxBadge={openMatchesCount}
        convocationsBadge={pendingConvocations.length}
        centreBadge={liveMatchCount > 0 ? 'Direct' : undefined}
        gameMode={isJoueur}
        coachSkin={embeddedInShell}
      />
    </>
  );

  return (
    <TabScreenShell
      caption={matchCopy.caption}
      title={matchCopy.title}
      subtitle={
        weekEventCount > 0 && (isClubOps || embeddedInShell || isJoueur)
          ? `${weekEventCount} rendez-vous cette semaine`
          : matchCopy.subtitle
      }
      flat={hidePoleHero}
      hideHeader={embeddedInShell}
      hideWorldScene={isJoueur}
      atmosphere={hidePoleHero ? undefined : 'dynamic_competitive'}
    >
      <JoueurMatchSkinProvider enabled={isJoueur}>
        {body}
      </JoueurMatchSkinProvider>
    </TabScreenShell>
  );
};
