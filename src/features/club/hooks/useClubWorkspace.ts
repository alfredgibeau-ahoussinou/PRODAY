import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSessionProfile } from '../../../hooks/useSessionProfile';
import { clubsService } from '../../../services/clubs.service';
import { profileService } from '../../../services/profile.service';
import { teamsService } from '../../../services/teams.service';
import { membershipsService } from '../../../services/memberships.service';
import { usersService } from '../../../services/users.service';
import { teamEventsService } from '../../../services/teamEvents.service';
import type { Club } from '../../../models/Club';
import type { Team } from '../../../models/Team';
import type { Membership } from '../../../models/Membership';
import type { User } from '../../../models/User';
import type { TeamEvent } from '../../../models/TeamEvent';
import { isCoachMatchEvent, isCoachTrainingEvent } from '../../../models/TeamEvent';
import {
  buildClubTeamRows,
  buildStaffSummary,
  countPendingMemberships,
  type ClubTeamRow,
} from '../../../utils/clubStructureView';
import { buildClubAiBriefing } from '../../../utils/clubAiBriefing';
import { resolveClubWorkspaceClubId } from './resolveClubWorkspaceClubId';

export type ClubWorkspace = {
  loading: boolean;
  refreshing: boolean;
  clubId: string | null;
  club: Club | null;
  teams: Team[];
  teamRows: ClubTeamRow[];
  memberships: Membership[];
  members: User[];
  players: User[];
  coaches: User[];
  events: TeamEvent[];
  todayMatches: TeamEvent[];
  todayTrainings: TeamEvent[];
  pendingMemberships: number;
  teamsWithoutCoach: number;
  statusLabel: string;
  statusTone: 'ok' | 'warn' | 'alert';
  todoCount: number;
  briefingHeadline: string;
  briefingSummary: string;
  refresh: () => Promise<void>;
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function isSameDay(a: Date, b: Date): boolean {
  return a >= startOfDay(b) && a <= endOfDay(b);
}

/**
 * Données partagées du Pôle Club — équipes, membres, événements réels.
 */
export function useClubWorkspace(): ClubWorkspace {
  const profile = useSessionProfile();
  const profileClubId = profile?.profile.club_id ?? null;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clubId, setClubId] = useState<string | null>(profileClubId);
  const [club, setClub] = useState<Club | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [events, setEvents] = useState<TeamEvent[]>([]);

  const load = useCallback(async () => {
    const resolved = await resolveClubWorkspaceClubId({
      profileClubId,
      role: profile?.role,
      uid: profile?.uid,
      getByOwner: (uid) => clubsService.getByOwner(uid),
    });
    const nextClubId = resolved.clubId;
    setClubId(nextClubId);

    if (
      resolved.shouldBackfill &&
      nextClubId &&
      profile?.uid &&
      profileClubId !== nextClubId
    ) {
      void profileService
        .updateProfile(profile.uid, { profile: { club_id: nextClubId } })
        .catch(() => undefined);
    }

    if (!nextClubId) {
      setClub(null);
      setTeams([]);
      setMemberships([]);
      setMembers([]);
      setEvents([]);
      setLoading(false);
      return;
    }
    try {
      const [clubDoc, teamList, membershipList, memberList, eventList] = await Promise.all([
        clubsService.getById(nextClubId),
        teamsService.listByClubId(nextClubId),
        membershipsService.listByClub(nextClubId),
        usersService.listMembersByClubId(nextClubId),
        teamEventsService.listForClub(nextClubId, 80),
      ]);
      setClub(clubDoc);
      setTeams(teamList);
      setMemberships(membershipList);
      setMembers(memberList);
      setEvents(eventList);
    } catch {
      setClub(null);
      setTeams([]);
      setMemberships([]);
      setMembers([]);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [profileClubId, profile?.role, profile?.uid]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const coachNamesByUid = useMemo(() => {
    const map = new Map<string, string>();
    members.forEach((m) => map.set(m.uid, m.display_name));
    return map;
  }, [members]);

  const teamRows = useMemo(
    () => buildClubTeamRows(teams, memberships, coachNamesByUid),
    [teams, memberships, coachNamesByUid],
  );

  const staff = useMemo(() => buildStaffSummary(teams), [teams]);

  const players = useMemo(
    () => members.filter((m) => m.role === 'player'),
    [members],
  );

  const coaches = useMemo(() => {
    const byUid = new Map(members.map((m) => [m.uid, m]));
    const fromTeams = staff.coachUids
      .map((uid) => byUid.get(uid))
      .filter(Boolean) as User[];
    const roleCoaches = members.filter((m) => m.role === 'coach');
    const map = new Map<string, User>();
    [...fromTeams, ...roleCoaches].forEach((u) => map.set(u.uid, u));
    return Array.from(map.values());
  }, [members, staff.coachUids]);

  const todayMatches = useMemo(() => {
    const now = new Date();
    return events.filter(
      (e) => isCoachMatchEvent(e) && e.starts_at && isSameDay(new Date(e.starts_at), now),
    );
  }, [events]);
  const todayTrainings = useMemo(() => {
    const now = new Date();
    return events.filter(
      (e) => isCoachTrainingEvent(e) && e.starts_at && isSameDay(new Date(e.starts_at), now),
    );
  }, [events]);

  const pendingMemberships = countPendingMemberships(memberships);
  const teamsWithoutCoach = teams.filter((t) => !(t.coach_uids?.length > 0)).length;

  const briefing = useMemo(
    () =>
      buildClubAiBriefing({
        clubName: club?.name ?? profile?.display_name ?? 'Club',
        teamsCount: teams.length,
        playersCount: players.length,
        coachesCount: coaches.length,
        pendingMemberships,
        teamsWithoutCoach,
        openInternalNeeds: 0,
        openExternalNeeds: 0,
      }),
    [
      club?.name,
      profile?.display_name,
      teams.length,
      players.length,
      coaches.length,
      pendingMemberships,
      teamsWithoutCoach,
    ],
  );

  const todoCount = briefing.priorities.length;
  const statusLabel =
    todoCount === 0 ? 'Tout est à jour' : `${todoCount} action${todoCount > 1 ? 's' : ''}`;
  const statusTone: 'ok' | 'warn' | 'alert' =
    todoCount === 0 ? 'ok' : todoCount >= 3 ? 'alert' : 'warn';

  return {
    loading,
    refreshing,
    clubId,
    club,
    teams,
    teamRows,
    memberships,
    members,
    players,
    coaches,
    events,
    todayMatches,
    todayTrainings,
    pendingMemberships,
    teamsWithoutCoach,
    statusLabel,
    statusTone,
    todoCount,
    briefingHeadline: briefing.headline,
    briefingSummary: briefing.summary,
    refresh,
  };
}
