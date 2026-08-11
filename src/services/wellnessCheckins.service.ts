import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type { WellnessSignals } from '../models/SmartTactics';

const COL = 'wellness_checkins';

export type WellnessCheckin = WellnessSignals & {
  id: string;
  uid: string;
  club_id?: string;
  /** YYYY-MM-DD local */
  date_key: string;
  created_at: Date;
};

function toDate(v: unknown): Date {
  if (v instanceof Date) return v;
  if (v && typeof v === 'object' && 'toDate' in v) {
    return (v as { toDate: () => Date }).toDate();
  }
  return new Date(0);
}

function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function mapRow(id: string, data: Record<string, unknown>): WellnessCheckin {
  return {
    id,
    uid: String(data.uid ?? ''),
    club_id: data.club_id ? String(data.club_id) : undefined,
    date_key: String(data.date_key ?? ''),
    sleep_hours: typeof data.sleep_hours === 'number' ? data.sleep_hours : undefined,
    fatigue: typeof data.fatigue === 'number' ? data.fatigue : undefined,
    stress: typeof data.stress === 'number' ? data.stress : undefined,
    recovery: typeof data.recovery === 'number' ? data.recovery : undefined,
    wellness_score: typeof data.wellness_score === 'number' ? data.wellness_score : undefined,
    pain: typeof data.pain === 'number' ? data.pain : undefined,
    training_attendance_rate:
      typeof data.training_attendance_rate === 'number' ? data.training_attendance_rate : undefined,
    minutes_last_7d: typeof data.minutes_last_7d === 'number' ? data.minutes_last_7d : undefined,
    recovery_hours_since_last:
      typeof data.recovery_hours_since_last === 'number' ? data.recovery_hours_since_last : undefined,
    injury_recency_days:
      typeof data.injury_recency_days === 'number' ? data.injury_recency_days : null,
    suspended: Boolean(data.suspended),
    injured: Boolean(data.injured),
    created_at: toDate(data.created_at),
  };
}

export const wellnessCheckinsService = {
  todayKey,

  async submit(input: {
    uid: string;
    club_id?: string;
    signals: WellnessSignals;
    date_key?: string;
  }): Promise<WellnessCheckin | null> {
    const date_key = input.date_key ?? todayKey();
    const row: WellnessCheckin = {
      id: `local_${Date.now()}`,
      uid: input.uid,
      club_id: input.club_id,
      date_key,
      ...input.signals,
      created_at: new Date(),
    };
    if (!isFirebaseConfigured()) return row;
    const database = getDb();
    if (!database) return row;
    const ref = await addDoc(collection(database, COL), {
      uid: input.uid,
      club_id: input.club_id ?? null,
      date_key,
      ...input.signals,
      created_at: serverTimestamp(),
    });
    return { ...row, id: ref.id };
  },

  /** Latest check-in per uid for a club on a given day (default today). */
  async listLatestForClub(
    clubId: string,
    date_key = todayKey(),
    max = 80,
  ): Promise<Record<string, WellnessSignals>> {
    if (!isFirebaseConfigured() || !clubId) return {};
    const database = getDb();
    if (!database) return {};
    try {
      const snap = await getDocs(
        query(
          collection(database, COL),
          where('club_id', '==', clubId),
          where('date_key', '==', date_key),
          orderBy('created_at', 'desc'),
          limit(max),
        ),
      );
      const byUid: Record<string, WellnessSignals> = {};
      for (const d of snap.docs) {
        const row = mapRow(d.id, d.data() as Record<string, unknown>);
        if (!row.uid || byUid[row.uid]) continue;
        const {
          sleep_hours,
          fatigue,
          stress,
          recovery,
          wellness_score,
          pain,
          training_attendance_rate,
          minutes_last_7d,
          recovery_hours_since_last,
          injury_recency_days,
          suspended,
          injured,
        } = row;
        byUid[row.uid] = {
          sleep_hours,
          fatigue,
          stress,
          recovery,
          wellness_score,
          pain,
          training_attendance_rate,
          minutes_last_7d,
          recovery_hours_since_last,
          injury_recency_days,
          suspended,
          injured,
        };
      }
      return byUid;
    } catch {
      return {};
    }
  },
};
