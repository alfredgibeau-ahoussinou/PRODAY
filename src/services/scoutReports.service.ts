import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
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
import type { ScoutReport } from '../models/ScoutReport';
import { scoutReportFromFirestore } from '../lib/firestoreMappers';
import {
  buildScoutReportDraft,
  type ScoutReportDraftInput,
} from '../core/recruitment/scoutReport.engine';

function reportsCol(clubId: string) {
  return collection(getDb()!, 'club_scout_reports', clubId, 'reports');
}

function toFirestorePayload(draft: Omit<ScoutReport, 'id'>) {
  return {
    player_uid: draft.player_uid,
    author_uid: draft.author_uid,
    club_id: draft.club_id ?? null,
    match_event_id: draft.match_event_id ?? null,
    application_id: draft.application_id ?? null,
    pipeline_stage: draft.pipeline_stage ?? null,
    title: draft.title,
    observed_at: draft.observed_at,
    attributes: draft.attributes,
    overall_rating: draft.overall_rating,
    recommendation: draft.recommendation,
    summary: draft.summary,
    strengths: draft.strengths,
    weaknesses: draft.weaknesses,
    media_urls: draft.media_urls ?? [],
    visibility: draft.visibility,
    opportunity_score_snapshot: draft.opportunity_score_snapshot ?? null,
    tags: draft.tags ?? [],
    updated_at: serverTimestamp(),
  };
}

export const scoutReportsService = {
  async create(input: ScoutReportDraftInput & { clubId: string }): Promise<string> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const draft = buildScoutReportDraft({
      ...input,
      clubId: input.clubId,
    });
    const ref = await addDoc(reportsCol(input.clubId), {
      ...toFirestorePayload({ ...draft, club_id: input.clubId }),
      created_at: serverTimestamp(),
    });
    return ref.id;
  },

  async get(clubId: string, reportId: string): Promise<ScoutReport | null> {
    if (!isFirebaseConfigured() || !clubId) return null;
    const database = getDb();
    if (!database) return null;
    const snap = await getDoc(doc(database, 'club_scout_reports', clubId, 'reports', reportId));
    if (!snap.exists()) return null;
    return scoutReportFromFirestore(snap.id, snap.data() as Record<string, unknown>);
  },

  async listForPlayer(clubId: string, playerUid: string, max = 20): Promise<ScoutReport[]> {
    if (!isFirebaseConfigured() || !clubId) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const snap = await getDocs(
        query(
          reportsCol(clubId),
          where('player_uid', '==', playerUid),
          orderBy('updated_at', 'desc'),
          limit(max)
        )
      );
      return snap.docs.map((s) =>
        scoutReportFromFirestore(s.id, s.data() as Record<string, unknown>)
      );
    } catch {
      return [];
    }
  },

  async listByClub(clubId: string, max = 30): Promise<ScoutReport[]> {
    if (!isFirebaseConfigured() || !clubId) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const snap = await getDocs(
        query(reportsCol(clubId), orderBy('updated_at', 'desc'), limit(max))
      );
      return snap.docs.map((s) =>
        scoutReportFromFirestore(s.id, s.data() as Record<string, unknown>)
      );
    } catch {
      return [];
    }
  },

  async updateSummary(
    clubId: string,
    reportId: string,
    authorUid: string,
    patch: { summary?: string; title?: string }
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await updateDoc(doc(database, 'club_scout_reports', clubId, 'reports', reportId), {
      ...patch,
      author_uid: authorUid,
      updated_at: serverTimestamp(),
    });
  },

  async remove(clubId: string, reportId: string): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await deleteDoc(doc(database, 'club_scout_reports', clubId, 'reports', reportId));
  },
};
