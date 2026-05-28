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
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type {
  CreateFeedNewsInput,
  CreateFeedPollInput,
  FeedAudience,
  PlatformFeedPost,
} from '../models/PlatformFeed';
import type { UserRole } from '../models/User';
import {
  canCreateAgentPoll,
  canPublishFeedNews,
  canVoteAgentPoll,
} from '../utils/platformFeedPermissions';

export { canCreateAgentPoll, canPublishFeedNews, canVoteAgentPoll };

const COL = 'platform_feed';

function toDate(v: unknown): Date {
  if (v && typeof v === 'object' && 'toDate' in v) {
    return (v as { toDate: () => Date }).toDate();
  }
  return new Date();
}

function mapPost(id: string, data: Record<string, unknown>): PlatformFeedPost {
  const pollVotes = data.poll_votes as Record<string, string[]> | undefined;
  return {
    id,
    type: (data.type as PlatformFeedPost['type']) ?? 'news',
    audience: (data.audience as FeedAudience) ?? 'all',
    author_uid: String(data.author_uid ?? ''),
    author_name: String(data.author_name ?? ''),
    author_role: (data.author_role as UserRole) ?? 'agent',
    title: String(data.title ?? ''),
    body: String(data.body ?? ''),
    image_url: data.image_url ? String(data.image_url) : undefined,
    poll_options: Array.isArray(data.poll_options)
      ? (data.poll_options as string[]).map(String)
      : undefined,
    poll_votes: pollVotes
      ? Object.fromEntries(
          Object.entries(pollVotes).map(([k, v]) => [
            k,
            Array.isArray(v) ? v.map(String) : [],
          ])
        )
      : undefined,
    created_at: toDate(data.created_at),
    updated_at: data.updated_at ? toDate(data.updated_at) : undefined,
  };
}

export const platformFeedService = {
  canPublishFeedNews,
  canCreateAgentPoll,
  canVoteAgentPoll,

  async listForUser(viewerRole: UserRole, max = 60): Promise<PlatformFeedPost[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    try {
      const q = query(collection(database, COL), orderBy('created_at', 'desc'), limit(max));
      const snap = await getDocs(q);
      const posts = snap.docs.map((d) => mapPost(d.id, d.data() as Record<string, unknown>));
      return posts.filter(
        (p) => p.audience === 'all' || (p.audience === 'agents' && viewerRole === 'agent')
      );
    } catch {
      const snap = await getDocs(collection(database, COL));
      return snap.docs
        .map((d) => mapPost(d.id, d.data() as Record<string, unknown>))
        .filter(
          (p) => p.audience === 'all' || (p.audience === 'agents' && viewerRole === 'agent')
        )
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
        .slice(0, max);
    }
  },

  async createNews(input: CreateFeedNewsInput): Promise<string> {
    if (!canPublishFeedNews(input.author_role)) {
      throw new Error('Votre rôle ne permet pas de publier sur le fil.');
    }
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const ref = await addDoc(collection(database, COL), {
      type: 'news',
      audience: input.audience ?? 'all',
      author_uid: input.author_uid,
      author_name: input.author_name.trim(),
      author_role: input.author_role,
      title: input.title.trim(),
      body: input.body.trim(),
      ...(input.image_url ? { image_url: input.image_url } : {}),
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    return ref.id;
  },

  async createPoll(input: CreateFeedPollInput): Promise<string> {
    if (!canCreateAgentPoll(input.author_role)) {
      throw new Error('Seuls les agents peuvent créer un sondage.');
    }
    const options = input.options.map((o) => o.trim()).filter(Boolean);
    if (options.length < 2) {
      throw new Error('Ajoutez au moins 2 options au sondage.');
    }
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const votes: Record<string, string[]> = {};
    options.forEach((_, i) => {
      votes[String(i)] = [];
    });

    const ref = await addDoc(collection(database, COL), {
      type: 'poll',
      audience: 'agents',
      author_uid: input.author_uid,
      author_name: input.author_name.trim(),
      author_role: input.author_role,
      title: input.title.trim(),
      body: (input.body ?? '').trim(),
      poll_options: options,
      poll_votes: votes,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    return ref.id;
  },

  async votePoll(
    post: PlatformFeedPost,
    voterUid: string,
    voterRole: UserRole,
    optionIndex: number
  ): Promise<void> {
    if (!canVoteAgentPoll(voterRole)) {
      throw new Error('Seuls les agents peuvent voter.');
    }
    if (post.type !== 'poll' || !post.poll_options?.length) {
      throw new Error('Sondage invalide.');
    }
    if (optionIndex < 0 || optionIndex >= post.poll_options.length) {
      throw new Error('Option invalide.');
    }

    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const votes: Record<string, string[]> = { ...(post.poll_votes ?? {}) };
    post.poll_options.forEach((_, i) => {
      const key = String(i);
      const list = votes[key] ?? [];
      votes[key] = list.filter((uid) => uid !== voterUid);
    });
    const key = String(optionIndex);
    votes[key] = [...(votes[key] ?? []), voterUid];

    await updateDoc(doc(database, COL, post.id), {
      poll_votes: votes,
      updated_at: serverTimestamp(),
    });
  },
};
