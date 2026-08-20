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
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type { SupporterVideoRights } from '../models/SupporterVideo';

const COL = 'supporter_video_rights';

export interface SupporterVideoRightsEntry {
  videoId: string;
  rights: SupporterVideoRights;
  title?: string;
  matchId?: string;
  updatedAt?: Date;
  updatedByUid?: string;
}

const rightsCache = new Map<string, SupporterVideoRights>();

export const supporterVideoRightsService = {
  async getOverride(videoId: string): Promise<SupporterVideoRights | null> {
    if (rightsCache.has(videoId)) return rightsCache.get(videoId)!;
    if (!isFirebaseConfigured()) return null;
    const database = getDb();
    if (!database) return null;
    try {
      const snap = await getDoc(doc(database, COL, videoId));
      if (!snap.exists()) return null;
      const rights = snap.data().rights as SupporterVideoRights;
      rightsCache.set(videoId, rights);
      return rights;
    } catch {
      return null;
    }
  },

  async listForAdmin(max = 80): Promise<SupporterVideoRightsEntry[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const snap = await getDocs(
        query(collection(database, COL), orderBy('updated_at', 'desc'), limit(max)),
      );
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          videoId: d.id,
          rights: (data.rights as SupporterVideoRights) ?? 'UNAVAILABLE',
          title: data.title ? String(data.title) : undefined,
          matchId: data.match_id ? String(data.match_id) : undefined,
          updatedByUid: data.updated_by_uid ? String(data.updated_by_uid) : undefined,
        };
      });
    } catch {
      return [];
    }
  },

  async saveOverride(
    videoId: string,
    rights: SupporterVideoRights,
    meta: { title?: string; matchId?: string; adminUid: string },
  ): Promise<void> {
    if (!isFirebaseConfigured()) throw new Error('Firebase non configuré');
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await setDoc(
      doc(database, COL, videoId),
      {
        rights,
        title: meta.title ?? null,
        match_id: meta.matchId ?? null,
        updated_by_uid: meta.adminUid,
        updated_at: serverTimestamp(),
      },
      { merge: true },
    );
    rightsCache.set(videoId, rights);
  },

  clearCache(): void {
    rightsCache.clear();
  },
};
