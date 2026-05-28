import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import {
  recruitmentPostFromFirestore,
  applicationFromFirestore,
} from '../lib/firestoreMappers';
import type { User } from '../models/User';
import type { AppSpaceId } from '../models/AppSpace';
import type { RecruitmentPost, Application } from '../models/Player';
import { callFunction } from '../lib/firebaseFunctions';

export const APPLICATION_STATUS_LABEL: Record<Application['status'], string> = {
  PENDING: 'En attente',
  VIEWED: 'Consultée',
  ACCEPTED: 'Acceptée',
  REJECTED: 'Refusée',
};

const STAFF_ROLES = new Set(['coach', 'agent', 'organizer']);

export function canManagePostApplications(profile: User, post: RecruitmentPost): boolean {
  if (profile.uid === post.author_uid) return true;
  if (!STAFF_ROLES.has(profile.role)) return false;
  const clubId = profile.profile?.club_id;
  return Boolean(clubId && clubId === post.club_id);
}

export const recruitmentService = {
  async listOpenPosts(max = 10): Promise<RecruitmentPost[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    try {
      const q = query(
        collection(database, 'recruitment_posts'),
        where('status', '==', 'OPEN'),
        orderBy('created_at', 'desc'),
        limit(max)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) =>
        recruitmentPostFromFirestore(d.id, d.data() as Record<string, unknown>)
      );
    } catch (error) {
      console.error('[recruitmentService] listOpenPosts:', error);
      return [];
    }
  },

  async getPostById(postId: string): Promise<RecruitmentPost | null> {
    if (!isFirebaseConfigured()) return null;
    const database = getDb();
    if (!database) return null;
    const snap = await getDoc(doc(database, 'recruitment_posts', postId));
    if (!snap.exists()) return null;
    return recruitmentPostFromFirestore(
      snap.id,
      snap.data() as Record<string, unknown>
    );
  },

  async createPost(
    input: {
      author_uid: string;
      club_id: string;
      club_name: string;
      title: string;
      position: string;
      category: string;
      level: string;
      city: string;
      description?: string;
      target_space?: AppSpaceId;
    }
  ): Promise<string> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const ref = await addDoc(collection(database, 'recruitment_posts'), {
      ...input,
      status: 'OPEN',
      created_at: serverTimestamp(),
    });
    return ref.id;
  },

  async hasPlayerApplied(postId: string, playerUid: string): Promise<boolean> {
    if (!isFirebaseConfigured() || !playerUid) return false;
    const database = getDb();
    if (!database) return false;
    try {
      const q = query(
        collection(database, 'recruitment_applications'),
        where('post_id', '==', postId),
        where('player_uid', '==', playerUid),
        limit(1)
      );
      const snap = await getDocs(q);
      return !snap.empty;
    } catch {
      return false;
    }
  },

  async applyToPost(input: {
    post_id: string;
    post_author_uid: string;
    player_uid: string;
    player_name: string;
    cover_letter: string;
  }): Promise<string> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const already = await this.hasPlayerApplied(input.post_id, input.player_uid);
    if (already) throw new Error('Vous avez déjà postulé à cette annonce.');

    const ref = await addDoc(collection(database, 'recruitment_applications'), {
      post_id: input.post_id,
      post_author_uid: input.post_author_uid,
      player_uid: input.player_uid,
      player_name: input.player_name,
      cover_letter: input.cover_letter.trim(),
      cv_pdf_url: '',
      status: 'PENDING',
      created_at: serverTimestamp(),
    });
    return ref.id;
  },

  async listApplicationsForPost(postId: string, max = 30): Promise<Application[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const q = query(
        collection(database, 'recruitment_applications'),
        where('post_id', '==', postId),
        orderBy('created_at', 'desc'),
        limit(max)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) =>
        applicationFromFirestore(d.id, d.data() as Record<string, unknown>)
      );
    } catch (error) {
      console.error('[recruitmentService] listApplicationsForPost:', error);
      return [];
    }
  },

  async listMyApplications(playerUid: string, max = 20): Promise<Application[]> {
    if (!isFirebaseConfigured() || !playerUid) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const q = query(
        collection(database, 'recruitment_applications'),
        where('player_uid', '==', playerUid),
        orderBy('created_at', 'desc'),
        limit(max)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) =>
        applicationFromFirestore(d.id, d.data() as Record<string, unknown>)
      );
    } catch (error) {
      console.error('[recruitmentService] listMyApplications:', error);
      return [];
    }
  },

  async updateApplicationStatus(
    applicationId: string,
    status: Application['status'],
    rejectionReason?: string
  ): Promise<void> {
    await callFunction<
      { applicationId: string; status: Application['status']; rejectionReason?: string },
      { success: boolean }
    >('updateApplicationStatus', { applicationId, status, rejectionReason });
  },
};

/** Temps relatif depuis created_at */
export function formatTimeAgo(date: Date): string {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 3600) return `Il y a ${Math.max(1, Math.floor(sec / 60))} min`;
  if (sec < 86400) return `Il y a ${Math.floor(sec / 3600)} h`;
  const days = Math.floor(sec / 86400);
  if (days === 1) return 'Il y a 1 j';
  return `Il y a ${days} j`;
}
