import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type { CommunityReel, CreateCommunityReelInput } from '../models/CommunityReel';
import { adminAuditService } from './adminAudit.service';

const COL = 'community_reels';

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  return new Date(0);
}

function mapDoc(id: string, data: Record<string, unknown>): CommunityReel {
  return {
    id,
    author_uid: String(data.author_uid ?? ''),
    author_name: String(data.author_name ?? ''),
    club_id: data.club_id as string | undefined,
    video_url: String(data.video_url ?? ''),
    poster_url: data.poster_url as string | undefined,
    caption: String(data.caption ?? ''),
    theme: (data.theme as CommunityReel['theme']) ?? 'skills',
    status: (data.status as CommunityReel['status']) ?? 'pending',
    created_at: toDate(data.created_at),
    updated_at: toDate(data.updated_at),
  };
}

export const communityReelsService = {
  async listApproved(max = 50): Promise<CommunityReel[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const snap = await getDocs(
        query(
          collection(database, COL),
          where('status', '==', 'approved'),
          orderBy('created_at', 'desc'),
          limit(max),
        ),
      );
      return snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>));
    } catch {
      const snap = await getDocs(query(collection(database, COL), limit(max)));
      return snap.docs
        .map((d) => mapDoc(d.id, d.data() as Record<string, unknown>))
        .filter((r) => r.status === 'approved');
    }
  },

  async submit(
    authorUid: string,
    authorName: string,
    input: CreateCommunityReelInput,
    actorEmail?: string,
  ): Promise<string> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    if (!input.caption.trim()) throw new Error('Ajoutez une légende.');
    if (!input.video_url.trim()) throw new Error('Vidéo manquante.');

    const ref = await addDoc(collection(database, COL), {
      author_uid: authorUid,
      author_name: authorName,
      club_id: input.club_id ?? null,
      video_url: input.video_url,
      poster_url: input.poster_url ?? null,
      caption: input.caption.trim(),
      theme: input.theme,
      status: 'pending',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    await adminAuditService.log({
      action: 'reel_submitted',
      actor_uid: authorUid,
      actor_email: actorEmail,
      target_type: 'community_reel',
      target_id: ref.id,
      summary: `Nouveau reel en attente de validation · ${authorName || 'utilisateur ProDay'}`,
    });
    return ref.id;
  },
};
