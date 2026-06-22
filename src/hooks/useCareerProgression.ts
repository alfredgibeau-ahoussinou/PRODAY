import { useCallback, useEffect, useState } from 'react';
import type { User } from '../models/User';
import type { PlayerActivity } from '../models/PlayerActivity';
import { playerActivityService } from '../services/playerActivity.service';
import { teamEventsService } from '../services/teamEvents.service';
import { careerPreferencesService } from '../services/careerPreferences.service';
import { getProfileCompletion } from '../utils/profileCompletion';
import {
  computeCareerProgressionScore,
  type CareerProgressionResult,
} from '../utils/careerProgressionScore';

export function usePlayerActivities(uid: string | undefined, options?: { syncTeamEvents?: boolean }) {
  const [activities, setActivities] = useState<PlayerActivity[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!uid) {
      setActivities([]);
      return;
    }
    setLoading(true);
    try {
      if (options?.syncTeamEvents !== false) {
        const events = await teamEventsService.listParticipationHistory(uid);
        await playerActivityService.syncFromTeamEvents(uid, events);
      }
      const list = await playerActivityService.listForPlayer(uid);
      setActivities(list);
    } finally {
      setLoading(false);
    }
  }, [uid, options?.syncTeamEvents]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { activities, loading, refresh };
}

/** Activités d'un joueur pour vue staff (sans sync team_events). */
export function usePlayerActivitiesForStaff(playerUid: string | undefined) {
  const [activities, setActivities] = useState<PlayerActivity[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!playerUid) {
      setActivities([]);
      return;
    }
    setLoading(true);
    const list = await playerActivityService.listForPlayerPublicSummary(playerUid, 30);
    setActivities(list);
    setLoading(false);
  }, [playerUid]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { activities, loading, refresh };
}

export type CareerProgressionState = CareerProgressionResult & {
  weeklySessionTarget: number;
  setWeeklySessionTarget: (target: number) => Promise<void>;
};

export function useCareerProgression(
  profile: User | null,
  options?: {
    activities?: PlayerActivity[];
    mercatoApplicationsCount?: number;
    streakDays?: number;
    weeklySessionTarget?: number;
  }
): CareerProgressionState | null {
  const activities = options?.activities ?? [];
  const [weeklyTarget, setWeeklyTarget] = useState(options?.weeklySessionTarget ?? 3);

  useEffect(() => {
    if (options?.weeklySessionTarget != null) {
      setWeeklyTarget(options.weeklySessionTarget);
      return;
    }
    if (!profile || profile.role !== 'player') return;
    void careerPreferencesService.getWeeklySessionsTarget(profile.uid).then(setWeeklyTarget);
  }, [profile?.uid, profile?.role, options?.weeklySessionTarget]);

  const setWeeklySessionTarget = useCallback(
    async (target: number) => {
      if (!profile?.uid) return;
      const value = Math.max(1, Math.min(7, Math.round(target)));
      await careerPreferencesService.setWeeklySessionsTarget(profile.uid, value);
      setWeeklyTarget(value);
    },
    [profile?.uid]
  );

  if (!profile || profile.role !== 'player') return null;

  const result = computeCareerProgressionScore({
    seasonStats: profile.profile.season_stats,
    activities,
    profileCompletionPercent: getProfileCompletion(profile).percent,
    mercatoApplicationsCount: options?.mercatoApplicationsCount ?? 0,
    streakDays: options?.streakDays ?? 0,
    weeklySessionTarget: weeklyTarget,
  });

  return { ...result, weeklySessionTarget: weeklyTarget, setWeeklySessionTarget };
}

/** Score carrière pour vue staff sur un joueur. */
export function computePlayerCareerForStaff(
  player: User,
  activities: PlayerActivity[],
  weeklySessionTarget = 3
): CareerProgressionResult {
  return computeCareerProgressionScore({
    seasonStats: player.profile.season_stats,
    activities,
    profileCompletionPercent: getProfileCompletion(player).percent,
    weeklySessionTarget,
  });
}
