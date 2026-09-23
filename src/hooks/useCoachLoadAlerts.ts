/**
 * Alertes de charge réelles du pôle Coach.
 *
 * Lit les seules sources autorisées de l'équipe active — effectif et
 * appartenances du club, événements de l'équipe, check-ins de forme — puis
 * délègue le calcul à `buildCoachLoadSignals`. Le module ne fabrique aucune
 * donnée : si une source est vide, le rapport le dit (`sources`, `missing`).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSessionProfile } from './useSessionProfile';
import { useCoachTheme } from '../features/coach/shell/CoachThemeContext';
import { teamEventsService } from '../services/teamEvents.service';
import { membershipsService } from '../services/memberships.service';
import { usersService } from '../services/users.service';
import { wellnessCheckinsService } from '../services/wellnessCheckins.service';
import type { Membership } from '../models/Membership';
import type { TeamEvent } from '../models/TeamEvent';
import type { WellnessSignals } from '../models/SmartTactics';
import type { User } from '../models/User';
import { eventBelongsToTeam, filterMembersForTeam, teamPlayerUids } from '../utils/coachTeamTheme';
import {
  buildCoachLoadSignals,
  COACH_WELLNESS_LOOKBACK_DAYS,
  type CoachLoadReport,
} from '../utils/coachLoadSignals';

export type CoachLoadAlertsState = 'loading' | 'ready' | 'error' | 'guest';

export interface CoachLoadAlertsValue {
  state: CoachLoadAlertsState;
  /** Rapport complet — `null` tant que la lecture n'a rien produit. */
  report: CoachLoadReport | null;
  /** Relance une lecture (rafraîchissement utilisateur). */
  reload: () => void;
}

/** Clés locales des derniers jours de check-in, du plus récent au plus ancien. */
function recentDateKeys(days: number, now = new Date()): string[] {
  const keys: string[] = [];
  for (let index = 0; index < days; index += 1) {
    const day = new Date(now.getTime() - index * 24 * 60 * 60 * 1000);
    keys.push(wellnessCheckinsService.todayKey(day));
  }
  return keys;
}

/**
 * Dernier check-in connu par joueur sur les derniers jours — le plus récent
 * gagne. Aucune agrégation, aucune moyenne : un check-in absent reste absent.
 */
async function loadRecentWellness(
  clubId: string,
): Promise<Record<string, WellnessSignals>> {
  const keys = recentDateKeys(COACH_WELLNESS_LOOKBACK_DAYS);
  const maps = await Promise.all(
    keys.map((key) =>
      wellnessCheckinsService.listLatestForClub(clubId, key, 80).catch(() => ({})),
    ),
  );
  const merged: Record<string, WellnessSignals> = {};
  for (const map of maps) {
    for (const [uid, signals] of Object.entries(map)) {
      if (!merged[uid]) merged[uid] = signals;
    }
  }
  return merged;
}

export function useCoachLoadAlerts(): CoachLoadAlertsValue {
  const profile = useSessionProfile();
  const { teamId } = useCoachTheme();
  const clubId = profile?.profile.club_id;
  const [state, setState] = useState<CoachLoadAlertsState>('loading');
  const [report, setReport] = useState<CoachLoadReport | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    if (!clubId) {
      setReport(null);
      setState('guest');
      return;
    }
    let cancelled = false;
    setState('loading');

    void (async () => {
      try {
        const [members, memberships, events, wellnessByUid] = await Promise.all([
          usersService.listMembersByClubId(clubId).catch((): User[] => []),
          membershipsService.listByClub(clubId).catch((): Membership[] => []),
          teamEventsService
            .listForClub(clubId, 120, teamId ? [teamId] : undefined)
            .catch((): TeamEvent[] => []),
          loadRecentWellness(clubId),
        ]);
        if (cancelled) return;

        const roster = filterMembersForTeam(members, memberships, teamId).map(
          (member) => ({
            uid: member.uid,
            displayName: member.display_name || 'Joueur',
          }),
        );
        const teamUids = teamPlayerUids(memberships, teamId);
        const teamEvents = events.filter((event) =>
          eventBelongsToTeam(event, teamId, teamUids),
        );

        setReport(
          buildCoachLoadSignals({
            roster,
            events: teamEvents,
            wellnessByUid,
            now: new Date(),
          }),
        );
        setState('ready');
      } catch {
        if (cancelled) return;
        setReport(null);
        setState('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId, teamId, reloadKey]);

  return useMemo(() => ({ state, report, reload }), [state, report, reload]);
}
