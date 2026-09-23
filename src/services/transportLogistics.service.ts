import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import type { TeamEvent } from '../models/TeamEvent';
import { teamEventsService } from './teamEvents.service';
import type {
  BusPassenger,
  BusTripStatus,
  ClubBusPlan,
  EventTransportPlan,
  PassengerTransportSummary,
  TransportMode,
} from '../models/TransportLogistics';

const COL = 'team_events';

export const transportLogisticsService = {
  /**
   * Extrait ou initialise de manière robuste le plan de transport d'un événement.
   * Rétrocompatible à 100% avec les covoiturages historiques.
   */
  resolveTransportPlan(event: TeamEvent): EventTransportPlan {
    if (event.transport_plan) {
      return {
        ...event.transport_plan,
        buses: event.transport_plan.buses ?? [],
        independent_traveler_uids: event.transport_plan.independent_traveler_uids ?? [],
        carpool_slots: event.carpool_slots ?? event.transport_plan.carpool_slots ?? [],
      };
    }

    const hasCarpool = (event.carpool_slots ?? []).length > 0;
    return {
      mode: hasCarpool ? 'carpool_only' : 'carpool_only',
      buses: [],
      independent_traveler_uids: [],
      carpool_slots: event.carpool_slots ?? [],
    };
  },

  /**
   * Définit le mode global de transport (carpool_only, bus_only, mixed, individual).
   */
  async setTransportMode(
    eventId: string,
    mode: TransportMode,
    notes?: string,
    editorUid?: string
  ): Promise<TeamEvent> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const event = await teamEventsService.getById(eventId);
    if (!event) throw new Error('Événement introuvable');

    const currentPlan = this.resolveTransportPlan(event);
    const updatedPlan: EventTransportPlan = {
      ...currentPlan,
      mode,
      notes: notes !== undefined ? notes : currentPlan.notes,
      updated_at: new Date().toISOString(),
      updated_by_uid: editorUid,
    };

    await updateDoc(doc(database, COL, eventId), {
      transport_plan: updatedPlan,
      updated_at: serverTimestamp(),
    });

    return {
      ...event,
      transport_plan: updatedPlan,
    };
  },

  /**
   * Ajoute ou met à jour la configuration d'un bus/minibus du club.
   */
  async upsertBusPlan(
    eventId: string,
    bus: ClubBusPlan,
    editorUid?: string
  ): Promise<TeamEvent> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const event = await teamEventsService.getById(eventId);
    if (!event) throw new Error('Événement introuvable');

    const currentPlan = this.resolveTransportPlan(event);
    const buses = [...currentPlan.buses];
    const existingIndex = buses.findIndex((b) => b.id === bus.id);

    if (existingIndex >= 0) {
      buses[existingIndex] = { ...bus };
    } else {
      buses.push({ ...bus });
    }

    const updatedPlan: EventTransportPlan = {
      ...currentPlan,
      buses,
      updated_at: new Date().toISOString(),
      updated_by_uid: editorUid,
    };

    await updateDoc(doc(database, COL, eventId), {
      transport_plan: updatedPlan,
      updated_at: serverTimestamp(),
    });

    return {
      ...event,
      transport_plan: updatedPlan,
    };
  },

  /**
   * Supprime un bus configuré pour cet événement.
   */
  async removeBusPlan(
    eventId: string,
    busId: string,
    editorUid?: string
  ): Promise<TeamEvent> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const event = await teamEventsService.getById(eventId);
    if (!event) throw new Error('Événement introuvable');

    const currentPlan = this.resolveTransportPlan(event);
    const buses = currentPlan.buses.filter((b) => b.id !== busId);

    const updatedPlan: EventTransportPlan = {
      ...currentPlan,
      buses,
      updated_at: new Date().toISOString(),
      updated_by_uid: editorUid,
    };

    await updateDoc(doc(database, COL, eventId), {
      transport_plan: updatedPlan,
      updated_at: serverTimestamp(),
    });

    return {
      ...event,
      transport_plan: updatedPlan,
    };
  },

  /**
   * Réserve une place dans un bus collectif.
   * Si la capacité est atteinte, place automatiquement la personne en liste d'attente.
   */
  async bookBusSeat(
    eventId: string,
    busId: string,
    passenger: BusPassenger
  ): Promise<{ success: boolean; waitlisted: boolean; reason?: string; event: TeamEvent }> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const event = await teamEventsService.getById(eventId);
    if (!event) throw new Error('Événement introuvable');

    const currentPlan = this.resolveTransportPlan(event);
    const bus = currentPlan.buses.find((b) => b.id === busId);
    if (!bus) throw new Error('Bus introuvable');

    // Vérification des permissions spécifiques pour parents/supporters
    if (passenger.role === 'parent' && !bus.allows_parents && !passenger.approved_by_staff) {
      throw new Error("Ce trajet en bus n'est pas ouvert aux parents sans accord explicite du staff.");
    }
    if (passenger.role === 'supporter' && !bus.allows_supporters && !passenger.approved_by_staff) {
      throw new Error("Ce trajet n'autorise pas les supporters sans validation du staff.");
    }

    const passengers = [...(bus.passengers ?? [])];
    const waitingList = [...(bus.waiting_list ?? [])];

    // Vérifier si déjà passager
    if (passengers.some((p) => p.uid === passenger.uid)) {
      throw new Error('Vous avez déjà une place réservée dans ce bus.');
    }
    if (waitingList.some((w) => w.uid === passenger.uid)) {
      throw new Error('Vous êtes déjà inscrit sur la liste d’attente.');
    }

    let waitlisted = false;
    if (passengers.length >= bus.capacity) {
      waitlisted = true;
      waitingList.push({
        uid: passenger.uid,
        name: passenger.name,
        role: passenger.role,
        requested_at: passenger.booked_at || new Date().toISOString(),
        pickup_stop_id: passenger.pickup_stop_id,
        notes: passenger.notes,
      });
    } else {
      passengers.push(passenger);
    }

    const updatedBuses = currentPlan.buses.map((b) =>
      b.id === busId ? { ...b, passengers, waiting_list: waitingList } : b
    );

    const updatedPlan: EventTransportPlan = {
      ...currentPlan,
      buses: updatedBuses,
      updated_at: new Date().toISOString(),
    };

    await updateDoc(doc(database, COL, eventId), {
      transport_plan: updatedPlan,
      updated_at: serverTimestamp(),
    });

    return {
      success: true,
      waitlisted,
      event: { ...event, transport_plan: updatedPlan },
    };
  },

  /**
   * Annulation d'une réservation ou d'une attente en bus.
   */
  async cancelBusSeat(
    eventId: string,
    busId: string,
    uid: string
  ): Promise<TeamEvent> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const event = await teamEventsService.getById(eventId);
    if (!event) throw new Error('Événement introuvable');

    const currentPlan = this.resolveTransportPlan(event);
    const bus = currentPlan.buses.find((b) => b.id === busId);
    if (!bus) throw new Error('Bus introuvable');

    const passengers = (bus.passengers ?? []).filter((p) => p.uid !== uid);
    const waitingList = (bus.waiting_list ?? []).filter((w) => w.uid !== uid);

    const updatedBuses = currentPlan.buses.map((b) =>
      b.id === busId ? { ...b, passengers, waiting_list: waitingList } : b
    );

    const updatedPlan: EventTransportPlan = {
      ...currentPlan,
      buses: updatedBuses,
      updated_at: new Date().toISOString(),
    };

    await updateDoc(doc(database, COL, eventId), {
      transport_plan: updatedPlan,
      updated_at: serverTimestamp(),
    });

    return {
      ...event,
      transport_plan: updatedPlan,
    };
  },

  /**
   * Promeut une personne de la liste d'attente vers les passagers confirmés.
   */
  async promoteFromWaitingList(
    eventId: string,
    busId: string,
    uid: string
  ): Promise<TeamEvent> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const event = await teamEventsService.getById(eventId);
    if (!event) throw new Error('Événement introuvable');

    const currentPlan = this.resolveTransportPlan(event);
    const bus = currentPlan.buses.find((b) => b.id === busId);
    if (!bus) throw new Error('Bus introuvable');

    const waitingItem = (bus.waiting_list ?? []).find((w) => w.uid === uid);
    if (!waitingItem) throw new Error("Entrée introuvable dans la liste d'attente.");

    const passengers = [...(bus.passengers ?? [])];
    if (passengers.length >= bus.capacity) {
      throw new Error('Capacité maximale du bus déjà atteinte.');
    }

    const waitingList = (bus.waiting_list ?? []).filter((w) => w.uid !== uid);
    passengers.push({
      uid: waitingItem.uid,
      name: waitingItem.name,
      role: waitingItem.role,
      pickup_stop_id: waitingItem.pickup_stop_id,
      notes: waitingItem.notes,
      booked_at: new Date().toISOString(),
      approved_by_staff: true,
    });

    const updatedBuses = currentPlan.buses.map((b) =>
      b.id === busId ? { ...b, passengers, waiting_list: waitingList } : b
    );

    const updatedPlan: EventTransportPlan = {
      ...currentPlan,
      buses: updatedBuses,
      updated_at: new Date().toISOString(),
    };

    await updateDoc(doc(database, COL, eventId), {
      transport_plan: updatedPlan,
      updated_at: serverTimestamp(),
    });

    return {
      ...event,
      transport_plan: updatedPlan,
    };
  },

  /**
   * Pointage à bord (embarquement aller ou retour) par le staff responsable.
   */
  async checkInPassenger(
    eventId: string,
    busId: string,
    uid: string,
    journey: 'outbound' | 'return',
    checkedIn: boolean
  ): Promise<TeamEvent> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const event = await teamEventsService.getById(eventId);
    if (!event) throw new Error('Événement introuvable');

    const currentPlan = this.resolveTransportPlan(event);
    const bus = currentPlan.buses.find((b) => b.id === busId);
    if (!bus) throw new Error('Bus introuvable');

    const passengers = (bus.passengers ?? []).map((p) => {
      if (p.uid !== uid) return p;
      return {
        ...p,
        checked_in_outbound: journey === 'outbound' ? checkedIn : p.checked_in_outbound,
        checked_in_return: journey === 'return' ? checkedIn : p.checked_in_return,
      };
    });

    const updatedBuses = currentPlan.buses.map((b) =>
      b.id === busId ? { ...b, passengers } : b
    );

    const updatedPlan: EventTransportPlan = {
      ...currentPlan,
      buses: updatedBuses,
      updated_at: new Date().toISOString(),
    };

    await updateDoc(doc(database, COL, eventId), {
      transport_plan: updatedPlan,
      updated_at: serverTimestamp(),
    });

    return {
      ...event,
      transport_plan: updatedPlan,
    };
  },

  /**
   * Met à jour le statut réel du trajet (Prévu, Embarquement, En route, Retard avec ETA révisée, Retour, Arrivé).
   * Aucune fausse géolocalisation promise : état vérifié et saisi par le staff.
   */
  async updateTripStatus(
    eventId: string,
    busId: string,
    journey: 'outbound' | 'return',
    status: BusTripStatus,
    note?: string,
    revisedArrivalTime?: string
  ): Promise<TeamEvent> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const event = await teamEventsService.getById(eventId);
    if (!event) throw new Error('Événement introuvable');

    const currentPlan = this.resolveTransportPlan(event);
    const bus = currentPlan.buses.find((b) => b.id === busId);
    if (!bus) throw new Error('Bus introuvable');

    const targetJourney = journey === 'outbound' ? bus.outbound : bus.return_journey;
    if (!targetJourney) throw new Error(`Trajet ${journey} non défini pour ce bus`);

    const updatedJourney = {
      ...targetJourney,
      status,
      status_updated_at: new Date().toISOString(),
      status_note: note !== undefined ? note : targetJourney.status_note,
      arrival_time_revised:
        revisedArrivalTime !== undefined
          ? revisedArrivalTime
          : targetJourney.arrival_time_revised,
    };

    const updatedBuses = currentPlan.buses.map((b) => {
      if (b.id !== busId) return b;
      return journey === 'outbound'
        ? { ...b, outbound: updatedJourney }
        : { ...b, return_journey: updatedJourney };
    });

    const updatedPlan: EventTransportPlan = {
      ...currentPlan,
      buses: updatedBuses,
      updated_at: new Date().toISOString(),
    };

    await updateDoc(doc(database, COL, eventId), {
      transport_plan: updatedPlan,
      updated_at: serverTimestamp(),
    });

    return {
      ...event,
      transport_plan: updatedPlan,
    };
  },

  /**
   * Enregistre un joueur comme voyageant par ses propres moyens (déplacement individuel / autonome).
   */
  async setIndependentTravel(
    eventId: string,
    uid: string,
    isIndependent: boolean
  ): Promise<TeamEvent> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const event = await teamEventsService.getById(eventId);
    if (!event) throw new Error('Événement introuvable');

    const currentPlan = this.resolveTransportPlan(event);
    const existing = new Set(currentPlan.independent_traveler_uids ?? []);

    if (isIndependent) {
      existing.add(uid);
    } else {
      existing.delete(uid);
    }

    const updatedPlan: EventTransportPlan = {
      ...currentPlan,
      independent_traveler_uids: Array.from(existing),
      updated_at: new Date().toISOString(),
    };

    await updateDoc(doc(database, COL, eventId), {
      transport_plan: updatedPlan,
      updated_at: serverTimestamp(),
    });

    return {
      ...event,
      transport_plan: updatedPlan,
    };
  },

  /**
   * Récapitule le transport attribué à un participant (bus, covoiturage, autonome ou rien).
   */
  getPassengerTransportSummary(
    event: TeamEvent,
    uid: string
  ): PassengerTransportSummary {
    const plan = this.resolveTransportPlan(event);

    // 1. Déplacement individuel
    if ((plan.independent_traveler_uids ?? []).includes(uid)) {
      return {
        uid,
        name: '',
        type: 'independent',
        is_independent: true,
      };
    }

    // 2. Bus club
    for (const bus of plan.buses ?? []) {
      const passenger = (bus.passengers ?? []).find((p) => p.uid === uid);
      if (passenger) {
        const pickupStop = bus.outbound.stops?.find((s) => s.id === passenger.pickup_stop_id);
        return {
          uid,
          name: passenger.name,
          type: 'bus',
          bus: {
            bus_id: bus.id,
            bus_name: bus.name,
            vehicle_type: bus.vehicle_type,
            staff_in_charge: {
              name: bus.staff_in_charge_name,
              phone: bus.staff_in_charge_phone,
            },
            pickup_stop: pickupStop,
            outbound_status: bus.outbound.status,
            outbound_departure_time: pickupStop?.scheduled_time || bus.outbound.departure_time,
            outbound_arrival_time:
              bus.outbound.arrival_time_revised || bus.outbound.arrival_time_scheduled,
            return_status: bus.return_journey?.status,
            return_departure_time: bus.return_journey?.departure_time,
            checked_in_outbound: passenger.checked_in_outbound,
            checked_in_return: passenger.checked_in_return,
            seat_number: passenger.seat_number,
            practical_instructions: bus.practical_instructions,
          },
        };
      }

      const waitlisted = (bus.waiting_list ?? []).find((w) => w.uid === uid);
      if (waitlisted) {
        return {
          uid,
          name: waitlisted.name,
          type: 'none',
          waitlisted_bus_id: bus.id,
        };
      }
    }

    // 3. Covoiturage personnel
    for (const slot of event.carpool_slots ?? []) {
      if (slot.driver_uid === uid) {
        return {
          uid,
          name: slot.driver_name,
          type: 'carpool',
          carpool: {
            driver_uid: slot.driver_uid,
            driver_name: slot.driver_name,
            meeting_place: slot.meeting_place,
            meeting_time: slot.meeting_time,
            status: 'confirmed',
          },
        };
      }
      const booking = (slot.passengers ?? []).find((p) => p.uid === uid);
      if (booking) {
        return {
          uid,
          name: booking.name,
          type: 'carpool',
          carpool: {
            driver_uid: slot.driver_uid,
            driver_name: slot.driver_name,
            meeting_place: slot.meeting_place,
            meeting_time: slot.meeting_time,
            pickup_place: booking.pickup_place,
            status: booking.status ?? 'confirmed',
          },
        };
      }
    }

    return {
      uid,
      name: '',
      type: 'none',
    };
  },

  /**
   * Vue dédiée aux parents garantissant la stricte confidentialité familiale.
   * Ne renvoie JAMAIS la liste intégrale des passagers ou les coordonnées privées d'autres familles.
   */
  getParentTransportView(
    event: TeamEvent,
    childUid: string
  ): {
    childUid: string;
    mode: TransportMode;
    summary: PassengerTransportSummary;
    availableBuses: {
      id: string;
      name: string;
      vehicle_type: string;
      capacity: number;
      available_seats: number;
      staff_name: string;
      outbound_time: string;
      return_time?: string;
      departure_place: string;
      arrival_place: string;
      allows_parents: boolean;
      practical_instructions?: string;
    }[];
  } {
    const plan = this.resolveTransportPlan(event);
    const summary = this.getPassengerTransportSummary(event, childUid);

    const availableBuses = (plan.buses ?? []).map((bus) => ({
      id: bus.id,
      name: bus.name,
      vehicle_type: bus.vehicle_type,
      capacity: bus.capacity,
      available_seats: Math.max(0, bus.capacity - (bus.passengers ?? []).length),
      staff_name: bus.staff_in_charge_name,
      outbound_time: bus.outbound.departure_time,
      return_time: bus.return_journey?.departure_time,
      departure_place: bus.outbound.departure_place,
      arrival_place: bus.outbound.arrival_place,
      allows_parents: Boolean(bus.allows_parents),
      practical_instructions: bus.practical_instructions,
    }));

    return {
      childUid,
      mode: plan.mode,
      summary,
      availableBuses,
    };
  },
};
