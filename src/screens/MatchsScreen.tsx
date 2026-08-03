import React, { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTabNavigation } from '../context/TabNavigationContext';
import { openSeasonCalendarItem } from '../utils/navigationDeepLink';
import { useTabNavigationActions } from '../hooks/useTabNavigationActions';
import { useFriendlyMatches, useSeasonCalendar } from '../hooks/useAppData';
import { useTournaments } from '../hooks/useTournaments';
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
import { MatchHomeScreen } from '../components/matchs/MatchHomeScreen';
import type { MatchChapterId } from '../content/matchChapters';
import type { SeasonCalendarItem } from '../utils/seasonCalendar';
import { ProposeMatchScreen } from './ProposeMatchScreen';
import { SearchMatchScreen } from './SearchMatchScreen';
import { CreateTournamentScreen } from './CreateTournamentScreen';
import { CreateTeamEventScreen } from './CreateTeamEventScreen';
import { TournamentDetailScreen } from './TournamentDetailScreen';
import { MatchEventHubScreen } from './MatchEventHubScreen';
import type { MatchHubChapterId } from '../content/matchHubChapters';
import { prodayHaptics } from '../utils/prodayHaptics';
import { isInMatchWindow } from '../utils/matchLive';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useTranslation } from '../context/LocaleContext';
import { PushScreenTransition } from '../components/motion';
import { userCanManageConvocations } from '../utils/clubFeatureAccess';

type MatchView =
  | 'home'
  | 'propose'
  | 'search'
  | 'create_event'
  | 'create_tournament'
  | 'tournament_detail'
  | 'event_detail';

export const MatchsScreen: React.FC = () => {
  const [view, setView] = React.useState<MatchView>('home');
  const [initialChapter, setInitialChapter] = React.useState<MatchChapterId>('calendrier');
  const [selectedEventId, setSelectedEventId] = React.useState<string | null>(null);
  const [selectedTournamentId, setSelectedTournamentId] = React.useState<string | null>(null);
  const [hubChapter, setHubChapter] = React.useState<MatchHubChapterId>('apercu');
  const [rsvpBusy, setRsvpBusy] = React.useState(false);
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
  const { acceptMatch, cancelMatch, markPlayed, canAccept } = useMatchActions(profile);
  const { guardAcceptMatch, guardRsvpYes, getMatchIaScore, checkMatch } =
    useMatchJoinGuard(profile);
  const [myClubId, setMyClubId] = React.useState<string | null>(null);

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

  /** Convocations = Staff premium ; tournois = organisateur / staff coach. */
  const canManageConvocations = userCanManageConvocations(profile);
  const canManageTournaments = Boolean(
    profile &&
      (profile.role === 'organizer' ||
        profile.role === 'coach' ||
        profile.role === 'agent'),
  );

  React.useEffect(() => {
    setMyClubId(profile ? profile.profile.club_id ?? profile.uid : null);
  }, [profile]);

  React.useEffect(() => {
    if (!pendingMatchsLink) return;
    if (pendingMatchsLink.homeTab === 'matches') {
      setInitialChapter('amicaux');
    } else if (pendingMatchsLink.homeTab === 'convocations') {
      setInitialChapter('convocations');
    } else if (pendingMatchsLink.homeTab === 'centre') {
      setInitialChapter('centre');
    } else if (pendingMatchsLink.homeTab === 'stats') {
      setInitialChapter('stats');
    } else if (pendingMatchsLink.homeTab === 'tournois') {
      setInitialChapter('tournois');
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
          setInitialChapter('amicaux');
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
          setInitialChapter('amicaux');
        }}
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
  }

  return (
    <>
      <MatchHomeScreen
        profile={profile}
        items={items}
        teamEvents={events}
        matches={matches}
        tournaments={tournaments}
        loadingTournaments={loadingTournaments}
        pendingConvocations={pendingConvocations}
        myUpcomingEvents={myUpcomingEvents}
        nextItem={nextItem}
        loadingCalendar={loadingCalendar}
        loadingMatches={loadingMatches}
        canManageEvents={canManageConvocations}
        canManageTournaments={canManageTournaments}
        myClubId={myClubId}
        initialChapter={initialChapter}
        rsvpBusy={rsvpBusy}
        canAccept={canAccept}
        intelligence={intelligence}
        getMatchIaScore={getMatchIaScore}
        getMatchHealthWarning={getMatchHealthWarning}
        onPropose={() => {
          if (!requireAuth(t('matchs.auth.propose'))) return;
          setView('propose');
        }}
        onSearch={() => {
          if (!requireAuth(t('matchs.auth.search'))) return;
          setView('search');
        }}
        onCreateEvent={() => {
          if (!requireAuth(t('matchs.auth.createEvent'))) return;
          setView('create_event');
        }}
        onOpenTournament={(id) => {
          if (!requireAuth(t('matchs.auth.tournament'))) return;
          setSelectedTournamentId(id);
          setView('tournament_detail');
        }}
        onCreateTournament={() => {
          if (!requireAuth(t('matchs.auth.createTournament'))) return;
          setView('create_tournament');
        }}
        onOpenCalendarItem={openCalendarItem}
        onOpenEvent={(id, hubChapter) => openEvent(id, hubChapter ?? 'apercu')}
        onRsvp={handleRsvp}
        onAcceptMatch={(m) =>
          guardAcceptMatch(m, () =>
            acceptMatch(m, () => {
              recordMatchJoin();
              refreshMatches();
            })
          )
        }
        onCancelMatch={(m) => cancelMatch(m, refreshMatches)}
        onMarkPlayed={(m) =>
          markPlayed(m, refreshMatches, () => navActions.openProfile())
        }
        fromCache={fromCache}
        onRefresh={refreshAll}
        onOpenCarpoolForEvent={(eventId) =>
          navActions.openCarpool({ chapter: 'reserver', eventId })
        }
      />
      <PushScreenTransition active={view !== 'home'}>{subView}</PushScreenTransition>
    </>
  );
};
