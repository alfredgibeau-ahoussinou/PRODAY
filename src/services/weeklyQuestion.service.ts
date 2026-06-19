import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type { UserRole } from '../models/User';
import type {
  CreateWeeklyQuestionInput,
  SubmitWeeklyResponseInput,
  WeeklyQuestion,
  WeeklyQuestionResponse,
} from '../models/WeeklyQuestion';
import { getIsoWeekKey } from '../utils/weekKey';
import { validateWeeklyResponseBody } from '../utils/weeklyQuestionValidation';

const COL = 'weekly_questions';

function toDate(v: unknown): Date {
  if (v && typeof v === 'object' && 'toDate' in v) {
    return (v as { toDate: () => Date }).toDate();
  }
  return new Date();
}

export function mapWeeklyQuestion(id: string, data: Record<string, unknown>): WeeklyQuestion {
  return {
    id,
    week_key: String(data.week_key ?? id),
    question: String(data.question ?? ''),
    active: data.active !== false,
    author_uid: String(data.author_uid ?? ''),
    author_name: String(data.author_name ?? 'ProDay'),
    created_at: toDate(data.created_at),
  };
}

export function mapWeeklyResponse(id: string, data: Record<string, unknown>): WeeklyQuestionResponse {
  return {
    id,
    author_uid: String(data.author_uid ?? id),
    display_name: String(data.display_name ?? ''),
    author_role: data.author_role ? (String(data.author_role) as UserRole) : undefined,
    body: String(data.body ?? ''),
    created_at: toDate(data.created_at),
  };
}

export { validateWeeklyResponseBody } from '../utils/weeklyQuestionValidation';

export const weeklyQuestionService = {
  getCurrentWeekKey: getIsoWeekKey,

  async getQuestionForWeek(weekKey = getIsoWeekKey()): Promise<WeeklyQuestion | null> {
    if (!isFirebaseConfigured()) return null;
    const database = getDb();
    if (!database) return null;

    const snap = await getDoc(doc(database, COL, weekKey));
    if (!snap.exists()) return null;
    const question = mapWeeklyQuestion(snap.id, snap.data() as Record<string, unknown>);
    return question.active ? question : null;
  },

  /** Question active de la semaine, ou dernière question admin encore ouverte. */
  async getActiveQuestion(): Promise<WeeklyQuestion | null> {
    const weekKey = getIsoWeekKey();
    const current = await this.getQuestionForWeek(weekKey);
    if (current) return current;

    const recent = await this.listRecentQuestions(12);
    const active = recent.filter((q) => q.active);
    if (active.length === 0) return null;
    return active.find((q) => q.week_key === weekKey) ?? active[0];
  },

  async listResponses(questionId: string, max = 80): Promise<WeeklyQuestionResponse[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    try {
      const q = query(
        collection(database, COL, questionId, 'responses'),
        orderBy('created_at', 'desc'),
        limit(max)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => mapWeeklyResponse(d.id, d.data() as Record<string, unknown>));
    } catch {
      const snap = await getDocs(collection(database, COL, questionId, 'responses'));
      return snap.docs
        .map((d) => mapWeeklyResponse(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
        .slice(0, max);
    }
  },

  async getMyResponse(questionId: string, uid: string): Promise<WeeklyQuestionResponse | null> {
    if (!isFirebaseConfigured()) return null;
    const database = getDb();
    if (!database) return null;

    const snap = await getDoc(doc(database, COL, questionId, 'responses', uid));
    if (!snap.exists()) return null;
    return mapWeeklyResponse(snap.id, snap.data() as Record<string, unknown>);
  },

  async submitResponse(input: SubmitWeeklyResponseInput): Promise<void> {
    const err = validateWeeklyResponseBody(input.body);
    if (err) throw new Error(err);

    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    await setDoc(doc(database, COL, input.question_id, 'responses', input.author_uid), {
      author_uid: input.author_uid,
      display_name: input.display_name.trim(),
      author_role: input.author_role,
      body: input.body.trim(),
      created_at: serverTimestamp(),
    });
  },

  async createQuestion(input: CreateWeeklyQuestionInput): Promise<string> {
    const question = input.question.trim();
    if (!question) throw new Error('La question est requise.');

    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const weekKey = input.week_key.trim() || getIsoWeekKey();
    await setDoc(doc(database, COL, weekKey), {
      week_key: weekKey,
      question,
      active: true,
      author_uid: input.author_uid,
      author_name: input.author_name.trim() || 'ProDay Admin',
      created_at: serverTimestamp(),
    });
    return weekKey;
  },

  async listRecentQuestions(max = 12): Promise<WeeklyQuestion[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    try {
      const q = query(collection(database, COL), orderBy('created_at', 'desc'), limit(max));
      const snap = await getDocs(q);
      return snap.docs.map((d) => mapWeeklyQuestion(d.id, d.data() as Record<string, unknown>));
    } catch {
      const snap = await getDocs(collection(database, COL));
      return snap.docs
        .map((d) => mapWeeklyQuestion(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
        .slice(0, max);
    }
  },

  async setQuestionActive(questionId: string, active: boolean): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await updateDoc(doc(database, COL, questionId), { active });
  },
};
