import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import { tournamentFromFirestore } from '../lib/firestoreMappers';
import type {
  CreateTournamentInput,
  RegisterTournamentTeamInput,
  Tournament,
} from '../models/Tournament';
import {
  buildRoundRobinFixtures,
  chunkRegistrationsIntoPools,
  computeAllStandings,
} from '../utils/tournamentStandings';

const COL = 'tournaments';

export const tournamentsService = {
  async listUpcoming(max = 24): Promise<Tournament[]> {
    if (!isFirebaseConfigured()) return [];

    const database = getDb();
    if (!database) return [];

    try {
      const q = query(collection(database, COL), orderBy('starts_at', 'asc'), limit(max));
      const snap = await getDocs(q);
      return snap.docs.map((d) => tournamentFromFirestore(d.id, d.data() as Record<string, unknown>));
    } catch {
      const snap = await getDocs(collection(database, COL));
      return snap.docs
        .map((d) => tournamentFromFirestore(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime())
        .slice(0, max);
    }
  },

  async getById(id: string): Promise<Tournament | null> {
    if (!isFirebaseConfigured()) return null;

    const database = getDb();
    if (!database) return null;
    const snap = await getDoc(doc(database, COL, id));
    if (!snap.exists()) return null;
    return tournamentFromFirestore(snap.id, snap.data() as Record<string, unknown>);
  },

  async create(input: CreateTournamentInput): Promise<string> {
    if (!isFirebaseConfigured()) throw new Error('Firebase non configuré');

    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const ref = doc(collection(database, COL));
    await setDoc(ref, {
      title: input.title.trim(),
      description: input.description?.trim() || null,
      city: input.city.trim(),
      starts_at: input.starts_at,
      ends_at: input.ends_at ?? null,
      max_teams: input.max_teams,
      entry_fee_cents: input.entry_fee_cents,
      categories: input.categories,
      organizer_uid: input.organizer_uid,
      organizer_name: input.organizer_name.trim(),
      status: 'open',
      registrations: [],
      pools: [],
      fixtures: [],
      standings: {},
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    return ref.id;
  },

  async registerTeam(input: RegisterTournamentTeamInput): Promise<void> {
    const tournament = await this.getById(input.tournament_id);
    if (!tournament) throw new Error('Tournoi introuvable.');
    if (tournament.status !== 'open') throw new Error('Les inscriptions sont closes.');
    if (tournament.registrations.length >= tournament.max_teams) {
      throw new Error('Tournoi complet.');
    }
    if (tournament.registrations.some((r) => r.club_id === input.club_id)) {
      throw new Error('Équipe déjà inscrite.');
    }

    const registration = {
      id: `reg-${input.club_id}-${Date.now()}`,
      club_id: input.club_id,
      club_name: input.club_name,
      captain_uid: input.captain_uid,
      captain_name: input.captain_name,
      player_uids: input.player_uids,
      player_names: input.player_names,
      paid: tournament.entry_fee_cents === 0,
      registered_at: new Date(),
    };

    if (!isFirebaseConfigured()) throw new Error('Firebase non configuré');

    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await updateDoc(doc(database, COL, input.tournament_id), {
      registrations: arrayUnion({
        ...registration,
        registered_at: registration.registered_at.toISOString(),
      }),
      updated_at: serverTimestamp(),
    });
  },

  async generatePoolsAndFixtures(tournamentId: string): Promise<void> {
    const tournament = await this.getById(tournamentId);
    if (!tournament) throw new Error('Tournoi introuvable.');
    if (tournament.registrations.length < 2) {
      throw new Error('Au moins 2 équipes inscrites pour générer les poules.');
    }

    const pools = chunkRegistrationsIntoPools(tournament.registrations);
    const fixtures = pools.flatMap((pool) =>
      buildRoundRobinFixtures(pool, tournament.registrations)
    );
    const standings = computeAllStandings(pools, tournament.registrations, fixtures);

    if (!isFirebaseConfigured()) throw new Error('Firebase non configuré');

    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await updateDoc(doc(database, COL, tournamentId), {
      pools,
      fixtures,
      standings,
      status: 'in_progress',
      updated_at: serverTimestamp(),
    });
  },

  async submitFixtureScore(
    tournamentId: string,
    fixtureId: string,
    homeScore: number,
    awayScore: number
  ): Promise<void> {
    const tournament = await this.getById(tournamentId);
    if (!tournament) throw new Error('Tournoi introuvable.');

    const fixtures = tournament.fixtures.map((f) =>
      f.id === fixtureId
        ? { ...f, home_score: homeScore, away_score: awayScore, played: true }
        : f
    );
    const standings = computeAllStandings(tournament.pools, tournament.registrations, fixtures);

    if (!isFirebaseConfigured()) throw new Error('Firebase non configuré');

    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await updateDoc(doc(database, COL, tournamentId), {
      fixtures,
      standings,
      updated_at: serverTimestamp(),
    });
  },
};
