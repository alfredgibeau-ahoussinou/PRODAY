import type { GeoPoint } from './User';

/** Cycle de vie du trajet (distinct du statut de réservation). */
export type CarpoolTripStatus = 'scheduled' | 'in_progress' | 'completed';

export type CarpoolLiveTripKind = 'standalone' | 'event';

/** Document Firestore `carpool_trip_live/{tripId}` — position conducteur pendant le trajet. */
export interface CarpoolLiveTripDoc {
  trip_id: string;
  kind: CarpoolLiveTripKind;
  /** Offre libre (`carpool_offers`) */
  offer_id?: string;
  /** Événement équipe */
  event_id?: string;
  driver_uid: string;
  /** Conducteur + passagers confirmés — seuls autorisés à lire la position. */
  participant_uids: string[];
  active: boolean;
  location?: GeoPoint;
  heading?: number;
  accuracy_m?: number;
  updated_at?: Date;
  started_at?: Date;
  ended_at?: Date;
}

export interface CarpoolLiveLocationUpdate {
  latitude: number;
  longitude: number;
  heading?: number;
  accuracy_m?: number;
}
