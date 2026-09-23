import React, { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTabNavigation } from '../context/TabNavigationContext';
import { openSeasonCalendarItem } from '../utils/navigationDeepLink';
import { useTabNavigationActions } from '../hooks/useTabNavigationActions';
import { useFriendlyMatches, useSeasonCalendar } from '../hooks/useAppData';
import { useTournaments } from '../hooks/useTournaments';
import { useCompetitions } from '../hooks/useCompetitions';
import { useMatchScreenData } from '../hooks/useMatchScreenData';
import { useMatchActions } from '../hooks/useMatchActions';
import { useMatchJoinGuard } from '../hooks/useMatchJoinGuard';
import { useSectionIntelligence } from '../hooks/useSectionIntelligence';
import { useAppTheme } from '../context/ProductLineContext';
import { userStateStore } from '../core/state/userState.store';
import { trackV3Event } from '../core/analytics/v3Events';
import { flushBrainState } from '../services/brainState.service';
import { teamEventsService } from '../services/teamEvents.service';
import type { RsvpStatus } from '../models/TeamEvent';
import { PlayerCalendarScreen } from './player/PlayerCalendarScreen';
import type { MatchChapterId } from '../content/matchChapters';
import type { SeasonCalendarItem } from '../utils/seasonCalendar';
import { ProposeMatchScreen } from './ProposeMatchScreen';
import { SearchMatchScreen } from './SearchMatchScreen';
import { MatchOrganizeScreen } from './MatchOrganizeScreen';
import { CreateTournamentScreen } from './CreateTournamentScreen';
import { CreateTeamEventScreen } from './CreateTeamEventScreen';
import { TournamentDetailScreen } from './TournamentDetailScreen';
import { MatchEventHubScreen } from './MatchEventHubScreen';
import { CompetitionOrganizeScreen } from './competition/CompetitionOrganizeScreen';
import { CompetitionDashboardScreen } from './competition/CompetitionDashboardScreen';
import { CompetitionStandingsScreen } from './competition/CompetitionStandingsScreen';
import { CompetitionFixtureDetailScreen } from './competition/CompetitionFixtureDetailScreen';
import { CompetitionStatsScreen } from './competition/CompetitionStatsScreen';
import type { MatchHubChapterId } from '../content/matchHubChapters';
import { prodayHaptics } from '../utils/prodayHaptics';
import { isInMatchWindow } from '../utils/matchLive';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useTranslation } from '../context/LocaleContext';
import { PushScreenTransition } from '../components/motion';
import { userCanManageConvocations } from '../utils/clubFeatureAccess';
import { useClubCoversCoach } from '../hooks/useClubCoversCoach';

type MatchView =
  | 'home'
  | 'propose'
  | 'search'
  | 'organize'
  | 'create_event'
  | 'create_tournament'
  | 'tournament_detail'
  | 'event_detail'
  | 'competition_organize'
  | 'competition_dashboard'
  | 'competition_standings'
  | 'competition_fixture'
  | 'competition_stats';

export const MatchsScreen: React.FC<{
  defaultChapter?: MatchChapterId;
  embeddedInShell?: boolean;
}> = ({ defaultChapter = 'calendrier', embeddedInShell = false }) => {
  const [view, setView] = React.useState<MatchView>('home');
  const [initialChapter, setInitialChapter] = React.useState<MatchChapterId>(defaultChapter);
  const [selectedEventId, setSelectedEventId] = React.useState<string | null>(null);
  const [selectedTournamentId, setSelectedTournamentId] = React.useState<string | null>(null);
  const [selectedSeasonId, setSelectedSeasonId] = React.useState<string | null>(null);
  const [selectedFixtureId, setSelectedFixtureId] = React.useState<string | null>(null);
  const [hubChapter, setHubChapter] = React.useState<MatchHubChapterId>('apercu');
  const [rsvpBusy, setRsvpBusy] = React.useState(false);
  const [competitionRefresh, setCompetitionRefresh] = React.useState(0);
  const { profile } = useAuth();
  const { productLine } = useAppTheme();
  const { requireAuth } = useRequireAuth();
  const { t } = useTranslation();
  const { pendingMatchsLink, clearPendingMatchs } = useTabNavigation();
  const navActions = useTabNavigationActions();
  const clubId = profile?.profile.club_id;
  const {
    items,
    events,
    loading: loadingCalendar,
    fromCache,
    refresh: refreshCalendar,
  } = useSeasonCalendar(profile?.uid, clubId);
  const { matches, loading: loadingMatches, refresh: refreshMatches } = useFriendlyMatches();
  const {
    tournaments,
    loading: loadingTournaments,
    refresh: refreshTournaments,
  } = useTournaments();
  const {
    competitions,
    seasons: competitionSeasons,
    fixtures: competitionFixtures,
    loading: loadingCompetitions,
    refresh: refreshCompetitions,
  } = useCompetitions(competitionRefresh);
  const { acceptMatch, cancelMatch, markPlayed, canAccept } = useMatchActions(profile);
  const { guardAcceptMatch, guardRsvpYes, getMatchIaScore, checkMatch } =
    useMatchJoinGuard(profile);
  const [myClubId, setMyClubId] = React.useState<string | null>(null);
  const canAcceptForClub = useCallback(
    (match: Parameters<typeof canAccept>[0]) => canAccept(match, myClubId),
    [canAccept, myClubId],
  );

  const { pendingConvocations, myUpcomingEvents, nextItem } = useMatchScreenData(
    profile,
    events,
    items
  );

  const intelligence = useSectionIntelligence('matchs', profile, productLine, {
    pendingConvocations: pendingConvocations.length,
    openMatches: matches.filter((m) => m.status === 'OPEN').length,
    liveMatches: events.filter((e) => isInMatchWindow(e)).length,
  });

  /** Convocations = coach pro ou club Tout inclus (coachs inclus). */
  const clubCoversCoach = useClubCoversCoach(clubId);
  const canManageConvocations = userCanManageConvocations(profile, { clubCoversCoach });
  const canManageTournaments = Boolean(
    profile &&
      (profile.role === 'organizer' ||
        profile.role === 'coach' ||
        profile.role === 'agent'),
  );

  React.useEffect(() => {
    setInitialChapter(defaultChapter);
  }, [defaultChapter]);

  React.useEffect(() => {
    setMyClubId(profile ? profile.profile.club_id ?? profile.uid : null);
  }, [profile]);

  React.useEffect(() => {
    if (!pendingMatchsLink) return;
    if (pendingMatchsLink.view === 'organize') {
      setView('organize');
      clearPendingMatchs();
      return;
    }
    if (pendingMatchsLink.view === 'propose') {
      setView('propose');
      clearPendingMatchs();
      return;
    }
    if (pendingMatchsLink.view === 'search') {
      setView('search');
      clearPendingMatchs();
      return;
    }
    if (pendingMatchsLink.homeTab === 'matches') {
      setInitialChapter('calendrier');
    } else if (pendingMatchsLink.homeTab === 'convocations') {
      setInitialChapter('convocations');
    } else if (pendingMatchsLink.homeTab === 'centre') {
      setInitialChapter('centre');
    } else if (pendingMatchsLink.homeTab === 'stats') {
      setInitialChapter('stats');
    } else if (pendingMatchsLink.homeTab === 'tournois') {
      setInitialChapter('tournois');
    } else if (pendingMatchsLink.homeTab === 'competitions') {
      setInitialChapter('competitions');
    } else {
      setInitialChapter('calendrier');
    }
    if (pendingMatchsLink.eventId) {
      setSelectedEventId(pendingMatchsLink.eventId);
      setHubChapter(pendingMatchsLink.hubChapter ?? 'apercu');
      setView('event_detail');
    }
    clearPendingMatchs();
  }, [pendingMatchsLink, clearPendingMatchs]);

  const refreshAll = () => {
    refreshCalendar();
    refreshMatches();
    void refreshTournaments();
    setCompetitionRefresh((n) => n + 1);
    void refreshCompetitions();
  };

  const recordMatchJoin = useCallback(() => {
    if (!profile) return;
    const progression = userStateStore.get()?.progression ?? {
      xp: 0,
      level: 1,
      xpToNext: 200,
      xpProgress: 0,
      streakDays: 1,
      badges: [],
      rankLabel: 'Rookie',
    };
    userStateStore.applyAction(
      profile,
      'join_match',
      {
        upcomingEventsCount: items.length,
        pendingConvocations: pendingConvocations.length,
        recentMatchCount: myUpcomingEvents.length,
        streakDays: 1,
        globalScore: 50,
      },
      progression
    );
    trackV3Event('match_joined', { source: 'matchs_tab' });
    void flushBrainState(profile.uid);
  }, [profile, items.length, pendingConvocations.length, myUpcomingEvents.length]);

  const handleRsvp = async (eventId: string, status: RsvpStatus) => {
    if (!profile) return;
    const submit = async () => {
      setRsvpBusy(true);
      try {
        await teamEventsService.updateRsvp(eventId, profile.uid, status);
        prodayHaptics.rsvpConfirm();
        if (status === 'yes') recordMatchJoin();
        refreshCalendar();
      } finally {
        setRsvpBusy(false);
      }
    };
    if (status === 'yes') {
      guardRsvpYes(() => void submit());
      return;
    }
    await submit();
  };

  const getMatchHealthWarning = useCallback(
    (matchId: string) => {
      const match = matches.find((m) => m.id === matchId);
      if (!match) return undefined;
      const check = checkMatch(match);
      return check.allowed ? undefined : check.reasons[0];
    },
    [checkMatch, matches]
  );

  const openCalendarItem = (item: SeasonCalendarItem) => {
    if (item.team_event_id) {
      setSelectedEventId(item.team_event_id);
      setView('event_detail');
      return;
    }
    if (item.competition_fixture_id) {
      setSelectedFixtureId(item.competition_fixture_id);
      setView('competition_fixture');
      return;
    }
    openSeasonCalendarItem(item, navActions);
  };

  const openEvent = (eventId: string, chapter: MatchHubChapterId = 'apercu') => {
    setSelectedEventId(eventId);
    setHubChapter(chapter);
    setView('event_detail');
  };

  let subView: React.ReactNode = null;

  if (view === 'propose') {
    subView = (
      <ProposeMatchScreen
        onBack={() => setView('home')}
        onCreated={() => {
          refreshAll();
          setInitialChapter('calendrier');
          setView('home');
        }}
      />
    );
  } else if (view === 'search') {
    subView = (
      <SearchMatchScreen
        onBack={() => setView('home')}
        onAccepted={() => {
          refreshAll();
          setInitialChapter('calendrier');
        }}
      />
    );
  } else if (view === 'organize') {
    subView = (
      <MatchOrganizeScreen
        onBack={() => setView('home')}
        onPropose={() => setView('propose')}
      />
    );
  } else if (view === 'create_tournament' && profile && canManageTournaments) {
    subView = (
      <CreateTournamentScreen
        profile={profile}
        onBack={() => setView('home')}
        onCreated={(id) => {
          refreshAll();
          setSelectedTournamentId(id);
          setInitialChapter('tournois');
          setView('tournament_detail');
        }}
      />
    );
  } else if (view === 'tournament_detail' && profile && selectedTournamentId) {
    subView = (
      <TournamentDetailScreen
        tournamentId={selectedTournamentId}
        profile={profile}
        onBack={() => {
          setView('home');
          refreshAll();
        }}
      />
    );
  } else if (view === 'create_event' && canManageConvocations) {
    subView = (
      <CreateTeamEventScreen
        onBack={() => setView('home')}
        onCreated={(id) => {
          refreshAll();
          setSelectedEventId(id);
          setView('event_detail');
        }}
      />
    );
  } else if (view === 'event_detail' && selectedEventId) {
    subView = (
      <MatchEventHubScreen
        eventId={selectedEventId}
        initialChapter={hubChapter}
        onBack={() => {
          setView('home');
          refreshAll();
        }}
        onOpenCarpool={() =>
          navActions.openCarpool({ chapter: 'reserver', eventId: selectedEventId })
        }
      />
    );
  } else if (view === 'competition_organize' && profile) {
    subView = (
      <CompetitionOrganizeScreen
        profile={profile}
        onBack={() => setView('home')}
        onCreated={(seasonId) => {
          refreshAll();
          setSelectedSeasonId(seasonId);
          setInitialChapter('competitions');
          setView('competition_dashboard');
        }}
      />
    );
  } else if (view === 'competition_dashboard' && selectedSeasonId) {
    subView = (
      <CompetitionDashboardScreen
        seasonId={selectedSeasonId}
        onBack={() => {
          setView('home');
          refreshAll();
        }}
        onOpenStandings={() => setView('competition_standings')}
        onOpenStats={() => setView('competition_stats')}
        onOpenFixture={(id) => {
          setSelectedFixtureId(id);
          setView('competition_fixture');
        }}
      />
    );
  } else if (view === 'competition_standings' && selectedSeasonId) {
    subView = (
      <CompetitionStandingsScreen
        seasonId={selectedSeasonId}
        onBack={() => setView('competition_dashboard')}
      />
    );
  } else if (view === 'competition_stats' && selectedSeasonId) {
    subView = (
      <CompetitionStatsScreen
        seasonId={selectedSeasonId}
        onBack={() => setView('competition_dashboard')}
      />
    );
  } else if (view === 'competition_fixture' && profile && selectedFixtureId) {
    subView = (
      <CompetitionFixtureDetailScreen
        fixtureId={selectedFixtureId}
        profile={profile}
        onBack={() => {
          if (selectedSeasonId) setView('competition_dashboard');
          else setView('home');
          refreshAll();
        }}
        onOpenTeamEvent={(eventId) => {
          setSelectedEventId(eventId);
          setView('event_detail');
        }}
      />
    );
  }

  return (
    <>
      <PlayerCalendarScreen />
      <PushScreenTransition active={view !== 'home'}>{subView}</PushScreenTransition>
    </>
  );
};
