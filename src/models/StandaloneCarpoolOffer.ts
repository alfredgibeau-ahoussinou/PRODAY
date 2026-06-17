import type { GeoPoint } from './User';
import type { CarpoolPassenger } from './TeamEvent';

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
  notes?: string;
  passengers?: CarpoolPassenger[];
  status: 'open' | 'closed' | 'completed' | 'cancelled';
  /** Visible uniquement aux membres du même club */
  club_only?: boolean;
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
  notes?: string;
  city?: string;
  club_id?: string;
  club_only?: boolean;
}
