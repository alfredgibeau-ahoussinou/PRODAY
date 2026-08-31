/**
 * Helpers purs Parent RSVP — prochain événement, libellés, état (testables).
 */
import {
  EVENT_TYPE_LABELS,
  RSVP_STATUS_LABELS,
  isComingRsvp,
  isLateRsvp,
  type RsvpStatus,
  type TeamEvent,
} from '../../../models/TeamEvent';

export type ParentRsvpChoice = 'yes' | 'no' | 'maybe';

export type ParentRsvpTone = 'pending' | 'yes' | 'no' | 'maybe' | 'late';

export function pickNextChildEvent(
  events: TeamEvent[],
  nowMs = Date.now(),
): TeamEvent | null {
  const cutoff = nowMs - 2 * 60 * 60 * 1000;
  const upcoming = events
    .filter((e) => e.starts_at.getTime() >= cutoff)
    .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
  return upcoming[0] ?? null;
}

export function formatParentEventWhen(startsAt: Date): string {
  return startsAt.toLocaleString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatParentEventType(event: TeamEvent): string {
  return EVENT_TYPE_LABELS[event.event_type] ?? event.event_type;
}

export function resolveChildRsvp(
  event: TeamEvent,
  childUid: string,
): RsvpStatus | undefined {
  return event.rsvps?.[childUid];
}

export function needsParentRsvpResponse(status?: RsvpStatus | null): boolean {
  return !status || status === 'pending';
}

export function resolveParentRsvpTone(status?: RsvpStatus | null): ParentRsvpTone {
  if (!status || status === 'pending') return 'pending';
  if (isLateRsvp(status)) return 'late';
  if (status === 'yes') return 'yes';
  if (status === 'no') return 'no';
  if (status === 'maybe') return 'maybe';
  return 'pending';
}

export function parentRsvpStatusLabel(status?: RsvpStatus | null): string {
  if (!status || status === 'pending') return 'À confirmer';
  return RSVP_STATUS_LABELS[status] ?? status;
}

export function parentRsvpSuccessCopy(
  status: RsvpStatus,
  childName: string,
): string {
  const name = childName.trim() || 'votre enfant';
  if (isComingRsvp(status)) {
    return `${name} est annoncé(e) présent(e) — le coach est prévenu.`;
  }
  if (status === 'no') {
    return `${name} est annoncé(e) absent(e) — le coach est prévenu.`;
  }
  if (status === 'maybe') {
    return `Réponse « peut-être » enregistrée pour ${name}.`;
  }
  return `Réponse enregistrée pour ${name}.`;
}

export function parentAgendaSubtitle(input: {
  upcomingCount: number;
  pendingRsvpCount: number;
}): string {
  if (input.pendingRsvpCount > 0) {
    return `${input.pendingRsvpCount} présence${input.pendingRsvpCount > 1 ? 's' : ''} à confirmer`;
  }
  if (input.upcomingCount > 0) {
    return `${input.upcomingCount} séance${input.upcomingCount > 1 ? 's' : ''} à venir`;
  }
  return 'Séances et matchs de l’enfant';
}
