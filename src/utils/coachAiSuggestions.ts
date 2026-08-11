import type { TeamEvent } from '../models/TeamEvent';
import { countAttendanceMark, countRsvpYes, getPendingInviteeUids } from '../models/TeamEvent';
import { totalCarpoolAvailableSeats } from './carpoolBalance';
import type { StaffPriorityItem } from '../features/v3/engines/staffHome.engine';

export type CoachAiSuggestionKind = 'squad' | 'training' | 'logistics';

export interface CoachAiSuggestion {
  id: string;
  kind: CoachAiSuggestionKind;
  title: string;
  detail: string;
  priority: number;
}

/** Priorités cockpit coach — pas de faux compteurs Mercato. */
export function buildCoachPortalPriorities(input: {
  hasClub: boolean;
  membersCount: number;
  upcomingEvents: number;
  pendingConvocations: number;
  canManageConvocations: boolean;
}): StaffPriorityItem[] {
  const items: StaffPriorityItem[] = [];

  if (!input.hasClub) {
    items.push({
      id: 'join-club',
      label: 'Club',
      detail: 'Rejoignez ou créez un club pour activer l’effectif',
      tab: 'home',
      action: 'gestion',
      priority: 100,
    });
    return items;
  }

  if (input.membersCount === 0) {
    items.push({
      id: 'invite-roster',
      label: 'Effectif',
      detail: 'Invitez vos premiers joueurs',
      tab: 'home',
      action: 'gestion',
      priority: 96,
    });
  }

  if (input.upcomingEvents === 0) {
    items.push({
      id: 'first-session',
      label: 'Planning',
      detail: 'Planifiez un entraînement ou une convocation',
      tab: 'home',
      action: 'gestion',
      priority: 94,
    });
  }

  if (input.pendingConvocations > 0) {
    items.push({
      id: 'convoc',
      label: 'Convocations',
      detail: `${input.pendingConvocations} réponse(s) attendue(s)`,
      tab: 'matchs',
      priority: 95,
    });
  }

  if (input.upcomingEvents > 0) {
    items.push({
      id: 'events',
      label: 'Agenda',
      detail: `${input.upcomingEvents} événement(s) à venir`,
      tab: 'matchs',
      priority: 70,
    });
  }

  if (!input.canManageConvocations) {
    items.push({
      id: 'pro-gate',
      label: 'Pro',
      detail: 'Passez Pro pour créer des convocations',
      tab: 'profil',
      priority: 60,
    });
  }

  items.push({
    id: 'team-mgmt',
    label: 'Gestion',
    detail: 'Planning, présences, effectif',
    tab: 'home',
    action: 'gestion',
    priority: 50,
  });

  return [...items].sort((a, b) => b.priority - a.priority).slice(0, 4);
}

/** Suggestions heuristiques (pas de backend ML). */
export function buildCoachAiSuggestions(input: {
  events: TeamEvent[];
  membersCount: number;
}): CoachAiSuggestion[] {
  const now = Date.now();
  const upcoming = [...input.events]
    .filter((e) => e.starts_at.getTime() > now)
    .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
  const next = upcoming[0];
  const items: CoachAiSuggestion[] = [];

  if (!next) {
    items.push({
      id: 'plan-session',
      kind: 'training',
      title: 'Planifier une séance',
      detail: 'Aucun événement à venir — créez un entraînement ou une convocation.',
      priority: 90,
    });
    return items;
  }

  const pending = getPendingInviteeUids(next).length;
  const yes = countRsvpYes(next);
  const absent = countAttendanceMark(next, 'absent');
  const carpoolFree = totalCarpoolAvailableSeats(next.carpool_slots);

  if (pending > 0) {
    items.push({
      id: 'remind-rsvp',
      kind: 'logistics',
      title: 'Relancer les absents de réponse',
      detail: `${pending} joueur(s) n’ont pas répondu à « ${next.title} ».`,
      priority: 95,
    });
  }

  if (
    next.event_type === 'friendly' ||
    next.event_type === 'competition' ||
    next.event_type === 'tournament'
  ) {
    const squadHint =
      yes >= 11
        ? `Composition possible (${yes} oui). Affinez titulaire / banc.`
        : yes > 0
          ? `Seulement ${yes} confirmation(s) — élargissez la liste ou ajustez le plan de jeu.`
          : 'Peu de confirmations — préparez une compo type et des convocs de réserve.';
    items.push({
      id: 'squad-select',
      kind: 'squad',
      title: 'Sélection d’effectif',
      detail: squadHint,
      priority: 88,
    });
  }

  if (next.event_type === 'training') {
    const focus =
      absent > 2
        ? 'Groupe réduit : travail technique individuel et duels.'
        : yes >= 12
          ? 'Effectif large : opposed game + transitions.'
          : 'Séance mixte : activation, jeu réduit, finition.';
    items.push({
      id: 'training-focus',
      kind: 'training',
      title: 'Focus séance suggéré',
      detail: focus,
      priority: 84,
    });
  }

  if (carpoolFree != null && carpoolFree <= 2 && next.invitee_uids.length > 6) {
    items.push({
      id: 'carpool-gap',
      kind: 'logistics',
      title: 'Covoiturage tendu',
      detail: 'Peu de places libres — demandez des conducteurs avant le départ.',
      priority: 80,
    });
  }

  if (input.membersCount > 0 && input.membersCount < 11) {
    items.push({
      id: 'roster-thin',
      kind: 'squad',
      title: 'Effectif court',
      detail: `${input.membersCount} joueur(s) club — anticipez les absences.`,
      priority: 70,
    });
  }

  return items.sort((a, b) => b.priority - a.priority).slice(0, 4);
}
