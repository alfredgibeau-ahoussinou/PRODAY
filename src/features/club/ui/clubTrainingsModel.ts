/**
 * Helpers purs Entraînements Club — hero séance, présence (testables).
 */
import type { ClubTeamRow } from '../../../utils/clubStructureView';
import {
  isCoachTrainingEvent,
  resolveEventDisplayStatus,
  type EventSessionStatus,
  type TeamEvent,
} from '../../../models/TeamEvent';
import {
  formatMatchClock,
  formatMatchDay,
  isSameCalendarDay,
  summarizeMatchPresence,
  type ClubMatchPresenceSummary,
} from './clubMatchesModel';

export type ClubTrainingDisplayStatus = EventSessionStatus | 'cancelled';

export type ClubTrainingCardModel = {
  id: string;
  title: string;
  clockLabel: string;
  dayLabel: string;
  teamLabel?: string;
  locationLabel?: string;
  focusLabel?: string;
  status: ClubTrainingDisplayStatus;
  statusLabel: string;
  presence: ClubMatchPresenceSummary;
  isToday: boolean;
  isInProgress: boolean;
  isCancelled: boolean;
  /** Notes de séance visibles par le staff (plan / observations). */
  sessionNotes?: string;
  /** Durée planifiée en minutes (si renseignée). */
  durationMin?: number;
};

function asDate(value: Date | string | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

const STATUS_LABELS: Record<ClubTrainingDisplayStatus, string> = {
  scheduled: 'À venir',
  in_progress: 'En cours',
  finished: 'Terminée',
  cancelled: 'Annulée',
};

export function sortClubTrainings(events: TeamEvent[]): TeamEvent[] {
  return events
    .filter(isCoachTrainingEvent)
    .slice()
    .sort((a, b) => {
      const at = asDate(a.starts_at)?.getTime() ?? 0;
      const bt = asDate(b.starts_at)?.getTime() ?? 0;
      return at - bt;
    });
}

export type ClubTrainingStatusFilter = 'all' | 'upcoming' | 'completed' | 'cancelled';

/**
 * Filtre de statut demandé : la distinction programmé / terminé / annulé est
 * explicite — les séances annulées ne polluent pas le planning actif.
 */
export function filterClubTrainingsByStatus(
  events: TeamEvent[],
  filter: ClubTrainingStatusFilter,
  now = new Date(),
): TeamEvent[] {
  return events.filter((e) => {
    const status = resolveEventDisplayStatus(e);
    // « Toutes » inclut réellement les séances annulées (elles portent la
    // pastille « Annulée ») ; les vues Programmées / Terminées les excluent.
    if (filter === 'all') return true;
    if (filter === 'cancelled') return status === 'cancelled';
    if (status === 'cancelled') return false;
    if (filter === 'upcoming') {
      return status === 'scheduled' || status === 'in_progress';
    }
    if (filter === 'completed') {
      const startsAt = asDate(e.starts_at);
      return status === 'finished' || (startsAt != null && startsAt.getTime() < now.getTime());
    }
    return true;
  });
}

/**
 * Prochaine séance / aujourd’hui / en cours — une priorité hero.
 * Les séances annulées ne sont jamais mises en avant tant qu’il reste une séance
 * active ; si toutes sont annulées, la plus récente est affichée honnêtement
 * (pastille « Annulée ») plutôt que de masquer le planning.
 */
export function resolveClubTrainingHero(
  trainings: TeamEvent[],
  now = new Date(),
): TeamEvent | null {
  if (trainings.length === 0) return null;

  const active = trainings.filter((t) => resolveEventDisplayStatus(t) !== 'cancelled');
  if (active.length === 0) return trainings[trainings.length - 1] ?? null;

  const inProgress = active.find((t) => resolveEventDisplayStatus(t) === 'in_progress');
  if (inProgress) return inProgress;

  const upcomingToday = active.find((t) => {
    const start = asDate(t.starts_at);
    if (!start) return false;
    return isSameCalendarDay(start, now) && start.getTime() >= now.getTime() - 30 * 60 * 1000;
  });
  if (upcomingToday) return upcomingToday;

  const nextFuture = active.find((t) => {
    const start = asDate(t.starts_at);
    return start != null && start.getTime() >= now.getTime() - 30 * 60 * 1000;
  });
  if (nextFuture) return nextFuture;

  const todayAny = active.find((t) => {
    const start = asDate(t.starts_at);
    return start != null && isSameCalendarDay(start, now);
  });
  if (todayAny) return todayAny;

  return active[active.length - 1] ?? null;
}

export function resolveTrainingTeamLabel(
  event: TeamEvent,
  teamRows: ClubTeamRow[],
): string | undefined {
  const teamId = event.team_id?.trim();
  if (!teamId) return undefined;
  return teamRows.find((row) => row.teamId === teamId)?.name?.trim() || undefined;
}

export function buildClubTrainingCardModel(
  event: TeamEvent,
  teamRows: ClubTeamRow[],
  now = new Date(),
): ClubTrainingCardModel {
  const starts = asDate(event.starts_at);
  const status = resolveEventDisplayStatus(event);
  const focus =
    event.session_plan?.focus?.trim() ||
    event.session_plan?.notes?.trim() ||
    event.description?.trim() ||
    undefined;
  const notes = event.session_plan?.notes?.trim() || event.description?.trim() || undefined;

  return {
    id: event.id,
    title: event.title?.trim() || 'Entraînement',
    clockLabel: starts ? formatMatchClock(starts) : 'Horaire à confirmer',
    dayLabel: starts ? formatMatchDay(starts) : 'Date à confirmer',
    teamLabel: resolveTrainingTeamLabel(event, teamRows),
    locationLabel: event.location_label?.trim() || event.city?.trim() || undefined,
    focusLabel: focus ? (focus.length > 72 ? `${focus.slice(0, 69)}…` : focus) : undefined,
    status,
    statusLabel: STATUS_LABELS[status],
    presence: summarizeMatchPresence(event),
    isToday: starts ? isSameCalendarDay(starts, now) : false,
    isInProgress: status === 'in_progress',
    isCancelled: status === 'cancelled',
    sessionNotes: notes,
    durationMin: event.duration_minutes ?? event.session_plan?.duration_min ?? undefined,
  };
}

export type ClubTrainingActionId = 'presence' | 'detail';

export type ClubTrainingAction = {
  id: ClubTrainingActionId;
  label: string;
};

/** CTAs honnêtes : feuille présence locale + détail événement existant. */
export function resolveTrainingActions(model: ClubTrainingCardModel): ClubTrainingAction[] {
  return [
    { id: 'presence', label: 'Présences' },
    { id: 'detail', label: 'Détail' },
  ];
}
