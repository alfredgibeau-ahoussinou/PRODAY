import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import { medicalAppointmentFromFirestore } from '../lib/firestoreMappers';
import type { User } from '../models/User';
import type {
  MedicalAppointment,
  MedicalAppointmentStatus,
  ConsultationType,
  WeeklyAvailabilityBlock,
} from '../models/MedicalAppointment';
import {
  DEFAULT_CONSULTATION_DURATION_MIN,
  DEFAULT_PHYSIO_WEEKLY_AVAILABILITY,
  endOfDay,
  generateDaySlots,
  startOfDay,
} from '../utils/medicalSlots';
import { checkFeatureAccess, emptyUsagePeriod } from '../utils/subscriptionLogic';

const COLLECTION = 'medical_appointments';

export function getPhysioWeeklyAvailability(profile: User): WeeklyAvailabilityBlock[] {
  const custom = profile.profile.weekly_availability;
  if (custom?.length) return custom;
  return DEFAULT_PHYSIO_WEEKLY_AVAILABILITY;
}

export function getPhysioConsultationDuration(profile: User): number {
  return profile.profile.consultation_duration_min ?? DEFAULT_CONSULTATION_DURATION_MIN;
}

export function isPhysioBookingEnabled(profile: User): boolean {
  return profile.profile.booking_enabled !== false;
}

export const medicalAppointmentsService = {
  async listForPhysio(
    physioUid: string,
    from: Date,
    to: Date
  ): Promise<MedicalAppointment[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    try {
      const q = query(
        collection(database, COLLECTION),
        where('physio_uid', '==', physioUid),
        where('start_at', '>=', from),
        where('start_at', '<=', to),
        orderBy('start_at', 'asc')
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) =>
        medicalAppointmentFromFirestore(d.id, d.data() as Record<string, unknown>)
      );
    } catch (error) {
      console.warn('[medicalAppointmentsService] listForPhysio:', error);
      return [];
    }
  },

  async listForPatient(patientUid: string): Promise<MedicalAppointment[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    try {
      const q = query(
        collection(database, COLLECTION),
        where('patient_uid', '==', patientUid),
        orderBy('start_at', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) =>
        medicalAppointmentFromFirestore(d.id, d.data() as Record<string, unknown>)
      );
    } catch (error) {
      console.warn('[medicalAppointmentsService] listForPatient:', error);
      return [];
    }
  },

  async getAvailableSlots(
    physio: User,
    day: Date,
    existing?: MedicalAppointment[]
  ): Promise<Date[]> {
    const booked =
      existing ??
      (await this.listForPhysio(physio.uid, startOfDay(day), endOfDay(day)));
    if (!isPhysioBookingEnabled(physio)) return [];
    return generateDaySlots(
      day,
      getPhysioWeeklyAvailability(physio),
      booked,
      getPhysioConsultationDuration(physio)
    );
  },

  async countVisioForPhysio(physioUid: string): Promise<number> {
    if (!isFirebaseConfigured()) return 0;
    const database = getDb();
    if (!database) return 0;
    try {
      const q = query(
        collection(database, COLLECTION),
        where('physio_uid', '==', physioUid),
        where('consultation_type', '==', 'visio'),
      );
      const snap = await getDocs(q);
      return snap.size;
    } catch (error) {
      console.warn('[medicalAppointmentsService] countVisioForPhysio:', error);
      return 0;
    }
  },

  async bookAppointment(input: {
    physio: User;
    patient: User;
    startAt: Date;
    motif?: string;
    consultationType?: ConsultationType;
  }): Promise<string> {
    if (!isFirebaseConfigured()) throw new Error('Firebase non configuré');

    const duration = getPhysioConsultationDuration(input.physio);
    const endAt = new Date(input.startAt.getTime() + duration * 60_000);
    const consultationType = input.consultationType ?? 'visio';

    if (consultationType === 'visio' && input.physio.role === 'physio') {
      const used = await this.countVisioForPhysio(input.physio.uid);
      const access = checkFeatureAccess({
        role: 'physio',
        tier: input.physio.subscription_tier === 'pro' ? 'pro' : 'free',
        planId: input.physio.subscription_plan_id as
          | import('../content/subscriptionPlans').SubscriptionPlanId
          | undefined,
        feature: 'sante_visio',
        usage: emptyUsagePeriod(),
        freeVisioUsed: used,
      });
      if (!access.allowed) {
        throw new Error(
          access.message ??
            'Essai visio gratuit terminé. Passez à l’abonnement Pôle santé Pro.',
        );
      }
    }

    const payload = {
      physio_uid: input.physio.uid,
      physio_name: input.physio.display_name,
      patient_uid: input.patient.uid,
      patient_name: input.patient.display_name,
      specialty: input.physio.profile.medical_specialty ?? input.physio.profile.job_title,
      start_at: input.startAt,
      end_at: endAt,
      duration_min: duration,
      status: 'pending' as MedicalAppointmentStatus,
      consultation_type: consultationType,
      motif: input.motif?.trim() || null,
      location_label:
        consultationType === 'visio'
          ? 'Téléconsultation'
          : input.physio.city ?? 'Cabinet',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const ref = await addDoc(collection(database, COLLECTION), payload);
    return ref.id;
  },

  async updateStatus(
    appointmentId: string,
    status: MedicalAppointmentStatus,
    options?: {
      notes?: string;
      physio?: User;
      appointment?: Pick<MedicalAppointment, 'start_at' | 'consultation_type' | 'meeting_link'>;
    }
  ): Promise<void> {
    if (!isFirebaseConfigured()) throw new Error('Firebase non configuré');
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const patch: Record<string, unknown> = {
      status,
      notes: options?.notes ?? null,
      updated_at: serverTimestamp(),
    };

    await updateDoc(doc(database, COLLECTION, appointmentId), patch);
  },
};
