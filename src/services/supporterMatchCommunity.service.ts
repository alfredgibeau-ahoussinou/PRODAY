import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { getDb, getFirebaseAuth } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';

const POLLS_COL = 'supporter_match_polls';
const PREDICTIONS_COL = 'supporter_match_predictions';
const REACTIONS_COL = 'supporter_match_reactions';

export interface SupporterMotmPoll {
  matchId: string;
  options: string[];
  votes: Record<string, string>;
  updatedAt?: Date;
}

export interface SupporterScorePrediction {
  uid: string;
  homeScore: number;
  awayScore: number;
  label: string;
  createdAt?: Date;
}

export interface SupporterMatchReaction {
  uid: string;
  emoji: string;
  updatedAt?: Date;
}

export type SupporterCommunitySnapshot = {
  poll: SupporterMotmPoll | null;
  myPrediction: SupporterScorePrediction | null;
  predictionCount: number;
  myReaction: SupporterMatchReaction | null;
  reactionCounts: Record<string, number>;
};

const DEFAULT_MOTM_OPTIONS = ['Joueur domicile', 'Joueur extérieur', 'Gardien'];
const REACTION_EMOJIS = ['🔥', '👏', '😮', '💪', '😤'] as const;

function databaseOrNull() {
  if (!isFirebaseConfigured()) return null;
  const authUid = getFirebaseAuth()?.currentUser?.uid;
  if (!authUid) return null;
  const database = getDb();
  if (!database) return null;
  return { database, authUid };
}

export const supporterMatchCommunityService = {
  defaultMotmOptions: DEFAULT_MOTM_OPTIONS,
  reactionEmojis: REACTION_EMOJIS,

  async loadSnapshot(matchId: string): Promise<SupporterCommunitySnapshot> {
    const ctx = databaseOrNull();
    const empty: SupporterCommunitySnapshot = {
      poll: null,
      myPrediction: null,
      predictionCount: 0,
      myReaction: null,
      reactionCounts: {},
    };
    if (!ctx) return empty;

    const { database, authUid } = ctx;
    try {
      const [pollSnap, predSnap, reactSnap] = await Promise.all([
        getDoc(doc(database, POLLS_COL, matchId)),
        getDoc(doc(database, PREDICTIONS_COL, matchId, 'entries', authUid)),
        getDoc(doc(database, REACTIONS_COL, matchId, 'entries', authUid)),
      ]);

      let poll: SupporterMotmPoll | null = null;
      if (pollSnap.exists()) {
        const d = pollSnap.data();
        poll = {
          matchId,
          options: Array.isArray(d.options) ? d.options.map(String) : DEFAULT_MOTM_OPTIONS,
          votes: (d.votes as Record<string, string>) ?? {},
        };
      }

      let myPrediction: SupporterScorePrediction | null = null;
      if (predSnap.exists()) {
        const d = predSnap.data();
        myPrediction = {
          uid: authUid,
          homeScore: Number(d.home_score ?? 0),
          awayScore: Number(d.away_score ?? 0),
          label: String(d.label ?? `${d.home_score}-${d.away_score}`),
        };
      }

      let myReaction: SupporterMatchReaction | null = null;
      const reactionCounts: Record<string, number> = {};
      if (reactSnap.exists()) {
        myReaction = { uid: authUid, emoji: String(reactSnap.data().emoji ?? '🔥') };
      }

      const pollData = pollSnap.data();
      if (pollData?.reaction_counts && typeof pollData.reaction_counts === 'object') {
        Object.assign(reactionCounts, pollData.reaction_counts as Record<string, number>);
      }

      return {
        poll,
        myPrediction,
        predictionCount: Number(pollData?.prediction_count ?? 0),
        myReaction,
        reactionCounts,
      };
    } catch (e) {
      console.warn('[supporterMatchCommunity] load:', e);
      return empty;
    }
  },

  async voteMotm(matchId: string, option: string): Promise<void> {
    const ctx = databaseOrNull();
    if (!ctx) throw new Error('Connexion requise');
    const { database, authUid } = ctx;
    const ref = doc(database, POLLS_COL, matchId);

    await runTransaction(database, async (tx) => {
      const snap = await tx.get(ref);
      const votes = snap.exists()
        ? { ...((snap.data().votes as Record<string, string>) ?? {}) }
        : {};
      votes[authUid] = option;
      tx.set(
        ref,
        {
          match_id: matchId,
          options: snap.exists() && Array.isArray(snap.data().options)
            ? snap.data().options
            : DEFAULT_MOTM_OPTIONS,
          votes,
          updated_at: serverTimestamp(),
        },
        { merge: true },
      );
    });
  },

  async submitPrediction(
    matchId: string,
    label: string,
    homeScore: number,
    awayScore: number,
  ): Promise<void> {
    const ctx = databaseOrNull();
    if (!ctx) throw new Error('Connexion requise');
    const { database, authUid } = ctx;

    await setDoc(doc(database, PREDICTIONS_COL, matchId, 'entries', authUid), {
      uid: authUid,
      label,
      home_score: homeScore,
      away_score: awayScore,
      created_at: serverTimestamp(),
    });

    const pollRef = doc(database, POLLS_COL, matchId);
    await runTransaction(database, async (tx) => {
      const snap = await tx.get(pollRef);
      const count = Number(snap.data()?.prediction_count ?? 0);
      tx.set(pollRef, { prediction_count: count + 1, match_id: matchId }, { merge: true });
    });
  },

  async setReaction(matchId: string, emoji: string): Promise<void> {
    const ctx = databaseOrNull();
    if (!ctx) throw new Error('Connexion requise');
    const { database, authUid } = ctx;

    await setDoc(doc(database, REACTIONS_COL, matchId, 'entries', authUid), {
      uid: authUid,
      emoji,
      updated_at: serverTimestamp(),
    });

    const pollRef = doc(database, POLLS_COL, matchId);
    await runTransaction(database, async (tx) => {
      const snap = await tx.get(pollRef);
      const counts = { ...((snap.data()?.reaction_counts as Record<string, number>) ?? {}) };
      counts[emoji] = (counts[emoji] ?? 0) + 1;
      tx.set(pollRef, { reaction_counts: counts, match_id: matchId }, { merge: true });
    });
  },

  parsePredictionLabel(label: string): { home: number; away: number } | null {
    const m = label.match(/^(\d+)\s*[-–]\s*(\d+)$/);
    if (!m) return null;
    return { home: Number(m[1]), away: Number(m[2]) };
  },
};
