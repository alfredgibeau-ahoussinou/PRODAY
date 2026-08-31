/**
 * Helpers purs Entraînements Club — hero séance, présence (testables).
 */
import type { ClubTeamRow } from '../../../utils/clubStructureView';
import {
  isCoachTrainingEvent,
  resolveEventSessionStatus,
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

export type ClubTrainingCardModel = {
  id: string;
  title: string;
  clockLabel: string;
  dayLabel: string;
  teamLabel?: string;
  locationLabel?: string;
  focusLabel?: string;
  status: EventSessionStatus;
  statusLabel: string;
  presence: ClubMatchPresenceSummary;
  isToday: boolean;
  isInProgress: boolean;
};

function asDate(value: Date | string | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

const STATUS_LABELS: Record<EventSessionStatus, string> = {
  scheduled: 'À venir',
  in_progress: 'En cours',
  finished: 'Terminée',
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

/** Prochaine séance / aujourd’hui / en cours — une priorité hero. */
export function resolveClubTrainingHero(
  trainings: TeamEvent[],
  now = new Date(),
): TeamEvent | null {
  if (trainings.length === 0) return null;

  const inProgress = trainings.find((t) => resolveEventSessionStatus(t) === 'in_progress');
  if (inProgress) return inProgress;

  const upcomingToday = trainings.find((t) => {
    const start = asDate(t.starts_at);
    if (!start) return false;
    return isSameCalendarDay(start, now) && start.getTime() >= now.getTime() - 30 * 60 * 1000;
  });
  if (upcomingToday) return upcomingToday;

  const nextFuture = trainings.find((t) => {
    const start = asDate(t.starts_at);
    return start != null && start.getTime() >= now.getTime() - 30 * 60 * 1000;
  });
  if (nextFuture) return nextFuture;

  const todayAny = trainings.find((t) => {
    const start = asDate(t.starts_at);
    return start != null && isSameCalendarDay(start, now);
  });
  if (todayAny) return todayAny;

  return trainings[trainings.length - 1] ?? null;
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
  const status = resolveEventSessionStatus(event);
  const focus =
    event.session_plan?.focus?.trim() ||
    event.session_plan?.notes?.trim() ||
    event.description?.trim() ||
    undefined;

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
