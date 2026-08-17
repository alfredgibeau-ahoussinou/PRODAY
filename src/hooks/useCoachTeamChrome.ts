import { useEffect, useState } from 'react';
import { useTranslation } from '../context/LocaleContext';
import { useCoachShellNav } from '../features/coach/shell/CoachShellNavContext';
import type { CoachNavItemId } from '../features/coach/navigation/coachNavConfig';
import { useSessionProfile } from './useSessionProfile';
import { clubsService } from '../services/clubs.service';
import { teamsService } from '../services/teams.service';
import { teamEventsService } from '../services/teamEvents.service';
import { listCoachCalendarUpcoming } from '../utils/coachCalendarHome';

/** Nom d’équipe, pastilles notif et navigation header — partagé par toutes les pages coach. */
export function useCoachTeamChrome() {
  const profile = useSessionProfile();
  const { t } = useTranslation();
  const shellNav = useCoachShellNav();
  const fallback = t('coach.calendar.teamFallback');
  const [teamName, setTeamName] = useState(fallback);
  const [pendingNotifs, setPendingNotifs] = useState(0);

  useEffect(() => {
    setTeamName(fallback);
  }, [fallback]);

  useEffect(() => {
    const clubId = profile?.profile.club_id;
    const uid = profile?.uid;
    if (!clubId || !uid) {
      setTeamName(fallback);
      setPendingNotifs(0);
      return;
    }
    let cancelled = false;
    void Promise.all([
      clubsService.getById(clubId),
      teamsService.listByClubId(clubId),
      teamEventsService.listForUser(uid, clubId),
    ])
      .then(([club, teams, events]) => {
        if (cancelled) return;
        const mine =
          teams.find((team) => team.coach_uids.includes(uid)) ??
          teams.find((team) => team.is_default) ??
          teams[0];
        setTeamName(mine?.name || club?.name || fallback);
        const upcoming = listCoachCalendarUpcoming(events);
        setPendingNotifs(
          upcoming.reduce((acc, event) => acc + (event.rsvps[uid] === 'pending' ? 1 : 0), 0),
        );
      })
      .catch(() => {
        if (!cancelled) {
          setTeamName(fallback);
          setPendingNotifs(0);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [profile?.profile.club_id, profile?.uid, fallback]);

  const openNav = (id: CoachNavItemId) => {
    shellNav?.requestNav(id);
  };

  return {
    teamName,
    pendingNotifs,
    profile,
    openNav,
    displayName: profile?.display_name ?? 'Coach',
  };
}
