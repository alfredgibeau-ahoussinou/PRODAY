export type TeamEventType =
  | 'training'
  | 'detection'
  | 'meeting'
  | 'friendly'
  | 'tournament'
  | 'other';

export type RsvpStatus = 'pending' | 'yes' | 'no' | 'maybe';
export type AttendanceMark = 'present' | 'late' | 'excused' | 'absent';

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

export interface PlayerMatchSheetStat {
  uid: string;
  player_name: string;
  minutes_played?: number;
  rating?: number; // 0-10
  goals?: number;
  assists?: number;
  yellow_cards?: number;
  red_cards?: number;
}

export const LIVE_ACTION_LABELS: Record<LiveActionType, string> = {
  goal: 'But',
  assist: 'Passe décisive',
  yellow_card: 'Carton jaune',
  red_card: 'Carton rouge',
  sub_in: 'Entrée',
  sub_out: 'Sortie',
};

export const FORMATIONS = ['4-3-3', '4-4-2', '3-5-2', '4-2-3-1', '5-3-2'] as const;

export interface TeamEvent {
  id: string;
  title: string;
  description?: string;
  event_type: TeamEventType;
  organizer_uid: string;
  organizer_name: string;
  club_id?: string;
  club_name?: string;
  /** Lien Arena — tournoi associé */
  tournament_id?: string;
  /** Lien match amical — évite les doublons de convocation */
  friendly_match_id?: string;
  starts_at: Date;
  ends_at?: Date;
  city: string;
  location_label?: string;
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
  live_actions?: LiveMatchAction[];
  player_match_stats?: Record<string, PlayerMatchSheetStat>;
  stats_applied_at?: Date;
  match_report_finalized_at?: Date;
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
  tournament_id?: string;
  friendly_match_id?: string;
  starts_at: Date;
  ends_at?: Date;
  city: string;
  location_label?: string;
  invitee_uids: string[];
  max_participants?: number;
  categories?: string[];
  reminder_hours_before?: number;
}

export const EVENT_TYPE_LABELS: Record<TeamEventType, string> = {
  training: 'Entraînement',
  detection: 'Journée détection',
  meeting: 'Réunion',
  friendly: 'Match / convocation',
  tournament: 'Tournoi Arena',
  other: 'Autre',
};

export function countRsvpYes(event: TeamEvent): number {
  return Object.values(event.rsvps).filter((s) => s === 'yes').length;
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
