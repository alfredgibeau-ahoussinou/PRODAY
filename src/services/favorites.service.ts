import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type { UserRole } from '../models/User';

export interface FavoriteEntry {
  target_uid: string;
  target_role?: UserRole;
  created_at: Date;
}

function favoriteDocId(userUid: string, targetUid: string): string {
  return `${userUid}__${targetUid}`;
}

export const favoritesService = {
  async listIds(userUid: string): Promise<string[]> {
    if (!isFirebaseConfigured() || !userUid) return [];
    const database = getDb();
    if (!database) return [];

    try {
      const q = query(
        collection(database, 'user_favorites'),
        where('user_uid', '==', userUid)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => String(d.data().target_uid ?? ''));
    } catch (error) {
      console.error('[favoritesService] listIds:', error);
      return [];
    }
  },

  async isFavorite(userUid: string, targetUid: string): Promise<boolean> {
    if (!userUid || !targetUid) return false;
    const ids = await this.listIds(userUid);
    return ids.includes(targetUid);
  },

  async toggle(
    userUid: string,
    targetUid: string,
    targetRole?: UserRole
  ): Promise<boolean> {
    if (!isFirebaseConfigured()) throw new Error('Firebase non configuré');
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    if (userUid === targetUid) throw new Error('Impossible de vous ajouter en favori.');

    const id = favoriteDocId(userUid, targetUid);
    const ref = doc(database, 'user_favorites', id);
    const ids = await this.listIds(userUid);

    if (ids.includes(targetUid)) {
      await deleteDoc(ref);
      return false;
    }

    await setDoc(ref, {
      user_uid: userUid,
      target_uid: targetUid,
      target_role: targetRole ?? null,
      created_at: serverTimestamp(),
    });
    return true;
  },
};
