export type MedicalAppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'no_show';

export interface WeeklyAvailabilityBlock {
  /** 0 = dimanche, 1 = lundi … */
  weekday: number;
  start: string;
  end: string;
}

export interface MedicalAppointment {
  id: string;
  physio_uid: string;
  physio_name: string;
  patient_uid: string;
  patient_name: string;
  specialty?: string;
  start_at: Date;
  end_at: Date;
  duration_min: number;
  status: MedicalAppointmentStatus;
  motif?: string;
  location_label?: string;
  notes?: string;
  created_at: Date;
  updated_at?: Date;
}

export const MEDICAL_APPOINTMENT_STATUS_LABELS: Record<MedicalAppointmentStatus, string> = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  cancelled: 'Annulé',
  completed: 'Terminé',
  no_show: 'Absent',
};
