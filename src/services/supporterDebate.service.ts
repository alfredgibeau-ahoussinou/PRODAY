import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
  type Firestore,
} from 'firebase/firestore';
import { getDb, getFirebaseAuth } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import {
  validateDebateBody,
  type CreateDebatePostInput,
  type SupporterDebatePost,
} from '../models/SupporterDebatePost';

const COL = 'supporter_debate_posts';

/** Fallback mémoire beta quand Firebase est indisponible. */
const localPosts: SupporterDebatePost[] = [];

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
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

function mapDoc(id: string, data: Record<string, unknown>): SupporterDebatePost {
  return {
    id,
    author_uid: String(data.author_uid ?? ''),
    author_name: String(data.author_name ?? 'Supporter'),
    body: String(data.body ?? ''),
    match_id: data.match_id != null ? String(data.match_id) : null,
    match_label: data.match_label ? String(data.match_label) : undefined,
    like_count: Number(data.like_count ?? 0),
    reply_count: Number(data.reply_count ?? 0),
    moderation: (data.moderation as SupporterDebatePost['moderation']) ?? 'visible',
    created_at: toDate(data.created_at),
    parent_id: data.parent_id != null ? String(data.parent_id) : null,
  };
}

function databaseOrNull(): Firestore | null {
  if (!isFirebaseConfigured()) return null;
  return getDb();
}

function sortNewest(posts: SupporterDebatePost[]): SupporterDebatePost[] {
  return [...posts].sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
}

export const supporterDebateService = {
  validateDebateBody,

  async listGlobal(max = 40): Promise<SupporterDebatePost[]> {
    const database = databaseOrNull();
    if (!database) {
      return sortNewest(localPosts.filter((p) => !p.match_id && p.moderation === 'visible')).slice(
        0,
        max,
      );
    }
    try {
      const snap = await getDocs(
        query(
          collection(database, COL),
          where('moderation', '==', 'visible'),
          orderBy('created_at', 'desc'),
          limit(max),
        ),
      );
      return snap.docs
        .map((d) => mapDoc(d.id, d.data() as Record<string, unknown>))
        .filter((p) => !p.match_id && !p.parent_id);
    } catch {
      try {
        const snap = await getDocs(query(collection(database, COL), limit(max)));
        return sortNewest(
          snap.docs
            .map((d) => mapDoc(d.id, d.data() as Record<string, unknown>))
            .filter((p) => !p.match_id && !p.parent_id && p.moderation === 'visible'),
        ).slice(0, max);
      } catch {
        return sortNewest(
          localPosts.filter((p) => !p.match_id && p.moderation === 'visible'),
        ).slice(0, max);
      }
    }
  },

  async listForMatch(matchId: string, max = 60): Promise<SupporterDebatePost[]> {
    if (!matchId) return [];
    const database = databaseOrNull();
    if (!database) {
      return sortNewest(
        localPosts.filter(
          (p) => p.match_id === matchId && !p.parent_id && p.moderation === 'visible',
        ),
      ).slice(0, max);
    }
    try {
      const snap = await getDocs(
        query(
          collection(database, COL),
          where('match_id', '==', matchId),
          where('moderation', '==', 'visible'),
          orderBy('created_at', 'desc'),
          limit(max),
        ),
      );
      return snap.docs
        .map((d) => mapDoc(d.id, d.data() as Record<string, unknown>))
        .filter((p) => !p.parent_id);
    } catch {
      try {
        const snap = await getDocs(
          query(collection(database, COL), where('match_id', '==', matchId), limit(max)),
        );
        return sortNewest(
          snap.docs
            .map((d) => mapDoc(d.id, d.data() as Record<string, unknown>))
            .filter((p) => !p.parent_id && p.moderation === 'visible'),
        );
      } catch {
        return sortNewest(
          localPosts.filter(
            (p) => p.match_id === matchId && !p.parent_id && p.moderation === 'visible',
          ),
        ).slice(0, max);
      }
    }
  },

  async createPost(input: CreateDebatePostInput): Promise<SupporterDebatePost> {
    const body = validateDebateBody(input.body);
    const authUid = getFirebaseAuth()?.currentUser?.uid;
    if (authUid && authUid !== input.author_uid) {
      throw new Error('Publication non autorisée.');
    }
    const post: SupporterDebatePost = {
      id: `local_${Date.now()}`,
      author_uid: input.author_uid,
      author_name: input.author_name.trim() || 'Supporter',
      body,
      match_id: input.match_id ?? null,
      match_label: input.match_label,
      like_count: 0,
      reply_count: 0,
      moderation: 'visible',
      created_at: new Date(),
      parent_id: input.parent_id ?? null,
    };

    const database = databaseOrNull();
    if (!database) {
      localPosts.unshift(post);
      return post;
    }

    try {
      const ref = await addDoc(collection(database, COL), {
        author_uid: post.author_uid,
        author_name: post.author_name,
        body: post.body,
        match_id: post.match_id,
        match_label: post.match_label ?? null,
        like_count: 0,
        reply_count: 0,
        moderation: 'visible',
        parent_id: post.parent_id,
        created_at: serverTimestamp(),
      });
      return { ...post, id: ref.id };
    } catch {
      localPosts.unshift(post);
      return post;
    }
  },

  /** Tests / reset beta local. */
  _resetLocalForTests() {
    localPosts.length = 0;
  },
};
