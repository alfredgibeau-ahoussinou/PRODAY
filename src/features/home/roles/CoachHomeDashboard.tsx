import React, { useCallback, useMemo } from 'react';
import type { StaffRoleHomeProps } from './resolveRoleHomeDashboard';
import {
  StaffRoleHomeShell,
  StaffSectionTitle,
  StaffStatRow,
  StaffQuickActions,
  StaffListCard,
  StaffEmptyCard,
} from './staffRoleHomeShared';
import { useDashboardData } from '../../../hooks/useDashboardData';
import { useCoachShellNav } from '../../coach/shell/CoachShellNavContext';
import { useTabNavigation } from '../../../context/TabNavigationContext';
import { useTabNavigationActions } from '../../../hooks/useTabNavigationActions';
import { useTranslation } from '../../../context/LocaleContext';
import { formatCalendarDate } from '../../../utils/seasonCalendar';
import {
  countAttendanceMark,
  countRsvpYes,
  EVENT_TYPE_LABELS,
} from '../../../models/TeamEvent';
import { isInMatchWindow } from '../../../utils/matchLive';
import type { RolePanelAction } from '../../../content/roleDashboardExperience';
export const CoachHomeDashboard: React.FC<StaffRoleHomeProps> = ({
  profile,
  unreadMessages,
  onRefresh,
  refreshing,
}) => {
  const { t } = useTranslation();
  const { data, refresh } = useDashboardData(profile);
  const tabNav = useTabNavigation();
  const nav = useTabNavigationActions();
  const shellNav = useCoachShellNav();

  const upcoming = useMemo(
    () =>
      [...data.teamEvents]
        .filter((e) => e.starts_at.getTime() > Date.now())
        .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime()),
    [data.teamEvents]
  );

  const nextEvent = upcoming[0] ?? null;
  const liveEvent = useMemo(
    () => data.teamEvents.find((e) => isInMatchWindow(e)) ?? null,
    [data.teamEvents]
  );

  const handleRefresh = useCallback(async () => {
    await refresh();
    await onRefresh?.();
  }, [refresh, onRefresh]);

  const openEvent = (eventId: string, hubChapter?: 'live' | 'composition') => {
    tabNav.openMatchs({ eventId, hubChapter });
  };

  const handleQuickAction = (action: RolePanelAction) => {
    if (action.title === 'Calendrier équipe') {
      if (shellNav) shellNav.requestNav('entrainements');
      else nav.openMatchs({ homeTab: 'convocations' });
      return;
    }
    if (action.title === 'Covoiturage') {
      nav.openCarpool();
      return;
    }
    if (action.title === 'Recrutement') {
      nav.openMercato('create_post');
      return;
    }
    if (action.title === 'Diplômes') {
      nav.openProfile();
    }
  };

  const attendanceStats = nextEvent
    ? [
        {
          label: t('roleHome.coach.rsvpYes'),
          value: String(countRsvpYes(nextEvent)),
        },
        {
          label: t('roleHome.coach.present'),
          value: String(countAttendanceMark(nextEvent, 'present')),
          highlight: true,
        },
        {
          label: t('roleHome.coach.absent'),
          value: String(countAttendanceMark(nextEvent, 'absent')),
        },
      ]
    : [];

  return (
    <StaffRoleHomeShell
      profile={profile}
      role="coach"
      unreadMessages={unreadMessages}
      globalScore={data.pulse.score}
      loading={data.loading}
      onRefresh={() => void handleRefresh()}
      refreshing={refreshing}
    >
      <StaffSectionTitle
        title={t('roleHome.coach.convocationsTitle')}
        subtitle={t('roleHome.coach.convocationsSub')}
      />

      {upcoming.length === 0 ? (
        <StaffEmptyCard message={t('roleHome.coach.noEvents')} />
      ) : (
        upcoming.slice(0, 4).map((event, index) => (
          <StaffListCard
            key={event.id}
            index={index + 1}
            title={event.title}
            subtitle={`${EVENT_TYPE_LABELS[event.event_type]} · ${formatCalendarDate(event.starts_at)}`}
            meta={event.city}
            onPress={() => openEvent(event.id)}
          />
        ))
      )}

      {nextEvent ? (
        <>
          <StaffSectionTitle
            title={t('roleHome.coach.attendanceTitle')}
            subtitle={nextEvent.title}
          />
          <StaffStatRow items={attendanceStats} />
        </>
      ) : null}

      {liveEvent ? (
        <StaffListCard
          index={5}
          title={t('roleHome.coach.liveStats')}
          subtitle={`${liveEvent.title} · ${t('roleHome.coach.liveNow')}`}
          onPress={() => openEvent(liveEvent.id, 'live')}
        />
      ) : null}

      <StaffSectionTitle title={t('roleHome.quickActions')} />
      <StaffListCard
        index={1}
        title="Créer séance"
        subtitle="Planning · entraînement IA"
        onPress={() => nav.openDashboard('smart_tactics')}
      />
      <StaffListCard
        index={2}
        title="Composer équipe"
        subtitle={nextEvent ? nextEvent.title : 'Ouvrir le Centre Match'}
        onPress={() => {
          if (nextEvent) openEvent(nextEvent.id, 'composition');
          else if (shellNav) shellNav.requestNav('match_center');
          else nav.openMatchs();
        }}
      />
      <StaffListCard
        index={3}
        title="Compte rendu"
        subtitle="Debrief post-match"
        onPress={() => {
          if (nextEvent) tabNav.openMatchs({ eventId: nextEvent.id, hubChapter: 'stats' });
          else if (shellNav) shellNav.requestNav('match_center');
          else nav.openMatchs();
        }}
      />
      <StaffQuickActions
        role="coach"
        onAction={(action) => {
          if (action.title === 'Calendrier équipe') {
            handleQuickAction(action);
            return;
          }
          if (action.title === 'Covoiturage') {
            nav.openCarpool();
            return;
          }
          if (action.title === 'Recrutement') {
            nav.openMercato('create_post');
            return;
          }
          if (action.title === 'Diplômes') {
            nav.openProfile();
            return;
          }
          handleQuickAction(action);
        }}
      />

      <StaffListCard
        index={6}
        title={t('roleHome.coach.lineup')}
        subtitle={t('roleHome.coach.lineupSub')}
        onPress={() => {
          if (nextEvent) openEvent(nextEvent.id, 'composition');
          else nav.openDashboard('gestion');
        }}
      />
    </StaffRoleHomeShell>
  );
};
