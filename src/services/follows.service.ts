import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { getDb, getFirebaseAuth } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type { Follow, FollowTargetType } from '../models/Follow';

const COL = 'follows';

function toDate(value: unknown): Date {
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date();
}

function fromFirestore(id: string, data: Record<string, unknown>): Follow {
  return {
    id,
    follower_uid: String(data.follower_uid ?? ''),
    target_type: (data.target_type as FollowTargetType) ?? 'club',
    target_id: String(data.target_id ?? ''),
    target_label: data.target_label ? String(data.target_label) : undefined,
    created_at: toDate(data.created_at),
    updated_at: data.updated_at ? toDate(data.updated_at) : undefined,
  };
}

function followId(followerUid: string, targetType: FollowTargetType, targetId: string): string {
  return `${followerUid}__${targetType}__${targetId}`;
}

export const followsService = {
  async listByFollower(followerUid: string): Promise<Follow[]> {
    if (!isFirebaseConfigured() || !followerUid) return [];
    const authUid = getFirebaseAuth()?.currentUser?.uid;
    if (!authUid || authUid !== followerUid) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const snap = await getDocs(
        query(collection(database, COL), where('follower_uid', '==', followerUid), limit(120))
      );
      return snap.docs.map((d) => fromFirestore(d.id, d.data() as Record<string, unknown>));
    } catch (error) {
      console.error('[followsService] listByFollower:', error);
      return [];
    }
  },

  async follow(
    followerUid: string,
    targetType: FollowTargetType,
    targetId: string,
    targetLabel?: string
  ): Promise<void> {
    if (!isFirebaseConfigured()) throw new Error('Firebase non configuré');
    const authUid = getFirebaseAuth()?.currentUser?.uid;
    if (!authUid || authUid !== followerUid) throw new Error('Suivi non autorisé.');
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    if (!followerUid || !targetId) throw new Error('Suivi invalide.');
    const id = followId(followerUid, targetType, targetId);
    await setDoc(doc(database, COL, id), {
      follower_uid: followerUid,
      target_type: targetType,
      target_id: targetId,
      target_label: targetLabel ?? null,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  },

  async unfollow(
    followerUid: string,
    targetType: FollowTargetType,
    targetId: string
  ): Promise<void> {
    if (!isFirebaseConfigured()) throw new Error('Firebase non configuré');
    const authUid = getFirebaseAuth()?.currentUser?.uid;
    if (!authUid || authUid !== followerUid) throw new Error('Suivi non autorisé.');
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const id = followId(followerUid, targetType, targetId);
    await deleteDoc(doc(database, COL, id));
  },

  async toggle(
    followerUid: string,
    targetType: FollowTargetType,
    targetId: string,
    targetLabel?: string
  ): Promise<boolean> {
    const all = await this.listByFollower(followerUid);
    const found = all.some((f) => f.target_type === targetType && f.target_id === targetId);
    if (found) {
      await this.unfollow(followerUid, targetType, targetId);
      return false;
    }
    await this.follow(followerUid, targetType, targetId, targetLabel);
    return true;
  },
};

