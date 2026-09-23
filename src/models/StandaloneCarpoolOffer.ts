import type { GeoPoint } from './User';
import type { CarpoolPassenger } from './TeamEvent';
import type { CarpoolTripStatus } from './CarpoolLiveTrip';
import type { CarpoolVehicleType } from './CarpoolVehicle';

/** Proposition de covoiturage sans événement / convocation liée. */
export interface StandaloneCarpoolOffer {
  id: string;
  driver_uid: string;
  driver_name: string;
  club_id?: string;
  city?: string;
  title: string;
  destination_label?: string;
  destination_location?: GeoPoint;
  departs_at: Date;
  meeting_time?: string;
  meeting_place?: string;
  meeting_location?: GeoPoint;
  seats: number;
  /** Type de véhicule (citadine, SUV…). */
  vehicle_type?: CarpoolVehicleType;
  notes?: string;
  passengers?: CarpoolPassenger[];
  /** Réservation : open/closed ; trajet : in_progress/completed/cancelled */
  status: 'open' | 'closed' | 'in_progress' | 'completed' | 'cancelled';
  /** Cycle de vie trajet (prioritaire sur le mapping legacy via status). */
  trip_status?: CarpoolTripStatus;
  /** Visible uniquement aux membres du même club */
  club_only?: boolean;
  /**
   * Événement (convocation / match / tournoi) auquel le trajet est rattaché.
   * Lien affiché dans le Pôle Club pour retrouver le contexte et le fil autorisé.
   */
  event_id?: string;
  event_title?: string;
  /**
   * Âge minimal de l'équipe cible : les mineurs non-autorisés voient le trajet
   * mais ne peuvent pas réserver ( garde mineur, cf. standaloneCarpoolMinor ).
   */
  created_at: Date;
  updated_at: Date;
}

export interface CreateStandaloneCarpoolInput {
  title: string;
  destination_label?: string;
  destination_location?: GeoPoint;
  departs_at: Date;
  meeting_time?: string;
  meeting_place?: string;
  meeting_location?: GeoPoint;
  seats: number;
  vehicle_type?: CarpoolVehicleType;
  notes?: string;
  city?: string;
  club_id?: string;
  club_only?: boolean;
  event_id?: string;
  event_title?: string;
}
