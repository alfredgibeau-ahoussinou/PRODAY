import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from '../models/User';
import type { TeamEvent } from '../models/TeamEvent';
import type { PlayerActivity } from '../models/PlayerActivity';
import type { WellnessCheckin } from '../services/wellnessCheckins.service';
import { useDashboardData } from './useDashboardData';
import { playerActivityService } from '../services/playerActivity.service';
import { wellnessCheckinsService } from '../services/wellnessCheckins.service';
import { userRsvp } from '../models/TeamEvent';
import { useJoueurProgress } from '../context/JoueurProgressContext';
import { getProfileCompletion } from '../utils/profileCompletion';
import {
  getNextMatchEvent,
  getNextTrainingEvent,
  getNextTeamEvent,
  resolvePlayerDayPriority,
  type PlayerDayPriority,
} from '../utils/amateurPlayerHome';

export type PlayerHubData = {
  firstName: string;
  clubName: string | null;
  nextMatch: TeamEvent | null;
  nextTraining: TeamEvent | null;
  nextEvent: TeamEvent | null;
  dayPriority: PlayerDayPriority;
  pendingConvocations: TeamEvent[];
  wellnessScore: number | null;
  wellnessCheckin: WellnessCheckin | null;
  formPercent: number | null;
  activities: PlayerActivity[];
  profileCompletion: number;
  level: number;
  ovr: number;
  stars: number;
  streakDays: number;
  loading: boolean;
  refresh: () => Promise<void>;
};

function firstNameFromUser(user: User): string {
  const raw = user.display_name?.trim() || 'Joueur';
  return raw.split(/\s+/)[0] ?? raw;
}

export function usePlayerHubData(profile: User | null): PlayerHubData {
  const { data: dashboard, refresh: refreshDashboard } = useDashboardData(profile);
  const progress = useJoueurProgress();
  const [activities, setActivities] = useState<PlayerActivity[]>([]);
  const [wellnessCheckin, setWellnessCheckin] = useState<WellnessCheckin | null>(null);
  const [extraLoading, setExtraLoading] = useState(false);

  const loadExtra = useCallback(async () => {
    if (!profile?.uid) return;
    setExtraLoading(true);
    try {
      const [acts, wellness] = await Promise.all([
        playerActivityService.listForPlayer(profile.uid, 12),
        wellnessCheckinsService.listLatestForUser(profile.uid),
      ]);
      setActivities(acts);
      setWellnessCheckin(wellness);
    } finally {
      setExtraLoading(false);
    }
  }, [profile?.uid]);

  useEffect(() => {
    void loadExtra();
  }, [loadExtra]);

  const refresh = useCallback(async () => {
    await refreshDashboard();
    await loadExtra();
  }, [refreshDashboard, loadExtra]);

  const events = dashboard.myUpcomingEvents.length
    ? dashboard.myUpcomingEvents
    : dashboard.teamEvents;

  const nextEvent = useMemo(() => getNextTeamEvent(events), [events]);
  const nextMatch = useMemo(() => getNextMatchEvent(events), [events]);
  const nextTraining = useMemo(() => getNextTrainingEvent(events), [events]);
  const dayPriority = useMemo(() => resolvePlayerDayPriority(events), [events]);

  const pendingConvocations = useMemo(() => {
    if (dashboard.pendingConvocations.length) return dashboard.pendingConvocations;
    if (!profile?.uid) return [];
    return events.filter((e: TeamEvent) => userRsvp(e, profile.uid) === 'pending');
  }, [dashboard.pendingConvocations, events, profile?.uid]);

  const wellnessScore = wellnessCheckin?.wellness_score ?? null;
  const formPercent =
    wellnessScore != null
      ? Math.round(Math.max(0, Math.min(100, wellnessScore)))
      : null;

  const profileCompletion = profile ? getProfileCompletion(profile).percent : 0;

  return {
    firstName: profile ? firstNameFromUser(profile) : 'Joueur',
    clubName: profile?.profile.club_id ? 'Mon club' : null,
    nextMatch,
    nextTraining,
    nextEvent,
    dayPriority,
    pendingConvocations,
    wellnessScore,
    wellnessCheckin,
    formPercent,
    activities,
    profileCompletion,
    level: progress?.level?.level ?? 1,
    ovr: progress?.ovr ?? 0,
    stars: progress?.progress.stars ?? 0,
    streakDays: progress?.progress.streakDays ?? 0,
    loading: dashboard.loading || extraLoading,
    refresh,
  };
}
