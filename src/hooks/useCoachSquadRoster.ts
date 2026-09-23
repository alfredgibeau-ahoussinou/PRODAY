import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSessionProfile } from './useSessionProfile';
import { useCoachTheme } from '../features/coach/shell/CoachThemeContext';
import { teamsService } from '../services/teams.service';
import { membershipsService } from '../services/memberships.service';
import { usersService } from '../services/users.service';
import { teamEventsService } from '../services/teamEvents.service';
import { canManageTeamEvent } from '../utils/teamEventAccess';
import { pickLineupTargetEvent } from '../utils/tacticalBoardSync';
import {
  buildCoachSquadPlayers,
  rsvpFromAvailability,
  type SquadAvailability,
  type SquadPlayer,
} from '../utils/coachSquadRoster';
import { getPendingInviteeUids } from '../models/TeamEvent';
import type { Membership } from '../models/Membership';
import type { Team } from '../models/Team';
import type { EventLineup, RsvpStatus, TeamEvent } from '../models/TeamEvent';
import type { User } from '../models/User';

/** RSVP d'un joueur sur un événement — ajoute le joueur aux convoqués si besoin. */
function withRsvp(event: TeamEvent, uid: string, status: RsvpStatus): TeamEvent {
  return {
    ...event,
    rsvps: { ...event.rsvps, [uid]: status },
    invitee_uids: event.invitee_uids.includes(uid)
      ? event.invitee_uids
      : [...event.invitee_uids, uid],
  };
}

export type CoachSquadRoster = {
  loading: boolean;
  refreshing: boolean;
  /** Message prêt à afficher, jamais un objet d'erreur brut. */
  error: string | null;
  clubId: string | null;
  players: SquadPlayer[];
  /** Prochain match / convocation de l'équipe active — cible de la publication. */
  nextMatch: TeamEvent | null;
  /** Match cible pour la saisie des statistiques et notes (récent, en cours ou prochain). */
  publishTarget: TeamEvent | null;
  /** Le profil courant peut-il écrire sur ce match (compo, présence staff) ? */
  canManageMatch: boolean;
  /**
   * Invités du prochain match qui n'ont **pas encore répondu** — même définition
   * que le Match Center, l'accueil et les rappels (`getPendingInviteeUids`).
   */
  pendingInviteeUids: string[];
  refresh: () => Promise<void>;
  /** Écrit la disponibilité du joueur **sur la convocation réelle**. */
  setAvailability: (playerId: string, availability: SquadAvailability) => Promise<void>;
  /** Publie la composition sur le prochain match. */
  publishLineup: (lineup: EventLineup) => Promise<TeamEvent>;
};

/**
 * Effectif réel du coach — adhésions du club + membres, filtrés sur l'équipe
 * active, et disponibilité lue sur la convocation du prochain match.
 *
 * L'ancienne page tournait sur une équipe de démonstration codée en dur : le
 * chargement et la publication n'avaient donc aucune contrepartie en base. Ici,
 * tout ce que l'écran affiche vient du club, et tout ce que le coach écrit part
 * dans `team_events`.
 */
export function useCoachSquadRoster(): CoachSquadRoster {
  const profile = useSessionProfile();
  const { teamId } = useCoachTheme();
  const clubId = profile?.profile.club_id ?? null;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [events, setEvents] = useState<TeamEvent[]>([]);

  const load = useCallback(async () => {
    if (!clubId) {
      setTeams([]);
      setMemberships([]);
      setMembers([]);
      setEvents([]);
      setError(null);
      setLoading(false);
      return;
    }
    try {
      const [teamList, membershipList, memberList] = await Promise.all([
        teamsService.listByClubId(clubId),
        membershipsService.listByClub(clubId),
        usersService.listMembersByClubId(clubId),
      ]);
      const teamIds = teamList.map((team) => team.id);
      const eventList = await teamEventsService.listForClub(clubId, 120, teamIds);
      setTeams(teamList);
      setMemberships(membershipList);
      setMembers(memberList);
      setEvents(eventList);
      setError(null);
    } catch (loadError) {
      setTeams([]);
      setMemberships([]);
      setMembers([]);
      setEvents([]);
      setError(
        loadError instanceof Error ? loadError.message : 'Effectif du club indisponible.',
      );
    } finally {
      setLoading(false);
    }
  }, [clubId]);

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

  /**
   * Le prochain match **de l'équipe active** : publier la composition sur le
   * match des séniors quand on coache les U17 serait une erreur silencieuse.
   */
  const nextMatch = useMemo(() => {
    const scoped = teamId ? events.filter((event) => event.team_id === teamId) : events;
    return pickLineupTargetEvent(scoped);
  }, [events, teamId]);

  const publishTarget = useMemo(() => {
    const scoped = teamId ? events.filter((event) => event.team_id === teamId) : events;
    const matches = scoped.filter(
      (e) => e.event_type === 'competition' || e.event_type === 'friendly' || e.event_type === 'tournament',
    );
    const liveOrCompleted = matches.find(
      (e) =>
        e.live_state?.status === 'finished' ||
        e.live_state?.status === 'live' ||
        e.live_state?.status === 'halftime',
    );
    return liveOrCompleted ?? nextMatch ?? matches[0] ?? null;
  }, [events, teamId, nextMatch]);

  const players = useMemo(
    () =>
      buildCoachSquadPlayers({
        members,
        memberships,
        teams,
        teamId,
        event: nextMatch,
      }),
    [members, memberships, teams, teamId, nextMatch],
  );

  const canManageMatch = Boolean(
    nextMatch && profile && canManageTeamEvent(nextMatch, profile, { isAdmin: profile.is_admin }),
  );

  /**
   * Réponses en attente **de la convocation** — dérivé de `nextMatch`, donc mis
   * à jour dès qu'un pointage staff est écrit (optimiste ou rechargé).
   */
  const pendingInviteeUids = useMemo(
    () => (nextMatch ? getPendingInviteeUids(nextMatch) : []),
    [nextMatch],
  );

  const setAvailability = useCallback(
    async (playerId: string, availability: SquadAvailability) => {
      if (!profile || !nextMatch) {
        throw new Error('Aucune convocation à mettre à jour pour cette équipe.');
      }
      /** Valeur à rétablir si l'écriture est refusée. */
      const previousRsvp: RsvpStatus = nextMatch.rsvps[playerId] ?? 'pending';
      const status = rsvpFromAvailability(availability);
      /**
       * Affichage immédiat, puis écriture : un pointage qui traîne donne
       * l'impression que le geste n'a pas pris. En cas d'échec, on **rétablit**
       * la valeur d'avant plutôt que de laisser croire au succès.
       */
      setEvents((previous) =>
        previous.map((event) => (event.id === nextMatch.id ? withRsvp(event, playerId, status) : event)),
      );
      try {
        await teamEventsService.updateRsvpAsStaff(nextMatch.id, playerId, status, {
          user: profile,
          isAdmin: profile.is_admin,
        });
      } catch (writeError) {
        setEvents((previous) =>
          previous.map((event) =>
            event.id === nextMatch.id ? withRsvp(event, playerId, previousRsvp) : event,
          ),
        );
        throw writeError;
      }
    },
    [nextMatch, profile],
  );

  const publishLineup = useCallback(
    async (lineup: EventLineup): Promise<TeamEvent> => {
      if (!profile || !nextMatch) {
        throw new Error('Aucun match à venir pour cette équipe.');
      }
      await teamEventsService.saveLineup(nextMatch.id, lineup, {
        user: profile,
        isAdmin: profile.is_admin,
      });
      const published = { ...nextMatch, lineup };
      setEvents((previous) =>
        previous.map((event) => (event.id === nextMatch.id ? published : event)),
      );
      return published;
    },
    [nextMatch, profile],
  );

  return {
    loading,
    refreshing,
    error,
    clubId,
    players,
    nextMatch,
    publishTarget,
    canManageMatch,
    pendingInviteeUids,
    refresh,
    setAvailability,
    publishLineup,
  };
}
