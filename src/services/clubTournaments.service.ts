import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type { GeneratedTournamentPlan } from '../utils/clubTournamentGenerator';
import {
  planToLiveFixtures,
  type ClubTournamentEvent,
  type ClubTournamentLiveFixture,
} from '../models/ClubTournamentEvent';

const COL = 'club_tournaments';

function toDate(v: unknown): Date {
  if (v instanceof Date) return v;
  if (v && typeof v === 'object' && 'toDate' in v) {
    return (v as { toDate: () => Date }).toDate();
  }
  if (typeof v === 'string') return new Date(v);
  return new Date(0);
}

function mapFixture(raw: Record<string, unknown>): ClubTournamentLiveFixture {
  return {
    id: String(raw.id ?? ''),
    poolId: raw.poolId == null ? null : String(raw.poolId),
    roundLabel: String(raw.roundLabel ?? ''),
    homeTeamId: String(raw.homeTeamId ?? ''),
    awayTeamId: String(raw.awayTeamId ?? ''),
    homeName: String(raw.homeName ?? ''),
    awayName: String(raw.awayName ?? ''),
    pitchIndex: typeof raw.pitchIndex === 'number' ? raw.pitchIndex : 1,
    startsAt: toDate(raw.startsAt),
    endsAt: toDate(raw.endsAt),
    phase: raw.phase === 'knockout' ? 'knockout' : 'pool',
    home_score: typeof raw.home_score === 'number' ? raw.home_score : null,
    away_score: typeof raw.away_score === 'number' ? raw.away_score : null,
    status: (raw.status as ClubTournamentLiveFixture['status']) ?? 'scheduled',
    delay_min: typeof raw.delay_min === 'number' ? raw.delay_min : undefined,
  };
}

function mapEvent(id: string, data: Record<string, unknown>): ClubTournamentEvent {
  const fixturesRaw = Array.isArray(data.fixtures) ? data.fixtures : [];
  return {
    id,
    club_id: String(data.club_id ?? ''),
    created_by: String(data.created_by ?? ''),
    name: String(data.name ?? 'Tournoi'),
    category: String(data.category ?? ''),
    format: (data.format as ClubTournamentEvent['format']) ?? 'pools_only',
    public: data.public === true,
    status: (data.status as ClubTournamentEvent['status']) ?? 'draft',
    pools: (data.pools as ClubTournamentEvent['pools']) ?? [],
    teams: (data.teams as ClubTournamentEvent['teams']) ?? [],
    fixtures: fixturesRaw.map((f) => mapFixture(f as Record<string, unknown>)),
    partners: Array.isArray(data.partners)
      ? (data.partners as ClubTournamentEvent['partners'])
      : [],
    created_at: toDate(data.created_at),
    updated_at: toDate(data.updated_at),
  };
}

function serializeFixture(f: ClubTournamentLiveFixture) {
  return {
    ...f,
    startsAt: f.startsAt.toISOString(),
    endsAt: f.endsAt.toISOString(),
  };
}

export const clubTournamentsService = {
  async listForClub(clubId: string, max = 20): Promise<ClubTournamentEvent[]> {
    if (!isFirebaseConfigured() || !clubId) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const snap = await getDocs(
        query(
          collection(database, COL),
          where('club_id', '==', clubId),
          orderBy('created_at', 'desc'),
          limit(max),
        ),
      );
      return snap.docs.map((d) => mapEvent(d.id, d.data() as Record<string, unknown>));
    } catch {
      const snap = await getDocs(
        query(collection(database, COL), where('club_id', '==', clubId), limit(max)),
      );
      return snap.docs
        .map((d) => mapEvent(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    }
  },

  async getById(id: string): Promise<ClubTournamentEvent | null> {
    if (!isFirebaseConfigured() || !id) return null;
    const database = getDb();
    if (!database) return null;
    const snap = await getDoc(doc(database, COL, id));
    if (!snap.exists()) return null;
    return mapEvent(snap.id, snap.data() as Record<string, unknown>);
  },

  async createFromPlan(input: {
    club_id: string;
    created_by: string;
    plan: GeneratedTournamentPlan;
    makePublic?: boolean;
  }): Promise<ClubTournamentEvent> {
    const fixtures = planToLiveFixtures(input.plan);
    const local: ClubTournamentEvent = {
      id: `local_${Date.now()}`,
      club_id: input.club_id,
      created_by: input.created_by,
      name: input.plan.name,
      category: input.plan.category,
      format: input.plan.format,
      public: input.makePublic !== false,
      status: 'live',
      pools: input.plan.pools,
      teams: input.plan.teams,
      fixtures,
      partners: [],
      created_at: new Date(),
      updated_at: new Date(),
    };
    if (!isFirebaseConfigured()) return local;
    const database = getDb();
    if (!database) return local;
    const ref = await addDoc(collection(database, COL), {
      club_id: local.club_id,
      created_by: local.created_by,
      name: local.name,
      category: local.category,
      format: local.format,
      public: local.public,
      status: local.status,
      pools: local.pools,
      teams: local.teams,
      fixtures: fixtures.map(serializeFixture),
      partners: [],
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    return { ...local, id: ref.id };
  },

  async updateFixtures(
    id: string,
    fixtures: ClubTournamentLiveFixture[],
  ): Promise<void> {
    if (!isFirebaseConfigured()) return;
    const database = getDb();
    if (!database) return;
    await updateDoc(doc(database, COL, id), {
      fixtures: fixtures.map(serializeFixture),
      updated_at: serverTimestamp(),
    });
  },

  async setPublic(id: string, isPublic: boolean): Promise<void> {
    if (!isFirebaseConfigured()) return;
    const database = getDb();
    if (!database) return;
    await updateDoc(doc(database, COL, id), {
      public: isPublic,
      updated_at: serverTimestamp(),
    });
  },
};
