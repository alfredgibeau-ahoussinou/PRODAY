import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type { CreateMotmVoteInput, MotmStanding, MotmVote } from '../models/MotmVote';

const COL = 'motm_votes';

function voteId(teamEventId: string, voterUid: string): string {
  return `${teamEventId}_${voterUid}`;
}

function mapDoc(id: string, data: Record<string, unknown>): MotmVote {
  return {
    id,
    team_event_id: String(data.team_event_id ?? ''),
    voter_uid: String(data.voter_uid ?? ''),
    nominee_uid: String(data.nominee_uid ?? ''),
    nominee_name: String(data.nominee_name ?? ''),
    created_at:
      data.created_at && typeof data.created_at === 'object' && 'toDate' in (data.created_at as object)
        ? (data.created_at as { toDate: () => Date }).toDate()
        : new Date(),
  };
}

export const motmVotesService = {
  async listForEvent(teamEventId: string, max = 200): Promise<MotmVote[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const q = query(
        collection(database, COL),
        where('team_event_id', '==', teamEventId),
        limit(max)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>));
    } catch (error) {
      console.error('[motmVotesService] listForEvent:', error);
      return [];
    }
  },

  async standings(teamEventId: string): Promise<MotmStanding[]> {
    const votes = await this.listForEvent(teamEventId);
    const map = new Map<string, MotmStanding>();
    for (const v of votes) {
      const cur = map.get(v.nominee_uid) ?? { uid: v.nominee_uid, name: v.nominee_name, votes: 0 };
      cur.votes += 1;
      cur.name = v.nominee_name || cur.name;
      map.set(v.nominee_uid, cur);
    }
    return [...map.values()].sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name));
  },

  async getMyVote(teamEventId: string, voterUid: string): Promise<MotmVote | null> {
    const votes = await this.listForEvent(teamEventId);
    return votes.find((v) => v.voter_uid === voterUid) ?? null;
  },

  async vote(input: CreateMotmVoteInput): Promise<string> {
    if (input.voter_uid === input.nominee_uid) {
      throw new Error('Impossible de voter pour soi-même');
    }
    if (!isFirebaseConfigured()) throw new Error('Firebase non configuré');
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const id = voteId(input.team_event_id, input.voter_uid);
    await setDoc(doc(database, COL, id), {
      team_event_id: input.team_event_id,
      voter_uid: input.voter_uid,
      nominee_uid: input.nominee_uid,
      nominee_name: input.nominee_name.trim(),
      created_at: serverTimestamp(),
    });
    return id;
  },
};
