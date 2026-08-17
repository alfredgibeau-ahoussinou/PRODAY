import { useEffect, useState } from 'react';
import { useTranslation } from '../context/LocaleContext';
import { useCoachShellNav } from '../features/coach/shell/CoachShellNavContext';
import type { CoachNavItemId } from '../features/coach/navigation/coachNavConfig';
import { useSessionProfile } from './useSessionProfile';
import { useCoachTheme } from '../features/coach/shell/CoachThemeContext';
import { teamEventsService } from '../services/teamEvents.service';
import { listCoachCalendarUpcoming } from '../utils/coachCalendarHome';

/** Nom d’équipe, pastilles notif et navigation header — partagé par toutes les pages coach. */
export function useCoachTeamChrome() {
  const profile = useSessionProfile();
  const { t } = useTranslation();
  const shellNav = useCoachShellNav();
  const fallback = t('coach.calendar.teamFallback');
  const {
    teamId,
    teamName: contextTeamName,
    coachTeams,
    setActiveTeamId,
  } = useCoachTheme();
  const [pendingNotifs, setPendingNotifs] = useState(0);

  const teamName = contextTeamName.trim() ? contextTeamName : fallback;

  useEffect(() => {
    const clubId = profile?.profile.club_id;
    const uid = profile?.uid;
    if (!clubId || !uid) {
      setPendingNotifs(0);
      return;
    }
    let cancelled = false;
    void teamEventsService
      .listForUser(uid, clubId)
      .then((events) => {
        if (cancelled) return;
        const upcoming = listCoachCalendarUpcoming(events);
        setPendingNotifs(
          upcoming.reduce((acc, event) => acc + (event.rsvps[uid] === 'pending' ? 1 : 0), 0),
        );
      })
      .catch(() => {
        if (!cancelled) setPendingNotifs(0);
      });
    return () => {
      cancelled = true;
    };
  }, [profile?.profile.club_id, profile?.uid]);

  const openNav = (id: CoachNavItemId) => {
    shellNav?.requestNav(id);
  };

  return {
    teamId,
    teamName,
    coachTeams,
    setActiveTeamId,
    pendingNotifs,
    profile,
    openNav,
    displayName: profile?.display_name ?? 'Coach',
  };
}
