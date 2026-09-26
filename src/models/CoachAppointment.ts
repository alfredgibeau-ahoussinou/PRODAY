/**
 * Modèle pour les rendez-vous individuels joueur-coach et disponibilités de créneaux.
 */

export type AppointmentStatus =
  | 'requested'
  | 'confirmed'
  | 'cancelled'
  | 'rescheduled'
  | 'completed';

export interface CoachAvailabilitySlot {
  id: string;
  coach_uid: string;
  coach_name: string;
  club_id?: string;
  starts_at: Date;
  ends_at: Date;
  is_booked: boolean;
  booked_by_player_uid?: string;
  location?: string;
}

export interface CoachAppointment {
  id: string;
  coach_uid: string;
  coach_name: string;
  player_uid: string;
  player_name: string;
  club_id?: string;

  starts_at: Date;
  ends_at: Date;
  duration_minutes: number;
  location?: string;

  purpose: string; // ex: 'Bilan de progression', 'Point tactique poste', 'Gestion temps de jeu'
  status: AppointmentStatus;

  // Supervision mineur / tuteur
  is_minor: boolean;
  guardian_notified: boolean;
  guardian_name?: string;

  coach_notes?: string;
  cancellation_reason?: string;

  created_at: Date;
  updated_at: Date;
}

export type AppointmentPurpose = string;

export interface RequestAppointmentInput {
  coach_uid: string;
  coach_name: string;
  player_uid: string;
  player_name: string;
  club_id?: string;
  starts_at: Date;
  duration_minutes: number;
  location?: string;
  purpose: AppointmentPurpose;
  is_minor?: boolean;
  guardian_notified?: boolean;
  guardian_name?: string;
}
