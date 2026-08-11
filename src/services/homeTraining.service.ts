import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import {
  DEFAULT_COACHING_COMMISSION,
  splitCoachingPayment,
  type CoachHourlyProfile,
  type CoachSessionBooking,
  type CoachSessionDurationMin,
  type CoachSessionReport,
  type CoachingCommissionConfig,
} from '../models/HomeTraining';
import { filterHomeExercises, HOME_EXERCISE_LIBRARY } from '../content/homeExercises';
import type { HomeExercise, HomeExerciseMode } from '../models/HomeTraining';
import { staffNotificationsService } from './staffNotifications.service';
import { scheduleProdayLocalNotification } from './prodayLocalNotifications.service';

function toDate(v: unknown): Date {
  if (v instanceof Timestamp) return v.toDate();
  if (v instanceof Date) return v;
  return new Date();
}

export const homeTrainingService = {
  listExercises(opts?: {
    age?: number;
    position?: string;
    mode?: HomeExerciseMode;
    focus?: HomeExercise['focus'][number];
    query?: string;
  }): HomeExercise[] {
    if (!opts) return [...HOME_EXERCISE_LIBRARY];
    return filterHomeExercises(opts);
  },

  getExercise(id: string): HomeExercise | undefined {
    return HOME_EXERCISE_LIBRARY.find((e) => e.id === id);
  },
};

export const coachingCommissionService = {
  async getConfig(): Promise<CoachingCommissionConfig> {
    if (!isFirebaseConfigured()) return DEFAULT_COACHING_COMMISSION;
    const database = getDb();
    if (!database) return DEFAULT_COACHING_COMMISSION;
    try {
      const snap = await getDoc(doc(database, 'platform_config', 'main'));
      if (!snap.exists()) return DEFAULT_COACHING_COMMISSION;
      const raw = snap.data().coaching_commission as Partial<CoachingCommissionConfig> | undefined;
      if (!raw) return DEFAULT_COACHING_COMMISSION;
      return {
        proday_percent: Number(raw.proday_percent ?? DEFAULT_COACHING_COMMISSION.proday_percent),
        club_percent: Number(raw.club_percent ?? DEFAULT_COACHING_COMMISSION.club_percent),
        hourly_rate_min_eur: Number(
          raw.hourly_rate_min_eur ?? DEFAULT_COACHING_COMMISSION.hourly_rate_min_eur,
        ),
        hourly_rate_max_eur: Number(
          raw.hourly_rate_max_eur ?? DEFAULT_COACHING_COMMISSION.hourly_rate_max_eur,
        ),
      };
    } catch {
      return DEFAULT_COACHING_COMMISSION;
    }
  },
};

function bookingFromDoc(id: string, data: Record<string, unknown>): CoachSessionBooking {
  const split = (data.split as CoachSessionBooking['split']) ?? {
    coach_eur: 0,
    proday_eur: 0,
    club_eur: 0,
  };
  const reportRaw = data.report as Record<string, unknown> | undefined;
  return {
    id,
    coach_uid: String(data.coach_uid ?? ''),
    coach_name: String(data.coach_name ?? ''),
    player_uid: String(data.player_uid ?? ''),
    player_name: String(data.player_name ?? ''),
    club_id: data.club_id ? String(data.club_id) : undefined,
    starts_at: toDate(data.starts_at),
    duration_min: Number(data.duration_min ?? 60) as CoachSessionDurationMin,
    price_eur: Number(data.price_eur ?? 0),
    split,
    status: (data.status as CoachSessionBooking['status']) ?? 'requested',
    location_label: data.location_label ? String(data.location_label) : undefined,
    notes: data.notes ? String(data.notes) : undefined,
    report: reportRaw
      ? {
          exercises_done: String(reportRaw.exercises_done ?? ''),
          strengths: String(reportRaw.strengths ?? ''),
          improvements: String(reportRaw.improvements ?? ''),
          homework: String(reportRaw.homework ?? ''),
          homework_equipment: Array.isArray(reportRaw.homework_equipment)
            ? (reportRaw.homework_equipment as string[])
            : [],
          next_goals: String(reportRaw.next_goals ?? ''),
          created_at: toDate(reportRaw.created_at),
        }
      : undefined,
    created_at: toDate(data.created_at),
    updated_at: data.updated_at ? toDate(data.updated_at) : undefined,
  };
}

export const coachingSessionsService = {
  /** Profils coach « ouverts » à la réservation horaire (collection dédiée). */
  async listAvailableCoaches(max = 40): Promise<CoachHourlyProfile[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const q = query(
        collection(database, 'coach_hourly_profiles'),
        where('available', '==', true),
        limit(max),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          coach_uid: String(data.coach_uid ?? d.id),
          display_name: String(data.display_name ?? ''),
          photo_url: data.photo_url ? String(data.photo_url) : undefined,
          bio: data.bio ? String(data.bio) : undefined,
          specialties: Array.isArray(data.specialties) ? (data.specialties as string[]) : [],
          age_categories: Array.isArray(data.age_categories)
            ? (data.age_categories as string[])
            : [],
          positions_coached: Array.isArray(data.positions_coached)
            ? (data.positions_coached as string[])
            : [],
          city: String(data.city ?? ''),
          radius_km: data.radius_km != null ? Number(data.radius_km) : undefined,
          hourly_rate_eur: Number(data.hourly_rate_eur ?? 30),
          club_id: data.club_id ? String(data.club_id) : undefined,
          club_name: data.club_name ? String(data.club_name) : undefined,
          sessions_completed: Number(data.sessions_completed ?? 0),
          rating_avg: data.rating_avg != null ? Number(data.rating_avg) : undefined,
          available: Boolean(data.available),
        };
      });
    } catch {
      return [];
    }
  },

  async requestSession(input: {
    coach: CoachHourlyProfile;
    player_uid: string;
    player_name: string;
    starts_at: Date;
    duration_min: CoachSessionDurationMin;
    location_label?: string;
    notes?: string;
  }): Promise<string> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const config = await coachingCommissionService.getConfig();
    const hours = input.duration_min / 60;
    const price = Math.round(input.coach.hourly_rate_eur * hours * 100) / 100;
    const split = splitCoachingPayment(price, config, Boolean(input.coach.club_id));

    const ref = await addDoc(collection(database, 'coach_session_bookings'), {
      coach_uid: input.coach.coach_uid,
      coach_name: input.coach.display_name,
      player_uid: input.player_uid,
      player_name: input.player_name,
      club_id: input.coach.club_id ?? null,
      starts_at: Timestamp.fromDate(input.starts_at),
      duration_min: input.duration_min,
      price_eur: price,
      split,
      status: 'requested',
      location_label: input.location_label ?? null,
      notes: input.notes ?? '',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    const title = 'Demande de séance';
    const body = `${input.player_name} demande ${input.duration_min} min (~${price} €) le ${input.starts_at.toLocaleDateString('fr-FR')}.`;
    try {
      await staffNotificationsService.notifyRecipients({
        recipient_uids: [input.coach.coach_uid],
        type: 'generic',
        title,
        body,
        club_id: input.coach.club_id,
        player_uid: input.player_uid,
      });
    } catch {
      // best-effort
    }
    try {
      await scheduleProdayLocalNotification({
        identifier: `coach-session-${ref.id}`,
        title,
        body,
        data: { type: 'coach_session_request', bookingId: ref.id },
      });
    } catch {
      // best-effort
    }

    return ref.id;
  },

  async listForPlayer(playerUid: string): Promise<CoachSessionBooking[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const q = query(
        collection(database, 'coach_session_bookings'),
        where('player_uid', '==', playerUid),
        orderBy('starts_at', 'desc'),
        limit(40),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => bookingFromDoc(d.id, d.data() as Record<string, unknown>));
    } catch {
      const snap = await getDocs(collection(database, 'coach_session_bookings'));
      return snap.docs
        .map((d) => bookingFromDoc(d.id, d.data() as Record<string, unknown>))
        .filter((b) => b.player_uid === playerUid)
        .sort((a, b) => b.starts_at.getTime() - a.starts_at.getTime());
    }
  },

  async listForCoach(coachUid: string): Promise<CoachSessionBooking[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const q = query(
        collection(database, 'coach_session_bookings'),
        where('coach_uid', '==', coachUid),
        orderBy('starts_at', 'desc'),
        limit(40),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => bookingFromDoc(d.id, d.data() as Record<string, unknown>));
    } catch {
      return [];
    }
  },

  async setStatus(
    bookingId: string,
    status: CoachSessionBooking['status'],
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await updateDoc(doc(database, 'coach_session_bookings', bookingId), {
      status,
      updated_at: serverTimestamp(),
    });
  },

  /** Ouvre / met à jour le profil coach à l’heure (visible Train Hub joueur). */
  async upsertHourlyProfile(
    profile: Omit<CoachHourlyProfile, 'sessions_completed'> & {
      sessions_completed?: number;
    },
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const ref = doc(database, 'coach_hourly_profiles', profile.coach_uid);
    await setDoc(
      ref,
      {
        coach_uid: profile.coach_uid,
        display_name: profile.display_name,
        photo_url: profile.photo_url ?? null,
        bio: profile.bio ?? '',
        specialties: profile.specialties ?? [],
        age_categories: profile.age_categories ?? [],
        positions_coached: profile.positions_coached ?? [],
        city: profile.city,
        radius_km: profile.radius_km ?? null,
        hourly_rate_eur: profile.hourly_rate_eur,
        club_id: profile.club_id ?? null,
        club_name: profile.club_name ?? null,
        sessions_completed: profile.sessions_completed ?? 0,
        rating_avg: profile.rating_avg ?? null,
        available: profile.available,
        updated_at: serverTimestamp(),
      },
      { merge: true },
    );
  },

  async submitReport(bookingId: string, report: Omit<CoachSessionReport, 'created_at'>): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await updateDoc(doc(database, 'coach_session_bookings', bookingId), {
      status: 'completed',
      report: { ...report, created_at: serverTimestamp() },
      updated_at: serverTimestamp(),
    });
  },
};
