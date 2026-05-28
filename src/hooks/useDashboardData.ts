import { useCallback, useEffect, useState } from 'react';
import type { User } from '../models/User';
import type { TeamEvent } from '../models/TeamEvent';
import type { FriendlyMatch } from '../models/FriendlyMatch';
import type { Application } from '../models/Player';
import { userRsvp } from '../models/TeamEvent';
import { teamEventsService } from '../services/teamEvents.service';
import { friendlyMatchesService } from '../services/friendlyMatches.service';
import { recruitmentService } from '../services/recruitment.service';
import { tournamentService } from '../services/tournament.service';
import { statsService, type RecruitmentStats } from '../services/stats.service';
import {
  mergeSeasonCalendar,
  type SeasonCalendarItem,
} from '../utils/seasonCalendar';
import { computeProdayPulse, type ProdayPulseResult } from '../utils/prodayPulse';

export interface DashboardData {
  stats: RecruitmentStats | null;
  pulse: ProdayPulseResult;
  calendarItems: SeasonCalendarItem[];
  nextItem: SeasonCalendarItem | null;
  pendingConvocations: TeamEvent[];
  myUpcomingEvents: TeamEvent[];
  detections: TeamEvent[];
  myApplications: Application[];
  openMatches: FriendlyMatch[];
  loading: boolean;
}

const EMPTY: DashboardData = {
  stats: null,
  pulse: computeProdayPulse({
    uid: '',
    display_name: '',
    email: '',
    role: 'player',
    is_verified: false,
    verification_status: 'NOT_REQUIRED',
    profile: {},
    documents: [],
    created_at: new Date(),
    updated_at: new Date(),
    is_active: true,
  }),
  calendarItems: [],
  nextItem: null,
  pendingConvocations: [],
  myUpcomingEvents: [],
  detections: [],
  myApplications: [],
  openMatches: [],
  loading: true,
};

export function useDashboardData(profile: User | null) {
  const [data, setData] = useState<DashboardData>(EMPTY);

  const refresh = useCallback(async () => {
    if (!profile) {
      setData({ ...EMPTY, loading: false });
      return;
    }

    setData((d) => ({ ...d, loading: true }));

    const clubId = profile.profile.club_id ?? profile.uid;

    const [
      stats,
      teamEvents,
      friendlyMatches,
      tournaments,
      detections,
      applications,
    ] = await Promise.all([
      statsService.getRecruitmentStats(),
      teamEventsService.listForUser(profile.uid, clubId),
      friendlyMatchesService.listUpcoming(20),
      tournamentService.listUpcoming(12),
      teamEventsService.listDetections(8),
      profile.role === 'player'
        ? recruitmentService.listMyApplications(profile.uid)
        : Promise.resolve([] as Application[]),
    ]);

    const myClubId = profile.profile.club_id ?? profile.uid;
    const relevantMatches = friendlyMatches.filter(
      (m) =>
        m.requester_club_id === myClubId ||
        m.opponent_club_id === myClubId ||
        m.status === 'OPEN'
    );

    const pendingConvocations = teamEvents.filter(
      (e) =>
        e.invitee_uids.includes(profile.uid) &&
        userRsvp(e, profile.uid) === 'pending' &&
        e.starts_at.getTime() > Date.now()
    );

    const myUpcomingEvents = teamEvents.filter(
      (e) =>
        (e.organizer_uid === profile.uid ||
          userRsvp(e, profile.uid) === 'yes' ||
          userRsvp(e, profile.uid) === 'maybe') &&
        e.starts_at.getTime() > Date.now()
    );

    const calendarItems = mergeSeasonCalendar(teamEvents, relevantMatches, tournaments);

    const nextItem =
      calendarItems.find((c) => c.starts_at.getTime() > Date.now()) ?? null;

    const pulse = computeProdayPulse(profile, {
      pendingConvocations: pendingConvocations.length,
      applicationsCount: applications.length,
      upcomingEvents: myUpcomingEvents.length,
    });

    setData({
      stats,
      pulse,
      calendarItems: calendarItems.slice(0, 12),
      nextItem,
      pendingConvocations,
      myUpcomingEvents,
      detections,
      myApplications: applications,
      openMatches: relevantMatches.filter((m) => m.status === 'OPEN').slice(0, 5),
      loading: false,
    });
  }, [profile]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, refresh };
}
