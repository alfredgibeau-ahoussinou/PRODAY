import type { GeoPoint } from './User';
import type { CarpoolTripStatus } from './CarpoolLiveTrip';
import type { CarpoolVehicleType } from './CarpoolVehicle';
import type { TrainingSessionPlan } from './CoachEvaluation';
import type { EventTransportPlan } from './TransportLogistics';
import { inferMatchStatus } from '../utils/matchLive';

export type TeamEventType =
  | 'training'
  | 'detection'
  | 'meeting'
  | 'friendly'
  | 'tournament'
  | 'competition'
  | 'other';

export type RsvpStatus =
  | 'pending'
  | 'yes'
  | 'no'
  | 'maybe'
  | 'late_under_10'
  | 'late_over_10'
  | 'late_unknown';
export type AttendanceMark = 'present' | 'late' | 'excused' | 'absent';

/** Retard déclaré par le joueur / parent (avant pointage staff). */
export type LateIntent = 'under_10' | 'over_10' | 'unknown';

export const LATE_INTENT_TO_RSVP: Record<LateIntent, RsvpStatus> = {
  under_10: 'late_under_10',
  over_10: 'late_over_10',
  unknown: 'late_unknown',
};

export const RSVP_STATUS_LABELS: Record<RsvpStatus, string> = {
  pending: 'En attente',
  yes: 'Présent',
  no: 'Absent',
  maybe: 'Peut-être',
  late_under_10: 'Retard < 10 min',
  late_over_10: 'Retard ≥ 10 min',
  late_unknown: 'Retard (durée inconnue)',
};

export interface EventLineupSlot {
  uid: string;
  display_name: string;
  role: 'starter' | 'sub';
  position_label?: string;
}

export interface EventLineup {
  formation: string;
  slots: EventLineupSlot[];
}

export type LiveActionType =
  | 'goal'
  | 'assist'
  | 'yellow_card'
  | 'red_card'
  | 'sub_in'
  | 'sub_out';

export interface LiveMatchAction {
  id: string;
  type: LiveActionType;
  player_uid: string;
  player_name: string;
  minute: number;
  created_at: Date;
}

export type EvaluationSource = 'manual' | 'ai_generated' | 'coach_reviewed';
export type EvaluationStatus = 'draft' | 'published';

export interface PlayerStatAuditEntry {
  id: string;
  author_uid: string;
  author_name: string;
  timestamp: string; // ISO format string
  action: 'create' | 'edit_stats' | 'edit_rating' | 'ai_generated' | 'coach_reviewed' | 'published';
  summary: string;
  changes?: {
    field: string;
    old_value?: unknown;
    new_value?: unknown;
  }[];
}

export interface PlayerStatClip {
  timestamp_sec: number;
  label: string;
  description?: string;
}

export interface PlayerMatchSheetStat {
  uid: string;
  player_name: string;
  minutes_played?: number; // 0 is a valid 0-minute value; undefined is unrecorded
  rating?: number; // 0-10 scale; 0 is a valid 0/10 rating; undefined is unrated
  rating_explanation?: string;
  goals?: number;
  assists?: number;
  yellow_cards?: number;
  red_cards?: number;
  clean_sheet?: boolean;

  // Provenance & publication status
  source?: EvaluationSource;
  status?: EvaluationStatus;

  // Author & update metadata
  author_uid?: string;
  author_name?: string;
  evaluated_at?: Date | string;

  // AI evaluation metadata (when source is ai_generated or reviewed)
  ai_confidence?: number; // 0 to 1
  ai_uncertainty_reason?: string;
  ai_clips?: PlayerStatClip[];

  // Modification history & audit log
  history?: PlayerStatAuditEntry[];
}

/** Tâche logistique (covoiturage, matériel…) — assignation coach */
export type EventTaskKind = 'carpool' | 'equipment' | 'snacks' | 'other';

export interface EventTask {
  id: string;
  kind: EventTaskKind;
  label: string;
  assignee_uids: string[];
  done?: boolean;
}

/** Passager ayant réservé une place chez un conducteur */
export interface CarpoolPassenger {
  uid: string;
  name: string;
  /** Lieu textuel où le passager souhaite être récupéré */
  pickup_place?: string;
  /** Coordonnées GPS du point de prise en charge */
  pickup_location?: GeoPoint;
  /** Covoiturage libre — pending jusqu'à validation conducteur */
  status?: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
}

/** Détail d’un conducteur pour un événement */
export interface CarpoolSlot {
  driver_uid: string;
  driver_name: string;
  seats?: number;
  /** Type de véhicule (citadine, SUV…). */
  vehicle_type?: CarpoolVehicleType;
  meeting_time?: string;
  meeting_place?: string;
  /** Coordonnées GPS du point de rendez-vous conducteur */
  meeting_location?: GeoPoint;
  notes?: string;
  /** Proposition spontanée (joueur/coach) plutôt qu’assignation staff */
  volunteered?: boolean;
  /** Coéquipiers ayant réservé une place */
  passengers?: CarpoolPassenger[];
  /** Trajet démarré / terminé (géoloc live pendant in_progress) */
  trip_status?: CarpoolTripStatus;
}

export interface CarpoolMessage {
  id: string;
  author_uid: string;
  author_name: string;
  body: string;
  created_at: Date;
}

export interface CarpoolDriverBalance {
  uid: string;
  name: string;
  trips: number;
  last_trip_at?: Date;
}

export const LIVE_ACTION_LABELS: Record<LiveActionType, string> = {
  goal: 'But',
  assist: 'Passe décisive',
  yellow_card: 'Carton jaune',
  red_card: 'Carton rouge',
  sub_in: 'Entrée',
  sub_out: 'Sortie',
};

export const FORMATIONS = [
  '4-3-3',
  '4-4-2',
  '3-5-2',
  '4-2-3-1',
  '5-3-2',
  '4-1-4-1',
  '3-4-3',
  '4-5-1',
  '5-4-1',
  '4-3-2-1',
  '3-4-2-1',
  '4-4-1-1',
] as const;

export type MatchLiveStatus = 'scheduled' | 'live' | 'halftime' | 'finished' | 'cancelled';

export interface MatchLiveState {
  status: MatchLiveStatus;
  minute?: number;
  home_score: number;
  away_score: number;
  opponent_name?: string;
  home_label?: string;
  /** Motif d'annulation ou de report affiché au staff et aux joueurs. */
  cancel_reason?: string;
  /** Source de la mise à jour (ex: 'national_api_sports', 'club_official_entry') */
  source_type?: 'national_api_sports' | 'club_official_entry' | 'official_final_result' | 'unconfirmed';
  /** Indique si le match bénéficie d'une vraie télémétrie chronométrée en continu */
  has_live_telemetry?: boolean;
  /** Identifiant du coach/délégué ayant saisi ou validé le score */
  verified_by_uid?: string;
  /** Date/heure de la dernière saisie ou synchronisation */
  last_updated_at?: string;
}

export interface TeamEvent {
  id: string;
  title: string;
  description?: string;
  event_type: TeamEventType;
  organizer_uid: string;
  organizer_name: string;
  club_id?: string;
  club_name?: string;
  /** Équipe cible (entraînements multi-équipes coach). */
  team_id?: string;
  /** Lien legacy — tournoi associé (données historiques) */
  tournament_id?: string;
  /** Lien match amical — évite les doublons de convocation */
  friendly_match_id?: string;
  /** Lien fixture compétition saison */
  competition_fixture_id?: string;
  starts_at: Date;
  ends_at?: Date;
  /** Alias date de début (format ISO ou Date) */
  date?: string | Date;
  /** Durée en minutes estimée de la séance/du match */
  duration_minutes?: number;
  city: string;
  location_label?: string;
  /** Alias terrain / lieu */
  location?: string;
  /** UIDs convoqués (réponses dans rsvps) */
  invitee_uids: string[];
  rsvps: Record<string, RsvpStatus>;
  /** Motif déclaré par le joueur (absence, retard, indisponibilité). */
  rsvp_notes?: Record<string, string>;
  /** Pointage final par coach/dirigeant après l'événement. */
  attendance_marks?: Record<string, AttendanceMark>;
  /** Journées détection : places max */
  max_participants?: number;
  categories?: string[];
  reminder_hours_before?: number;
  last_reminder_at?: Date;
  auto_reminder_sent_at?: Date;
  lineup?: EventLineup;
  /** Lien public officiel (Daily / visio) — jamais un stream pirate. */
  public_watch_url?: string;
  /** Score et statut en direct */
  live_state?: MatchLiveState;
  live_actions?: LiveMatchAction[];
  player_match_stats?: Record<string, PlayerMatchSheetStat>;
  stats_applied_at?: Date;
  match_report_finalized_at?: Date;
  /** Tâches assignées (covoiturage, matériel…) */
  event_tasks?: EventTask[];
  /** Plan de séance (entraînements). */
  session_plan?: TrainingSessionPlan;
  /** Conducteurs désignés + places / RDV */
  carpool_slots?: CarpoolSlot[];
  /** Fil de coordination covoiturage (messagerie événement) */
  carpool_messages?: CarpoolMessage[];
  /** Plan global de transport & logistique (bus, covoiturage, mixte, individuel) */
  transport_plan?: EventTransportPlan;
  created_at: Date;
  updated_at: Date;
}

export function getPendingInviteeUids(event: TeamEvent): string[] {
  return event.invitee_uids.filter(
    (uid) => (event.rsvps[uid] ?? 'pending') === 'pending'
  );
}

export function getPresentInviteeUids(event: TeamEvent): string[] {
  return event.invitee_uids.filter((uid) => event.rsvps[uid] === 'yes');
}

export interface CreateTeamEventInput {
  title: string;
  description?: string;
  event_type: TeamEventType;
  organizer_uid: string;
  organizer_name: string;
  club_id?: string;
  club_name?: string;
  team_id?: string;
  tournament_id?: string;
  friendly_match_id?: string;
  competition_fixture_id?: string;
  starts_at: Date;
  ends_at?: Date;
  city: string;
  location_label?: string;
  invitee_uids: string[];
  max_participants?: number;
  categories?: string[];
  reminder_hours_before?: number;
  transport_plan?: EventTransportPlan;
  live_state?: MatchLiveState;
  carpool_slots?: CarpoolSlot[];
  lineup?: EventLineup;
}

export const EVENT_TYPE_LABELS: Record<TeamEventType, string> = {
  training: 'Entraînement',
  detection: 'Journée détection',
  meeting: 'Réunion',
  friendly: 'Match / convocation',
  tournament: 'Tournoi',
  competition: 'Compétition',
  other: 'Autre',
};

export function countRsvpYes(event: TeamEvent): number {
  return Object.values(event.rsvps).filter((s) => isComingRsvp(s)).length;
}

export function isLateRsvp(status: RsvpStatus): boolean {
  return (
    status === 'late_under_10' ||
    status === 'late_over_10' ||
    status === 'late_unknown'
  );
}

/** Présent ou en retard annoncé = compte dans l’effectif attendu. */
export function isComingRsvp(status: RsvpStatus): boolean {
  return status === 'yes' || isLateRsvp(status);
}

export function countAttendanceMark(
  event: TeamEvent,
  mark: AttendanceMark
): number {
  return Object.values(event.attendance_marks ?? {}).filter((m) => m === mark).length;
}

export function userRsvp(event: TeamEvent, uid: string): RsvpStatus {
  return event.rsvps[uid] ?? (event.invitee_uids.includes(uid) ? 'pending' : 'pending');
}

export type EventSessionStatus = 'scheduled' | 'in_progress' | 'finished';

/**
 * Séance annulée par le staff — conservée pour l'historique mais exclue du
 * planning courant. Dérivée de `live_state.status === 'cancelled'` (mêmes
 * données, pas de colonne supplémentaire à migrer).
 */
export function isSessionCancelled(event: TeamEvent): boolean {
  return event.live_state?.status === 'cancelled';
}

/** Statut affichable : annulé prime, sinon le statut de session calculé. */
export function resolveEventDisplayStatus(event: TeamEvent):
  | EventSessionStatus
  | 'cancelled' {
  if (isSessionCancelled(event)) return 'cancelled';
  return resolveEventSessionStatus(event);
}

export function isCoachMatchEvent(e: TeamEvent): boolean {
  if (e.event_type === 'training') return false;
  return (
    e.event_type === 'friendly' ||
    e.event_type === 'competition' ||
    e.event_type === 'tournament' ||
    (e.event_type === 'other' && Boolean(e.title?.toLowerCase().includes('match')))
  );
}

export function isCoachTrainingEvent(e: TeamEvent): boolean {
  if (isCoachMatchEvent(e)) return false;
  return e.event_type === 'training' || e.event_type === 'other';
}

/** Statut unifié séance / match pour le planning coach. */
export function resolveEventSessionStatus(e: TeamEvent): EventSessionStatus {
  if (isCoachMatchEvent(e)) {
    if (e.live_state?.status === 'cancelled') return 'finished';
    const status = inferMatchStatus(e);
    if (status === 'finished') return 'finished';
    if (status === 'live' || status === 'halftime') return 'in_progress';
    return 'scheduled';
  }

  if (isCoachTrainingEvent(e)) {
    if (e.live_state?.status === 'finished') return 'finished';
    const now = Date.now();
    const start = e.starts_at.getTime();
    const end = e.ends_at?.getTime() ?? start + 90 * 60 * 1000;
    if (now > end) return 'finished';
    if (now >= start) return 'in_progress';
    return 'scheduled';
  }

  return 'scheduled';
}

export type CoachEventHubKind = 'match' | 'training' | 'detection' | 'meeting' | 'fallback';

/** Type d’écran hub coach selon l’événement. */
export function coachEventHubKind(e: TeamEvent): CoachEventHubKind {
  if (isCoachMatchEvent(e)) return 'match';
  if (e.event_type === 'training') return 'training';
  if (e.event_type === 'detection') return 'detection';
  if (e.event_type === 'meeting' || e.event_type === 'other') return 'meeting';
  return 'fallback';
}

function hasCoachEventHubBasics(e: TeamEvent): boolean {
  return Boolean(
    e.title?.trim() &&
      e.starts_at instanceof Date &&
      !Number.isNaN(e.starts_at.getTime()),
  );
}

/** Hub coach complet uniquement pour les événements créés via le flux (pas legacy/incomplets). */
export function isCoachEventHubReady(e: TeamEvent): boolean {
  if (!hasCoachEventHubBasics(e)) return false;

  switch (coachEventHubKind(e)) {
    case 'training':
      return Boolean(e.team_id || (e.invitee_uids?.length ?? 0) > 0);
    case 'detection':
      return Boolean(
        e.max_participants != null &&
          e.max_participants > 0 &&
          (e.categories?.length ?? 0) > 0,
      );
    case 'match':
      return Boolean(
        (e.invitee_uids?.length ?? 0) > 0 ||
          e.friendly_match_id ||
          e.competition_fixture_id ||
          e.tournament_id,
      );
    case 'meeting':
      return (e.invitee_uids?.length ?? 0) > 0;
    default:
      return false;
  }
}

export function isCoachDetectionEvent(e: TeamEvent): boolean {
  return e.event_type === 'detection';
}

export function isCoachMeetingEvent(e: TeamEvent): boolean {
  return e.event_type === 'meeting';
}

export function isCoachPlanningRelevant(e: TeamEvent): boolean {
  return (
    isCoachMatchEvent(e) ||
    isCoachTrainingEvent(e) ||
    isCoachDetectionEvent(e) ||
    isCoachMeetingEvent(e)
  );
}
