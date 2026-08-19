/**
 * Service CRUD clips vidéo + annotations — Firestore.
 * Clips = sous-collection `video_clips` de `club_match_videos`.
 * Annotations = champ JSON sur le clip (pas de sous-sous-collection).
 */

import {
  addDoc,
  collection,
  deleteDoc,
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
import {
  buildVideoClip,
  sortClipsByTime,
  type CreateVideoClipInput,
  type VideoClip,
} from '../models/VideoClip';
import {
  buildVideoAnnotation,
  type CreateVideoAnnotationInput,
  type VideoAnnotation,
} from '../models/VideoAnnotation';

const VIDEOS_COL = 'club_match_videos';
const CLIPS_SUB = 'video_clips';

function toDate(v: unknown): Date {
  if (v instanceof Date) return v;
  if (v && typeof v === 'object' && 'toDate' in v) {
    return (v as { toDate: () => Date }).toDate();
  }
  return new Date();
}

function clipFromDoc(id: string, data: Record<string, unknown>): VideoClip {
  return {
    id,
    video_id: String(data.video_id ?? ''),
    match_id: data.match_id ? String(data.match_id) : undefined,
    start_sec: Number(data.start_sec ?? 0),
    end_sec: Number(data.end_sec ?? 0),
    tag: (data.tag as VideoClip['tag']) ?? 'other',
    player_uids: Array.isArray(data.player_uids) ? data.player_uids.map(String) : [],
    note: data.note ? String(data.note) : undefined,
    created_by: String(data.created_by ?? ''),
    created_at: toDate(data.created_at),
  };
}

function clipsCol(videoId: string) {
  const database = getDb();
  if (!database) throw new Error('Firebase non configuré');
  return collection(database, VIDEOS_COL, videoId, CLIPS_SUB);
}

export const videoClipsService = {
  async list(videoId: string, max = 100): Promise<VideoClip[]> {
    if (!isFirebaseConfigured() || !videoId) return [];
    try {
      const q = query(clipsCol(videoId), orderBy('start_sec', 'asc'), limit(max));
      const snap = await getDocs(q);
      return snap.docs.map((d) => clipFromDoc(d.id, d.data() as Record<string, unknown>));
    } catch {
      return [];
    }
  },

  async create(input: CreateVideoClipInput): Promise<VideoClip> {
    const clip = buildVideoClip(input);
    if (!isFirebaseConfigured()) return clip;
    const ref = await addDoc(clipsCol(input.video_id), {
      video_id: input.video_id,
      match_id: input.match_id ?? null,
      start_sec: clip.start_sec,
      end_sec: clip.end_sec,
      tag: clip.tag,
      player_uids: clip.player_uids,
      note: clip.note ?? null,
      annotations: [],
      created_by: clip.created_by,
      created_at: serverTimestamp(),
    });
    return { ...clip, id: ref.id };
  },

  async update(
    videoId: string,
    clipId: string,
    patch: Partial<Pick<VideoClip, 'start_sec' | 'end_sec' | 'tag' | 'player_uids' | 'note'>>,
  ): Promise<void> {
    if (!isFirebaseConfigured()) return;
    const database = getDb();
    if (!database) return;
    const payload: Record<string, unknown> = { updated_at: serverTimestamp() };
    if (patch.start_sec != null) payload.start_sec = patch.start_sec;
    if (patch.end_sec != null) payload.end_sec = patch.end_sec;
    if (patch.tag) payload.tag = patch.tag;
    if (patch.player_uids) payload.player_uids = patch.player_uids;
    if (patch.note !== undefined) payload.note = patch.note ?? null;
    await updateDoc(doc(database, VIDEOS_COL, videoId, CLIPS_SUB, clipId), payload);
  },

  async remove(videoId: string, clipId: string): Promise<void> {
    if (!isFirebaseConfigured()) return;
    const database = getDb();
    if (!database) return;
    await deleteDoc(doc(database, VIDEOS_COL, videoId, CLIPS_SUB, clipId));
  },

  async listForPlayer(videoId: string, uid: string): Promise<VideoClip[]> {
    if (!isFirebaseConfigured() || !videoId || !uid) return [];
    try {
      const q = query(
        clipsCol(videoId),
        where('player_uids', 'array-contains', uid),
        limit(50),
      );
      const snap = await getDocs(q);
      return sortClipsByTime(
        snap.docs.map((d) => clipFromDoc(d.id, d.data() as Record<string, unknown>)),
      );
    } catch {
      return [];
    }
  },

  async addAnnotation(
    videoId: string,
    clipId: string,
    input: CreateVideoAnnotationInput,
  ): Promise<VideoAnnotation> {
    const annotation = buildVideoAnnotation(input);
    if (!isFirebaseConfigured()) return annotation;
    const database = getDb();
    if (!database) return annotation;
    const ref = doc(database, VIDEOS_COL, videoId, CLIPS_SUB, clipId);
    const snap = await getDocs(query(clipsCol(videoId), where('__name__', '==', clipId), limit(1)));
    const existing = snap.docs[0]?.data() as Record<string, unknown> | undefined;
    const current = Array.isArray(existing?.annotations) ? existing!.annotations : [];
    await updateDoc(ref, {
      annotations: [...current, {
        id: annotation.id,
        clip_id: annotation.clip_id,
        timestamp_sec: annotation.timestamp_sec,
        type: annotation.type,
        data: annotation.data,
        created_by: annotation.created_by,
        created_at: new Date().toISOString(),
      }],
      updated_at: serverTimestamp(),
    });
    return annotation;
  },

  async getAnnotations(videoId: string, clipId: string): Promise<VideoAnnotation[]> {
    if (!isFirebaseConfigured()) return [];
    try {
      const q = query(clipsCol(videoId), where('__name__', '==', clipId), limit(1));
      const snap = await getDocs(q);
      const data = snap.docs[0]?.data() as Record<string, unknown> | undefined;
      if (!data || !Array.isArray(data.annotations)) return [];
      return (data.annotations as Record<string, unknown>[]).map((a) => ({
        id: String(a.id ?? ''),
        clip_id: String(a.clip_id ?? clipId),
        timestamp_sec: Number(a.timestamp_sec ?? 0),
        type: (a.type as VideoAnnotation['type']) ?? 'arrow',
        data: a.data as VideoAnnotation['data'],
        created_by: String(a.created_by ?? ''),
        created_at: a.created_at ? new Date(a.created_at as string) : new Date(),
      }));
    } catch {
      return [];
    }
  },
};
