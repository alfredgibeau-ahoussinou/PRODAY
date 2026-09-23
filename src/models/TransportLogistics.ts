import type { GeoPoint } from './User';
import type { CarpoolSlot } from './TeamEvent';

export type TransportMode =
  | 'carpool_only'
  | 'bus_only'
  | 'mixed'
  | 'individual';

export const TRANSPORT_MODE_LABELS: Record<TransportMode, string> = {
  carpool_only: 'Covoiturage uniquement',
  bus_only: 'Bus / Minibus club',
  mixed: 'Mixte (Bus & Covoiturage)',
  individual: 'Déplacement individuel',
};

export type BusVehicleType = 'bus' | 'minibus' | 'van';

export const BUS_VEHICLE_LABELS: Record<BusVehicleType, string> = {
  bus: 'Grand Bus (40-60 pl.)',
  minibus: 'Minibus Club (9-20 pl.)',
  van: 'Van / Navette (7-9 pl.)',
};

export type BusTripStatus =
  | 'scheduled'
  | 'boarding_open'
  | 'departed'
  | 'delayed'
  | 'return_started'
  | 'arrived'
  | 'cancelled';

export const BUS_TRIP_STATUS_LABELS: Record<BusTripStatus, string> = {
  scheduled: 'Prévu',
  boarding_open: 'Embarquement en cours',
  departed: 'En route',
  delayed: 'Retard signalé',
  return_started: 'Trajet retour en cours',
  arrived: 'Arrivé à destination',
  cancelled: 'Trajet annulé',
};

export interface PickupStop {
  id: string;
  name: string;
  address?: string;
  location?: GeoPoint;
  scheduled_time: string; // e.g. "08:15"
  estimated_time?: string; // staff-entered revised ETA if delay
  actual_time?: string; // staff-recorded arrival
  order: number;
  notes?: string;
}

export type BusPassengerRole = 'player' | 'staff' | 'parent' | 'supporter';

export interface BusPassenger {
  uid: string;
  name: string;
  role: BusPassengerRole;
  pickup_stop_id?: string;
  dropoff_stop_id?: string;
  checked_in_outbound?: boolean;
  checked_in_return?: boolean;
  seat_number?: string | number;
  notes?: string;
  parent_guardian_name?: string;
  /** Explicit staff permission for non-player/staff passengers */
  approved_by_staff?: boolean;
  booked_at: string;
}

export interface BusWaitingEntry {
  uid: string;
  name: string;
  role: BusPassengerRole;
  requested_at: string;
  pickup_stop_id?: string;
  notes?: string;
}

export interface BusJourney {
  departure_place: string;
  departure_time: string; // "HH:mm"
  arrival_place: string;
  arrival_time_scheduled: string; // "HH:mm"
  arrival_time_revised?: string; // "HH:mm"
  stops: PickupStop[];
  status: BusTripStatus;
  status_updated_at?: string; // ISO string
  status_note?: string; // e.g. "Ralentissements sur A6 (+20 min)"
}

export interface ClubBusPlan {
  id: string;
  name: string; // e.g. "Bus U17 National"
  vehicle_type: BusVehicleType;
  capacity: number;
  license_plate?: string;
  driver_name?: string;
  staff_in_charge_uid: string;
  staff_in_charge_name: string;
  staff_in_charge_phone?: string;
  allows_parents?: boolean;
  allows_supporters?: boolean;
  luggage_instructions?: string;
  practical_instructions?: string; // e.g. "Prévoir collation, carte d'identité, tenue officielle"
  outbound: BusJourney;
  return_journey?: BusJourney;
  passengers: BusPassenger[];
  waiting_list: BusWaitingEntry[];
}

export interface EventTransportPlan {
  mode: TransportMode;
  notes?: string;
  buses: ClubBusPlan[];
  independent_traveler_uids: string[];
  carpool_slots?: CarpoolSlot[];
  updated_at?: string;
  updated_by_uid?: string;
}

export interface PassengerTransportSummary {
  uid: string;
  name: string;
  type: 'bus' | 'carpool' | 'independent' | 'none';
  bus?: {
    bus_id: string;
    bus_name: string;
    vehicle_type: BusVehicleType;
    staff_in_charge: {
      name: string;
      phone?: string;
    };
    pickup_stop?: PickupStop;
    outbound_status: BusTripStatus;
    outbound_departure_time: string;
    outbound_arrival_time: string;
    return_status?: BusTripStatus;
    return_departure_time?: string;
    checked_in_outbound?: boolean;
    checked_in_return?: boolean;
    seat_number?: string | number;
    practical_instructions?: string;
  };
  carpool?: {
    driver_uid: string;
    driver_name: string;
    meeting_place?: string;
    meeting_time?: string;
    pickup_place?: string;
    status?: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
  };
  is_independent?: boolean;
  waitlisted_bus_id?: string;
}
