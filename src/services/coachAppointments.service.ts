import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type {
  CoachAppointment,
  CoachAvailabilitySlot,
  RequestAppointmentInput,
  AppointmentStatus,
} from '../models/CoachAppointment';
import { staffNotificationsService } from './staffNotifications.service';

const COL_APPOINTMENTS = 'coach_appointments';
const COL_SLOTS = 'coach_availability_slots';

function toDate(v: unknown): Date {
  if (v instanceof Timestamp) return v.toDate();
  if (v instanceof Date) return v;
  return new Date();
}

function mapSlot(id: string, data: Record<string, unknown>): CoachAvailabilitySlot {
  return {
    id,
    coach_uid: String(data.coach_uid ?? ''),
    coach_name: String(data.coach_name ?? ''),
    club_id: data.club_id ? String(data.club_id) : undefined,
    starts_at: toDate(data.starts_at),
    ends_at: toDate(data.ends_at),
    is_booked: Boolean(data.is_booked),
    booked_by_player_uid: data.booked_by_player_uid ? String(data.booked_by_player_uid) : undefined,
    location: data.location ? String(data.location) : undefined,
  };
}

function mapAppointment(id: string, data: Record<string, unknown>): CoachAppointment {
  return {
    id,
    coach_uid: String(data.coach_uid ?? ''),
    coach_name: String(data.coach_name ?? ''),
    player_uid: String(data.player_uid ?? ''),
    player_name: String(data.player_name ?? ''),
    club_id: data.club_id ? String(data.club_id) : undefined,
    starts_at: toDate(data.starts_at),
    ends_at: toDate(data.ends_at),
    duration_minutes: Number(data.duration_minutes ?? 30),
    location: data.location ? String(data.location) : undefined,
    purpose: String(data.purpose ?? ''),
    status: (data.status as AppointmentStatus) ?? 'requested',
    is_minor: Boolean(data.is_minor),
    guardian_notified: Boolean(data.guardian_notified),
    guardian_name: data.guardian_name ? String(data.guardian_name) : undefined,
    coach_notes: data.coach_notes ? String(data.coach_notes) : undefined,
    cancellation_reason: data.cancellation_reason ? String(data.cancellation_reason) : undefined,
    created_at: toDate(data.created_at),
    updated_at: toDate(data.updated_at),
  };
}

export const coachAppointmentsService = {
  /**
   * Le coach publie un créneau de disponibilité.
   */
  async publishSlot(input: {
    coach_uid: string;
    coach_name: string;
    club_id?: string;
    starts_at: Date;
    ends_at: Date;
    location?: string;
  }): Promise<CoachAvailabilitySlot> {
    const database = getDb();
    const payload: Record<string, unknown> = {
      coach_uid: input.coach_uid,
      coach_name: input.coach_name,
      club_id: input.club_id ?? null,
      starts_at: Timestamp.fromDate(input.starts_at),
      ends_at: Timestamp.fromDate(input.ends_at),
      is_booked: false,
      booked_by_player_uid: null,
      location: input.location?.trim() ?? null,
      created_at: serverTimestamp(),
    };

    let id = `slot_${Date.now()}`;
    if (database && isFirebaseConfigured()) {
      const ref = await addDoc(collection(database, COL_SLOTS), payload);
      id = ref.id;
    }

    return {
      id,
      coach_uid: input.coach_uid,
      coach_name: input.coach_name,
      club_id: input.club_id,
      starts_at: input.starts_at,
      ends_at: input.ends_at,
      is_booked: false,
      location: input.location?.trim(),
    };
  },

  /**
   * Liste les créneaux disponibles d'un coach.
   */
  async listAvailableSlots(coachUid: string): Promise<CoachAvailabilitySlot[]> {
    const database = getDb();
    if (!database || !isFirebaseConfigured() || !coachUid) return [];
    try {
      const q = query(
        collection(database, COL_SLOTS),
        where('coach_uid', '==', coachUid),
        where('is_booked', '==', false),
        limit(30),
      );
      const snap = await getDocs(q);
      const now = Date.now();
      return snap.docs
        .map((d) => mapSlot(d.id, d.data() as Record<string, unknown>))
        .filter((s) => s.starts_at.getTime() >= now)
        .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
    } catch {
      return [];
    }
  },

  /**
   * Réservation / demande de rendez-vous avec vérification anti-double booking sur le serveur.
   */
  async requestAppointment(
    input: RequestAppointmentInput,
    slotId?: string,
  ): Promise<CoachAppointment> {
    const database = getDb();
    const now = new Date();
    const endsAt = new Date(input.starts_at.getTime() + input.duration_minutes * 60 * 1000);

    // Contrôle anti-double booking sur le serveur
    if (database && isFirebaseConfigured()) {
      const startTimestamp = Timestamp.fromDate(input.starts_at);
      const collisionQuery = query(
        collection(database, COL_APPOINTMENTS),
        where('coach_uid', '==', input.coach_uid),
        where('starts_at', '==', startTimestamp),
        limit(5),
      );
      const collisionSnap = await getDocs(collisionQuery);
      const hasActiveCollision = collisionSnap.docs.some((d) => {
        const status = d.data().status;
        return status === 'requested' || status === 'confirmed';
      });

      if (hasActiveCollision) {
        throw new Error('Ce créneau est déjà réservé pour ce coach. Veuillez choisir un autre horaire.');
      }
    }

    // Si lié à un créneau publié, marquer le créneau comme réservé
    if (slotId && database && isFirebaseConfigured()) {
      try {
        await updateDoc(doc(database, COL_SLOTS, slotId), {
          is_booked: true,
          booked_by_player_uid: input.player_uid,
          updated_at: serverTimestamp(),
        });
      } catch {
        // Optionnel
      }
    }

    const payload: Record<string, unknown> = {
      coach_uid: input.coach_uid,
      coach_name: input.coach_name,
      player_uid: input.player_uid,
      player_name: input.player_name,
      club_id: input.club_id ?? null,
      starts_at: Timestamp.fromDate(input.starts_at),
      ends_at: Timestamp.fromDate(endsAt),
      duration_minutes: input.duration_minutes,
      location: input.location?.trim() ?? null,
      purpose: input.purpose.trim(),
      status: 'requested',
      is_minor: Boolean(input.is_minor),
      guardian_notified: Boolean(input.is_minor),
      guardian_name: input.guardian_name?.trim() ?? null,
      coach_notes: null,
      cancellation_reason: null,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    let id = `apt_${Date.now()}`;
    if (database && isFirebaseConfigured()) {
      const ref = await addDoc(collection(database, COL_APPOINTMENTS), payload);
      id = ref.id;
    }

    // Notification au coach
    try {
      await staffNotificationsService.notifyRecipients({
        recipient_uids: [input.coach_uid],
        type: 'generic',
        title: `Demande de rendez-vous : ${input.player_name}`,
        body: `${input.purpose.slice(0, 80)} — ${input.starts_at.toLocaleDateString('fr-FR')} à ${input.starts_at.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
        club_id: input.club_id,
        player_uid: input.player_uid,
      });
    } catch {
      // Best-effort
    }

    return {
      id,
      coach_uid: input.coach_uid,
      coach_name: input.coach_name,
      player_uid: input.player_uid,
      player_name: input.player_name,
      club_id: input.club_id,
      starts_at: input.starts_at,
      ends_at: endsAt,
      duration_minutes: input.duration_minutes,
      location: input.location?.trim(),
      purpose: input.purpose.trim(),
      status: 'requested',
      is_minor: Boolean(input.is_minor),
      guardian_notified: Boolean(input.is_minor),
      guardian_name: input.guardian_name?.trim(),
      created_at: now,
      updated_at: now,
    };
  },

  /**
   * Liste les rendez-vous d'un joueur.
   */
  async listForPlayer(playerUid: string): Promise<CoachAppointment[]> {
    const database = getDb();
    if (!database || !isFirebaseConfigured() || !playerUid) return [];
    try {
      const q = query(
        collection(database, COL_APPOINTMENTS),
        where('player_uid', '==', playerUid),
        orderBy('starts_at', 'desc'),
        limit(30),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => mapAppointment(d.id, d.data() as Record<string, unknown>));
    } catch {
      const snap = await getDocs(
        query(collection(database, COL_APPOINTMENTS), where('player_uid', '==', playerUid), limit(30)),
      );
      return snap.docs
        .map((d) => mapAppointment(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.starts_at.getTime() - a.starts_at.getTime());
    }
  },

  /**
   * Liste les rendez-vous pour un coach.
   */
  async listForCoach(coachUid: string): Promise<CoachAppointment[]> {
    const database = getDb();
    if (!database || !isFirebaseConfigured() || !coachUid) return [];
    try {
      const q = query(
        collection(database, COL_APPOINTMENTS),
        where('coach_uid', '==', coachUid),
        orderBy('starts_at', 'desc'),
        limit(30),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => mapAppointment(d.id, d.data() as Record<string, unknown>));
    } catch {
      const snap = await getDocs(
        query(collection(database, COL_APPOINTMENTS), where('coach_uid', '==', coachUid), limit(30)),
      );
      return snap.docs
        .map((d) => mapAppointment(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.starts_at.getTime() - a.starts_at.getTime());
    }
  },

  /**
   * Confirmation du rendez-vous par le coach.
   */
  async confirmAppointment(appointmentId: string): Promise<void> {
    const database = getDb();
    if (!database || !isFirebaseConfigured()) return;
    await updateDoc(doc(database, COL_APPOINTMENTS, appointmentId), {
      status: 'confirmed',
      updated_at: serverTimestamp(),
    });
  },

  /**
   * Annulation d'un rendez-vous.
   */
  async cancelAppointment(
    appointmentId: string,
    actorOrReason?: string,
    maybeReason?: string,
  ): Promise<void> {
    const reason = (maybeReason || actorOrReason || 'Annulé').trim();
    const database = getDb();
    if (!database || !isFirebaseConfigured()) return;
    await updateDoc(doc(database, COL_APPOINTMENTS, appointmentId), {
      status: 'cancelled',
      cancellation_reason: reason,
      updated_at: serverTimestamp(),
    });
  },

  /**
   * Replanification d'un créneau.
   */
  async rescheduleAppointment(
    appointmentId: string,
    newStartsAt: Date,
    durationMinutes: number,
  ): Promise<void> {
    const database = getDb();
    if (!database || !isFirebaseConfigured()) return;
    const endsAt = new Date(newStartsAt.getTime() + durationMinutes * 60 * 1000);
    await updateDoc(doc(database, COL_APPOINTMENTS, appointmentId), {
      starts_at: Timestamp.fromDate(newStartsAt),
      ends_at: Timestamp.fromDate(endsAt),
      duration_minutes: durationMinutes,
      status: 'rescheduled',
      updated_at: serverTimestamp(),
    });
  },
};
