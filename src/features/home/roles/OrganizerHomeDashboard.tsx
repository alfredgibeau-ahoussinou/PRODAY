import React, { useCallback, useState } from 'react';
import type { StaffRoleHomeProps } from './resolveRoleHomeDashboard';
import {
  StaffRoleHomeShell,
  StaffSectionTitle,
  StaffQuickActions,
  StaffListCard,
  StaffEmptyCard,
} from './staffRoleHomeShared';
import { useDashboardData } from '../../../hooks/useDashboardData';
import { useTournaments } from '../../../hooks/useTournaments';
import { useOrganizerEvents } from '../../../hooks/useOrganizerEvents';
import { useTabNavigationActions } from '../../../hooks/useTabNavigationActions';
import { useTranslation } from '../../../context/LocaleContext';
import { formatCalendarDate } from '../../../utils/seasonCalendar';
import type { RolePanelAction } from '../../../content/roleDashboardExperience';
import { PushScreenTransition } from '../../../components/motion';
import { DetectionEventsScreen } from '../../../screens/DetectionEventsScreen';
import { CreateTournamentScreen } from '../../../screens/CreateTournamentScreen';
import { OrganizerEventsScreen } from '../../../screens/OrganizerEventsScreen';
import { CreateOrganizerEventScreen } from '../../../screens/CreateOrganizerEventScreen';
import { OrganizerEventDetailScreen } from '../../../screens/OrganizerEventDetailScreen';
import { PressableSpring } from '../../../components/motion';
import { ProDayText } from '../../../components/ui/ProDayText';
import { GlassCard } from '../../../components/aurora/GlassCard';
import { spacing } from '../../../theme/designTokens';
import { StyleSheet } from 'react-native';
import { EVENT_KIND_LABELS, EVENT_STATUS_LABELS } from '../../../models/EventOrganizer';

export const OrganizerHomeDashboard: React.FC<StaffRoleHomeProps> = ({
  profile,
  unreadMessages,
  onRefresh,
  refreshing,
}) => {
  const { t } = useTranslation();
  const { data, refresh } = useDashboardData(profile);
  const { tournaments, loading: tournamentsLoading, refresh: refreshTournaments } =
    useTournaments();
  const {
    events: organizerEvents,
    loading: eventsLoading,
    refresh: refreshEvents,
  } = useOrganizerEvents(profile.uid);
  const nav = useTabNavigationActions();

  const [showDetections, setShowDetections] = useState(false);
  const [showCreateTournament, setShowCreateTournament] = useState(false);
  const [showEventsHub, setShowEventsHub] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const handleRefresh = useCallback(async () => {
    await Promise.all([refresh(), refreshTournaments(), refreshEvents()]);
    await onRefresh?.();
  }, [refresh, refreshTournaments, refreshEvents, onRefresh]);

  const handleQuickAction = (action: RolePanelAction) => {
    if (action.title === 'Événements') {
      setShowEventsHub(true);
      return;
    }
    if (action.title === 'Détections') {
      setShowDetections(true);
      return;
    }
    if (action.title === 'Matchs') {
      nav.openMatchs({ homeTab: 'matches' });
    }
  };

  const upcomingTournaments = tournaments.filter(
    (tournament) => tournament.starts_at.getTime() > Date.now(),
  );

  const upcomingEvents = organizerEvents.filter(
    (event) =>
      event.status !== 'cancelled' &&
      event.status !== 'completed' &&
      event.starts_at.getTime() > Date.now() - 86_400_000,
  );

  return (
    <>
      <StaffRoleHomeShell
        profile={profile}
        role="organizer"
        unreadMessages={unreadMessages}
        globalScore={data.pulse.score}
        loading={data.loading || tournamentsLoading || eventsLoading}
        onRefresh={() => void handleRefresh()}
        refreshing={refreshing}
      >
        <StaffSectionTitle
          title={t('roleHome.organizer.eventsTitle')}
          subtitle={t('roleHome.organizer.eventsSub')}
        />
        {upcomingEvents.length === 0 ? (
          <StaffEmptyCard message={t('roleHome.organizer.noEvents')} />
        ) : (
          upcomingEvents.slice(0, 5).map((event, index) => (
            <StaffListCard
              key={event.id}
              index={index + 1}
              title={event.title}
              subtitle={`${EVENT_KIND_LABELS[event.kind]}${event.city ? ` · ${event.city}` : ''}`}
              meta={`${formatCalendarDate(event.starts_at)} · ${EVENT_STATUS_LABELS[event.status]}`}
              onPress={() => setSelectedEventId(event.id)}
            />
          ))
        )}

        <GlassCard variant="accent" style={styles.cta}>
          <ProDayText variant="section">{t('roleHome.organizer.createEvent')}</ProDayText>
          <ProDayText variant="caption" muted>
            {t('roleHome.organizer.createEventSub')}
          </ProDayText>
          <PressableSpring
            style={styles.ctaBtn}
            onPress={() => setShowCreateEvent(true)}
            scaleTo={0.97}
            haptic
          >
            <ProDayText variant="body" accent>
              {t('roleHome.organizer.createEventCta')}
            </ProDayText>
          </PressableSpring>
          <PressableSpring
            style={styles.ctaBtn}
            onPress={() => setShowEventsHub(true)}
            scaleTo={0.97}
            haptic
          >
            <ProDayText variant="caption" muted>
              {t('roleHome.organizer.allEvents')}
            </ProDayText>
          </PressableSpring>
        </GlassCard>

        <StaffSectionTitle
          title={t('roleHome.organizer.tournamentsTitle')}
          subtitle={t('roleHome.organizer.tournamentsSub')}
        />
        {upcomingTournaments.length === 0 ? (
          <StaffEmptyCard message={t('roleHome.organizer.noTournaments')} />
        ) : (
          upcomingTournaments.slice(0, 5).map((tournament, index) => (
            <StaffListCard
              key={tournament.id}
              index={index + 1}
              title={tournament.title}
              subtitle={tournament.city}
              meta={formatCalendarDate(tournament.starts_at)}
              onPress={() => nav.openMatchs({ homeTab: 'season' })}
            />
          ))
        )}

        <GlassCard variant="accent" style={styles.cta}>
          <ProDayText variant="section">{t('roleHome.organizer.createTournament')}</ProDayText>
          <ProDayText variant="caption" muted>
            {t('roleHome.organizer.createTournamentSub')}
          </ProDayText>
          <PressableSpring
            style={styles.ctaBtn}
            onPress={() => setShowCreateTournament(true)}
            scaleTo={0.97}
            haptic
          >
            <ProDayText variant="body" accent>
              {t('roleHome.organizer.createCta')}
            </ProDayText>
          </PressableSpring>
        </GlassCard>

        <StaffSectionTitle
          title={t('roleHome.organizer.detectionsTitle')}
          subtitle={t('roleHome.organizer.detectionsSub')}
        />
        {data.detections.length === 0 ? (
          <StaffEmptyCard message={t('roleHome.organizer.noDetections')} />
        ) : (
          data.detections.slice(0, 4).map((event, index) => (
            <StaffListCard
              key={event.id}
              index={index + 3}
              title={event.title}
              subtitle={event.city}
              meta={formatCalendarDate(event.starts_at)}
              onPress={() => setShowDetections(true)}
            />
          ))
        )}

        <StaffListCard
          index={7}
          title={t('roleHome.organizer.allDetections')}
          subtitle={t('roleHome.organizer.allDetectionsSub')}
          onPress={() => setShowDetections(true)}
        />

        <StaffSectionTitle title={t('roleHome.quickActions')} />
        <StaffQuickActions role="organizer" onAction={handleQuickAction} />
      </StaffRoleHomeShell>

      <PushScreenTransition active={showDetections}>
        {showDetections ? (
          <DetectionEventsScreen onBack={() => setShowDetections(false)} />
        ) : null}
      </PushScreenTransition>

      <PushScreenTransition active={showCreateTournament}>
        {showCreateTournament ? (
          <CreateTournamentScreen
            profile={profile}
            onBack={() => setShowCreateTournament(false)}
            onCreated={() => {
              setShowCreateTournament(false);
              void refreshTournaments();
            }}
          />
        ) : null}
      </PushScreenTransition>

      <PushScreenTransition active={showEventsHub}>
        {showEventsHub ? (
          <OrganizerEventsScreen
            profile={profile}
            onBack={() => {
              setShowEventsHub(false);
              void refreshEvents();
            }}
          />
        ) : null}
      </PushScreenTransition>

      <PushScreenTransition active={showCreateEvent}>
        {showCreateEvent ? (
          <CreateOrganizerEventScreen
            profile={profile}
            onBack={() => setShowCreateEvent(false)}
            onCreated={(id) => {
              setShowCreateEvent(false);
              void refreshEvents();
              setSelectedEventId(id);
            }}
          />
        ) : null}
      </PushScreenTransition>

      <PushScreenTransition active={Boolean(selectedEventId)}>
        {selectedEventId ? (
          <OrganizerEventDetailScreen
            profile={profile}
            eventId={selectedEventId}
            onBack={() => {
              setSelectedEventId(null);
              void refreshEvents();
            }}
          />
        ) : null}
      </PushScreenTransition>
    </>
  );
};

const styles = StyleSheet.create({
  cta: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  ctaBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
});
