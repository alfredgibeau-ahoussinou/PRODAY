import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import { tournamentFromFirestore, tournamentMatchFromFirestore } from '../lib/firestoreMappers';
import type { Tournament, TournamentAwards, TournamentMatch, TournamentStatus } from '../models/Tournament';
import type { GeoPoint } from '../models/User';

export interface CreateTournamentInput {
  name: string;
  organizer_id: string;
  city: string;
  location: GeoPoint;
  date_start: Date;
  date_end: Date;
  categories: string[];
}

export const tournamentService = {
  async listUpcoming(max = 20): Promise<Tournament[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    try {
      const q = query(
        collection(database, 'tournaments'),
        orderBy('date_start', 'asc'),
        limit(max)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) =>
        tournamentFromFirestore(d.id, d.data() as Record<string, unknown>)
      );
    } catch {
      const snap = await getDocs(collection(database, 'tournaments'));
      return snap.docs
        .map((d) => tournamentFromFirestore(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => a.date_start.getTime() - b.date_start.getTime());
    }
  },

  async listOpen(): Promise<Tournament[]> {
    const all = await this.listUpcoming();
    return all.filter((t) => t.status === 'OPEN');
  },

  async getById(tournamentId: string): Promise<Tournament | null> {
    if (!isFirebaseConfigured()) return null;
    const database = getDb();
    if (!database) return null;

    const snap = await getDoc(doc(database, 'tournaments', tournamentId));
    if (!snap.exists()) return null;
    return tournamentFromFirestore(snap.id, snap.data() as Record<string, unknown>);
  },

  async getLatestWithAwards(): Promise<Tournament | null> {
    const all = await this.listUpcoming(50);
    const finished = all.filter((t) => t.status === 'FINISHED' && t.awards_names);
    return finished[0] ?? null;
  },

  async create(input: CreateTournamentInput): Promise<string> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const ref = doc(collection(database, 'tournaments'));
    await setDoc(ref, {
      name: input.name,
      organizer_id: input.organizer_id,
      city: input.city,
      location: input.location,
      date_start: Timestamp.fromDate(input.date_start),
      date_end: Timestamp.fromDate(input.date_end),
      categories: input.categories,
      status: 'OPEN',
      subscriber_uids: [],
      created_at: serverTimestamp(),
    });
    return ref.id;
  },

  async registerClub(tournamentId: string, clubUid: string): Promise<void> {
    const database = getDb();
    if (!database) return;
    await updateDoc(doc(database, 'tournaments', tournamentId), {
      subscriber_uids: arrayUnion(clubUid),
    });
  },

  async updateStatus(tournamentId: string, status: TournamentStatus): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await updateDoc(doc(database, 'tournaments', tournamentId), {
      status,
      updated_at: serverTimestamp(),
    });
  },

  async submitAwards(
    tournamentId: string,
    awards: TournamentAwards,
    names: { best_player: string; top_scorer: string; best_goalkeeper: string }
  ): Promise<void> {
    const database = getDb();
    if (!database) return;
    await updateDoc(doc(database, 'tournaments', tournamentId), {
      awards: {
        best_player: awards.best_player_uid,
        top_scorer: awards.top_scorer_uid,
        best_goalkeeper: awards.best_goalkeeper_uid,
      },
      awards_names: names,
      status: 'FINISHED',
      updated_at: serverTimestamp(),
    });
  },

  async listMatches(tournamentId: string): Promise<TournamentMatch[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    const colRef = collection(database, 'tournaments', tournamentId, 'matches');
    try {
      const q = query(colRef, orderBy('scheduled_at', 'asc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) =>
        tournamentMatchFromFirestore(d.id, tournamentId, d.data() as Record<string, unknown>)
      );
    } catch {
      const snap = await getDocs(colRef);
      return snap.docs
        .map((d) =>
          tournamentMatchFromFirestore(d.id, tournamentId, d.data() as Record<string, unknown>)
        )
        .sort(
          (a, b) =>
            (a.scheduled_at?.getTime() ?? 0) - (b.scheduled_at?.getTime() ?? 0)
        );
    }
  },

  async createMatch(
    tournamentId: string,
    input: {
      team_a_name: string;
      team_b_name: string;
      phase: 'poule' | 'elimination';
      scheduled_at?: Date;
    }
  ): Promise<string> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const ref = doc(collection(database, 'tournaments', tournamentId, 'matches'));
    await setDoc(ref, {
      team_a_name: input.team_a_name.trim(),
      team_b_name: input.team_b_name.trim(),
      score_a: 0,
      score_b: 0,
      phase: input.phase,
      scheduled_at: input.scheduled_at ? Timestamp.fromDate(input.scheduled_at) : null,
      played: false,
      created_at: serverTimestamp(),
    });
    return ref.id;
  },

  async updateScore(
    tournamentId: string,
    matchId: string,
    scoreA: number,
    scoreB: number,
    played = true
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await updateDoc(doc(database, 'tournaments', tournamentId, 'matches', matchId), {
      score_a: scoreA,
      score_b: scoreB,
      played,
      updated_at: serverTimestamp(),
    });
  },
};
