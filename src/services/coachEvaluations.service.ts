import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type {
  CoachPlayerEvaluation,
  CreateCoachEvaluationInput,
} from '../models/CoachEvaluation';

const COL = 'coach_evaluations';

function toDate(v: unknown): Date {
  if (v instanceof Date) return v;
  if (v && typeof v === 'object' && 'toDate' in v) {
    return (v as { toDate: () => Date }).toDate();
  }
  return new Date(0);
}

function mapEval(id: string, data: Record<string, unknown>): CoachPlayerEvaluation {
  const ratings = (data.ratings as CoachPlayerEvaluation['ratings']) ?? { overall: 3 };
  return {
    id,
    club_id: String(data.club_id ?? ''),
    team_id: data.team_id ? String(data.team_id) : undefined,
    player_uid: String(data.player_uid ?? ''),
    player_name: String(data.player_name ?? ''),
    coach_uid: String(data.coach_uid ?? ''),
    coach_name: String(data.coach_name ?? ''),
    event_id: data.event_id ? String(data.event_id) : undefined,
    context: (data.context as CoachPlayerEvaluation['context']) ?? 'season',
    ratings: {
      technical: ratings.technical,
      tactical: ratings.tactical,
      physical: ratings.physical,
      mental: ratings.mental,
      overall: typeof ratings.overall === 'number' ? ratings.overall : 3,
    },
    notes: data.notes ? String(data.notes) : undefined,
    visible_to_player: data.visible_to_player === true,
    visible_to_parent: data.visible_to_parent === true,
    created_at: toDate(data.created_at),
    updated_at: toDate(data.updated_at),
  };
}

export const coachEvaluationsService = {
  async listForClub(clubId: string, max = 40): Promise<CoachPlayerEvaluation[]> {
    if (!isFirebaseConfigured() || !clubId) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const snap = await getDocs(
        query(
          collection(database, COL),
          where('club_id', '==', clubId),
          orderBy('created_at', 'desc'),
          limit(max),
        ),
      );
      return snap.docs.map((d) => mapEval(d.id, d.data() as Record<string, unknown>));
    } catch {
      const snap = await getDocs(
        query(collection(database, COL), where('club_id', '==', clubId), limit(max)),
      );
      return snap.docs
        .map((d) => mapEval(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    }
  },

  async listForPlayer(playerUid: string, max = 20): Promise<CoachPlayerEvaluation[]> {
    if (!isFirebaseConfigured() || !playerUid) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const snap = await getDocs(
        query(
          collection(database, COL),
          where('player_uid', '==', playerUid),
          orderBy('created_at', 'desc'),
          limit(max),
        ),
      );
      return snap.docs.map((d) => mapEval(d.id, d.data() as Record<string, unknown>));
    } catch {
      return [];
    }
  },

  async create(
    coachUid: string,
    coachName: string,
    input: CreateCoachEvaluationInput,
  ): Promise<string> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const overall = Math.min(5, Math.max(1, Math.round(input.ratings.overall)));
    const ref = await addDoc(collection(database, COL), {
      club_id: input.club_id,
      team_id: input.team_id ?? null,
      player_uid: input.player_uid,
      player_name: input.player_name,
      coach_uid: coachUid,
      coach_name: coachName,
      event_id: input.event_id ?? null,
      context: input.context,
      ratings: {
        technical: input.ratings.technical ?? null,
        tactical: input.ratings.tactical ?? null,
        physical: input.ratings.physical ?? null,
        mental: input.ratings.mental ?? null,
        overall,
      },
      notes: input.notes?.trim() || null,
      visible_to_player: input.visible_to_player === true,
      visible_to_parent: input.visible_to_parent === true,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    return ref.id;
  },

  async updateProgressNotes(id: string, notes: string): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await updateDoc(doc(database, COL, id), {
      notes: notes.trim() || null,
      updated_at: serverTimestamp(),
    });
  },
};
