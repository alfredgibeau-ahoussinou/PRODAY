import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import {
  buildEmptyMatchTalk,
  filterApprovedClips,
  type MatchTalkBrief,
  type MatchTalkClipSuggestion,
  type MatchTalkConsigne,
} from '../models/MatchTalkBrief';
import type { TacticalSharePayload } from '../models/TacticalShare';

const TALK_COL = 'match_talk_briefs';
const SHARE_COL = 'tactical_shares';

function toDate(v: unknown): Date {
  if (v instanceof Date) return v;
  if (v && typeof v === 'object' && 'toDate' in v) {
    return (v as { toDate: () => Date }).toDate();
  }
  return new Date(0);
}

function mapTalk(id: string, data: Record<string, unknown>): MatchTalkBrief {
  return {
    id,
    event_id: String(data.event_id ?? ''),
    club_id: data.club_id ? String(data.club_id) : undefined,
    title: String(data.title ?? 'Causerie match'),
    match_objective: data.match_objective ? String(data.match_objective) : undefined,
    key_points: Array.isArray(data.key_points) ? data.key_points.map(String) : [],
    formation: data.formation ? String(data.formation) : undefined,
    opponent_notes: data.opponent_notes ? String(data.opponent_notes) : undefined,
    tactical_phase_ids: Array.isArray(data.tactical_phase_ids)
      ? data.tactical_phase_ids.map(String)
      : [],
    messages_by_uid: (data.messages_by_uid as Record<string, string>) ?? {},
    clips: Array.isArray(data.clips)
      ? (data.clips as MatchTalkClipSuggestion[])
      : [],
    consignes: Array.isArray(data.consignes) ? (data.consignes as MatchTalkConsigne[]) : [],
    clip_order: Array.isArray(data.clip_order) ? data.clip_order.map(String) : [],
    shared: Boolean(data.shared),
    created_by: String(data.created_by ?? ''),
    updated_at: toDate(data.updated_at),
  };
}

export const matchTalkService = {
  filterApprovedClips,

  async getForEvent(eventId: string): Promise<MatchTalkBrief | null> {
    if (!isFirebaseConfigured() || !eventId) return null;
    const database = getDb();
    if (!database) return null;
    try {
      const snap = await getDocs(
        query(collection(database, TALK_COL), where('event_id', '==', eventId), limit(1)),
      );
      const d = snap.docs[0];
      return d ? mapTalk(d.id, d.data() as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  },

  async upsert(brief: MatchTalkBrief): Promise<MatchTalkBrief> {
    const payload = {
      event_id: brief.event_id,
      club_id: brief.club_id ?? null,
      title: brief.title,
      match_objective: brief.match_objective ?? null,
      key_points: brief.key_points,
      formation: brief.formation ?? null,
      opponent_notes: brief.opponent_notes ?? null,
      tactical_phase_ids: brief.tactical_phase_ids,
      messages_by_uid: brief.messages_by_uid,
      clips: brief.clips.filter((c) => c.analysis_verified),
      consignes: brief.consignes ?? [],
      clip_order: brief.clip_order ?? [],
      shared: brief.shared ?? false,
      created_by: brief.created_by,
      updated_at: serverTimestamp(),
    };
    if (!isFirebaseConfigured()) {
      return { ...brief, updated_at: new Date() };
    }
    const database = getDb();
    if (!database) return { ...brief, updated_at: new Date() };
    if (brief.id.startsWith('talk_') || brief.id.startsWith('local_')) {
      const ref = await addDoc(collection(database, TALK_COL), {
        ...payload,
        created_at: serverTimestamp(),
      });
      return { ...brief, id: ref.id, updated_at: new Date() };
    }
    await setDoc(doc(database, TALK_COL, brief.id), payload, { merge: true });
    return { ...brief, updated_at: new Date() };
  },

  createEmpty: buildEmptyMatchTalk,
};

export const tacticalShareService = {
  async publish(share: Omit<TacticalSharePayload, 'id' | 'created_at'>): Promise<TacticalSharePayload> {
    const local: TacticalSharePayload = {
      ...share,
      id: `local_${Date.now()}`,
      created_at: new Date(),
      recipient_uids: [...new Set(share.recipient_uids)],
    };
    if (!isFirebaseConfigured()) return local;
    const database = getDb();
    if (!database) return local;
    const ref = await addDoc(collection(database, SHARE_COL), {
      board_event_id: share.board_event_id ?? null,
      club_id: share.club_id ?? null,
      author_uid: share.author_uid,
      title: share.title,
      phase_label: share.phase_label ?? null,
      note: share.note ?? null,
      audience: share.audience,
      recipient_uids: local.recipient_uids,
      created_at: serverTimestamp(),
    });
    return { ...local, id: ref.id };
  },

  async listForPlayer(uid: string, max = 20): Promise<TacticalSharePayload[]> {
    if (!isFirebaseConfigured() || !uid) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const snap = await getDocs(
        query(
          collection(database, SHARE_COL),
          where('recipient_uids', 'array-contains', uid),
          limit(max),
        ),
      );
      return snap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
          id: d.id,
          board_event_id: data.board_event_id ? String(data.board_event_id) : undefined,
          club_id: data.club_id ? String(data.club_id) : undefined,
          author_uid: String(data.author_uid ?? ''),
          title: String(data.title ?? ''),
          phase_label: data.phase_label ? String(data.phase_label) : undefined,
          note: data.note ? String(data.note) : undefined,
          audience: (data.audience as TacticalSharePayload['audience']) ?? 'player',
          recipient_uids: Array.isArray(data.recipient_uids)
            ? data.recipient_uids.map(String)
            : [],
          created_at: toDate(data.created_at),
        };
      });
    } catch {
      return [];
    }
  },

  async getById(id: string): Promise<TacticalSharePayload | null> {
    if (!isFirebaseConfigured() || !id) return null;
    const database = getDb();
    if (!database) return null;
    const snap = await getDoc(doc(database, SHARE_COL, id));
    if (!snap.exists()) return null;
    const data = snap.data() as Record<string, unknown>;
    return {
      id: snap.id,
      board_event_id: data.board_event_id ? String(data.board_event_id) : undefined,
      club_id: data.club_id ? String(data.club_id) : undefined,
      author_uid: String(data.author_uid ?? ''),
      title: String(data.title ?? ''),
      phase_label: data.phase_label ? String(data.phase_label) : undefined,
      note: data.note ? String(data.note) : undefined,
      audience: (data.audience as TacticalSharePayload['audience']) ?? 'player',
      recipient_uids: Array.isArray(data.recipient_uids) ? data.recipient_uids.map(String) : [],
      created_at: toDate(data.created_at),
    };
  },
};
