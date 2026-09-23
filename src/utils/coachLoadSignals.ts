/**
 * Signaux de charge **réels** du pôle Coach.
 *
 * Le bandeau « Vigilance charge » du tableau de bord annonçait auparavant
 * qu'aucune alerte n'était connectée. Ce module construit les signaux à partir
 * des seules données autorisées de l'équipe active :
 *
 *  - événements de l'équipe (`team_events`) : matchs, entraînements, pointages
 *    de présence, feuilles de match (minutes jouées) ;
 *  - check-ins de forme (`wellness_checkins`) : fatigue, récupération, statut
 *    déclaré par le joueur.
 *
 * Règles d'honnêteté (§8 du protocole) :
 *  - aucune valeur n'est inventée : une donnée absente reste `null` et son
 *    absence est nommée dans `missing` ;
 *  - une séance **pointée** ne compte jamais un joueur non marqué comme présent ;
 *  - un statut déclaré (« indisponible ») n'entraîne aucun détail médical ;
 *  - `sources` indique précisément ce qui a pu être lu, pour que l'interface
 *    puisse dire *pourquoi* un signal manque au lieu d'afficher un vide.
 */

import type { TeamEvent } from '../models/TeamEvent';
import {
  isCoachMatchEvent,
  isCoachTrainingEvent,
  isComingRsvp,
  isSessionCancelled,
} from '../models/TeamEvent';
import type { WellnessSignals } from '../models/SmartTactics';
import {
  buildLoadAlerts,
  type LoadAlert,
  type PlayerLoadSignals,
} from './playerLoadAlerts';

/** Fenêtre d'analyse des matchs et entraînements, en jours. */
export const COACH_LOAD_WINDOW_DAYS = 7;

/** Ancienneté maximale d'un check-in de forme retenu comme « déclaré ce jour ». */
export const COACH_WELLNESS_LOOKBACK_DAYS = 3;

export interface CoachLoadRosterEntry {
  uid: string;
  displayName: string;
}

export interface CoachLoadLastEvent {
  startsAt: Date;
  eventType: TeamEvent['event_type'];
  title: string;
}

export interface CoachLoadSources {
  /** Effectif de l'équipe active chargé. */
  roster: boolean;
  /**
   * Au moins un événement de l'équipe a pu être lu. Vrai même si aucun ne tombe
   * dans la fenêtre : c'est ce champ qui distingue « source illisible » de
   * « rien ces 7 derniers jours ».
   */
  events: boolean;
  /** Au moins une séance/match portant un pointage de présence. */
  attendance: boolean;
  /** Au moins une minute jouée lue (feuille de match ou déclarée). */
  minutes: boolean;
  /** Au moins un check-in de forme du club lu. */
  wellness: boolean;
}

export interface CoachLoadReport {
  windowDays: number;
  wellnessLookbackDays: number;
  /** Un signal par joueur de l'effectif (valeurs absentes = null). */
  signals: PlayerLoadSignals[];
  /** Alertes dérivées — jamais un pourcentage de risque de blessure. */
  alerts: LoadAlert[];
  /** Alertes portant une information exploitable (hors « donnée manquante »). */
  actionable: LoadAlert[];
  counts: { high: number; caution: number; info: number };
  matchesInWindow: number;
  trainingsInWindow: number;
  /** Événements de l'équipe dans la fenêtre (matchs + entraînements). */
  eventsInWindow: number;
  /** Dernier événement connu de l'équipe, dans ou hors fenêtre. */
  lastEvent: CoachLoadLastEvent | null;
  /** Joueurs pour lesquels au moins une donnée réelle a été trouvée. */
  trackedPlayers: number;
  /** Joueurs dont le statut déclaré est « indisponible » (suspension/blessure). */
  unavailablePlayers: number;
  sources: CoachLoadSources;
  /** Vrai dès qu'une donnée de charge réelle existe. */
  hasData: boolean;
  /** Sources absentes, formulées pour l'utilisateur. */
  missing: string[];
}

export interface CoachLoadSignalInput {
  roster: CoachLoadRosterEntry[];
  events: TeamEvent[];
  wellnessByUid?: Record<string, WellnessSignals>;
  now: Date;
}

function startOfWindow(now: Date, days: number): number {
  return now.getTime() - days * 24 * 60 * 60 * 1000;
}

/** Événement passé, dans la fenêtre, non annulé. */
function isInWindow(event: TeamEvent, fromMs: number, nowMs: number): boolean {
  const start = event.starts_at?.getTime?.() ?? NaN;
  if (!Number.isFinite(start)) return false;
  if (start > nowMs) return false;
  if (start < fromMs) return false;
  return !isSessionCancelled(event);
}

/**
 * Participation à un match : pointage prioritaire, puis composition, puis
 * minutes portées à la feuille, puis présence annoncée. Rien d'autre n'est
 * assimilé à une participation.
 */
function playedMatch(event: TeamEvent, uid: string): boolean {
  const mark = event.attendance_marks?.[uid];
  if (mark) return mark === 'present' || mark === 'late';
  if (event.lineup?.slots?.some((slot) => slot.uid === uid)) return true;
  const minutes = event.player_match_stats?.[uid]?.minutes_played;
  if (typeof minutes === 'number') return minutes > 0;
  const rsvp = event.rsvps?.[uid];
  return rsvp ? isComingRsvp(rsvp) : false;
}

/**
 * Présence à un entraînement : le pointage fait autorité. Si la séance a été
 * pointée, l'absence de marque vaut absence — jamais une présence déduite.
 */
function attendedTraining(event: TeamEvent, uid: string): boolean {
  const mark = event.attendance_marks?.[uid];
  if (mark) return mark === 'present' || mark === 'late';
  const marks = event.attendance_marks ?? {};
  if (Object.keys(marks).length > 0) return false;
  const rsvp = event.rsvps?.[uid];
  if (rsvp) return isComingRsvp(rsvp);
  return false;
}

function hasAnyMark(event: TeamEvent): boolean {
  return Object.keys(event.attendance_marks ?? {}).length > 0;
}

/** Statut déclaré → statut visible coach (aucun détail médical). */
function declaredStatus(wellness?: WellnessSignals): PlayerLoadSignals['rtpStatus'] {
  if (!wellness) return undefined;
  if (wellness.suspended) return 'unavailable';
  if (wellness.injured) return 'unavailable';
  return undefined;
}

export function buildCoachLoadSignals(input: CoachLoadSignalInput): CoachLoadReport {
  const { roster, events, wellnessByUid, now } = input;
  const nowMs = now.getTime();
  const fromMs = startOfWindow(now, COACH_LOAD_WINDOW_DAYS);

  const pastEvents = events.filter((event) => {
    const start = event.starts_at?.getTime?.() ?? NaN;
    return Number.isFinite(start) && start <= nowMs && !isSessionCancelled(event);
  });

  const matchesInWindow = events.filter(
    (event) => isCoachMatchEvent(event) && isInWindow(event, fromMs, nowMs),
  );
  const trainingsInWindow = events.filter(
    (event) => isCoachTrainingEvent(event) && isInWindow(event, fromMs, nowMs),
  );

  /** Dernier événement connu — sert à expliquer une fenêtre vide sans l'inventer. */
  const lastPast = pastEvents
    .slice()
    .sort((a, b) => b.starts_at.getTime() - a.starts_at.getTime())[0];
  const lastEvent: CoachLoadLastEvent | null = lastPast
    ? {
        startsAt: lastPast.starts_at,
        eventType: lastPast.event_type,
        title: lastPast.title,
      }
    : null;

  const attendanceTracked =
    [...matchesInWindow, ...trainingsInWindow].some(hasAnyMark);

  let minutesTracked = false;
  let wellnessTracked = false;

  const signals: PlayerLoadSignals[] = roster.map((player) => {
    const uid = player.uid;
    const wellness = wellnessByUid?.[uid];
    if (wellness) wellnessTracked = true;

    const playedMatches = matchesInWindow.filter((event) => playedMatch(event, uid));

    let minutesFromSheet = 0;
    let sheetMinutesKnown = false;
    for (const event of playedMatches) {
      const minutes = event.player_match_stats?.[uid]?.minutes_played;
      if (typeof minutes === 'number') {
        minutesFromSheet += minutes;
        sheetMinutesKnown = true;
      }
    }

    const declaredMinutes =
      typeof wellness?.minutes_last_7d === 'number' ? wellness.minutes_last_7d : null;

    /**
     * Source unique de minutes : la feuille de match si elle existe, sinon la
     * valeur déclarée par le joueur. Jamais la somme des deux (double compte).
     */
    const minutesLast7d = sheetMinutesKnown
      ? minutesFromSheet
      : declaredMinutes ?? 0;
    if (minutesLast7d > 0) minutesTracked = true;

    const trainingsLast7d = trainingsInWindow.filter((event) =>
      attendedTraining(event, uid),
    ).length;

    /** Dernier match joué, hors fenêtre comprise : sert au délai de récupération. */
    const lastPlayed = events
      .filter((event) => isCoachMatchEvent(event) && !isSessionCancelled(event))
      .filter((event) => (event.starts_at?.getTime?.() ?? Infinity) <= nowMs)
      .filter((event) => playedMatch(event, uid))
      .sort((a, b) => b.starts_at.getTime() - a.starts_at.getTime())[0];

    const daysSinceLastMatch = lastPlayed
      ? Math.floor((nowMs - lastPlayed.starts_at.getTime()) / (24 * 60 * 60 * 1000))
      : null;

    return {
      uid,
      displayName: player.displayName,
      matchesLast7d: playedMatches.length,
      minutesLast7d,
      trainingsLast7d,
      declaredFatigue: typeof wellness?.fatigue === 'number' ? wellness.fatigue : null,
      daysSinceLastMatch,
      rtpStatus: declaredStatus(wellness),
    };
  });

  const alerts = buildLoadAlerts(signals);
  const actionable = alerts.filter((alert) => alert.kind !== 'missing');
  const counts = { high: 0, caution: 0, info: 0 };
  for (const alert of actionable) counts[alert.level] += 1;

  const eventsInWindow = matchesInWindow.length + trainingsInWindow.length;
  const sources: CoachLoadSources = {
    roster: roster.length > 0,
    events: events.length > 0,
    attendance: attendanceTracked,
    minutes: minutesTracked,
    wellness: wellnessTracked,
  };

  const missing: string[] = [];
  if (!sources.roster) missing.push('effectif de l’équipe');
  if (!sources.events) missing.push('événements de l’équipe');
  else if (eventsInWindow === 0) missing.push('événements des 7 derniers jours');
  if (!sources.attendance) missing.push('pointages de présence');
  if (!sources.minutes) missing.push('minutes jouées');
  if (!sources.wellness) missing.push('check-ins de forme');

  const trackedPlayers = signals.filter(
    (signal) =>
      signal.matchesLast7d > 0 ||
      signal.trainingsLast7d > 0 ||
      signal.minutesLast7d > 0 ||
      signal.declaredFatigue != null,
  ).length;

  return {
    windowDays: COACH_LOAD_WINDOW_DAYS,
    wellnessLookbackDays: COACH_WELLNESS_LOOKBACK_DAYS,
    signals,
    alerts,
    actionable,
    counts,
    matchesInWindow: matchesInWindow.length,
    trainingsInWindow: trainingsInWindow.length,
    eventsInWindow,
    lastEvent,
    trackedPlayers,
    unavailablePlayers: signals.filter((signal) => signal.rtpStatus === 'unavailable')
      .length,
    sources,
    hasData:
      sources.attendance || sources.minutes || sources.wellness || eventsInWindow > 0,
    missing,
  };
}
