import {
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
  where,
  writeBatch,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import {
  competitionFromFirestore,
  competitionFixtureFromFirestore,
  competitionSeasonFromFirestore,
  competitionStandingsFromFirestore,
  competitionTeamFromFirestore,
  playerCompetitionStatsFromFirestore,
} from '../lib/firestoreMappers';
import type {
  AddCompetitionTeamInput,
  Competition,
  CompetitionFixture,
  CompetitionRules,
  CompetitionSeason,
  CompetitionStandingRow,
  CompetitionTeam,
  CreateCompetitionInput,
  CreateSeasonInput,
  PlayerCompetitionStats,
} from '../models/Competition';
import { DEFAULT_COMPETITION_RULES as DEFAULT_RULES } from '../models/Competition';
import {
  buildCompetitionSchedule,
  computeCompetitionStandings,
  isContestWindowOpen,
} from '../utils/competitionStandings';

const COL_COMP = 'competitions';
const COL_SEASONS = 'competition_seasons';
const COL_TEAMS = 'competition_teams';
const COL_FIXTURES = 'competition_fixtures';
const COL_STANDINGS = 'competition_standings';
const COL_PLAYER_STATS = 'player_competition_stats';
const COL_CLAIMS = 'competition_result_claims';

function requireDb() {
  if (!isFirebaseConfigured()) throw new Error('Firebase non configuré');
  const database = getDb();
  if (!database) throw new Error('Firebase non configuré');
  return database;
}

async function recomputeAndPersistStandings(seasonId: string): Promise<CompetitionStandingRow[]> {
  const database = requireDb();
  const season = await competitionsService.getSeason(seasonId);
  if (!season) throw new Error('Saison introuvable');

  const competition = await competitionsService.getCompetition(season.competition_id);
  const rules: CompetitionRules = competition?.rules ?? DEFAULT_RULES;

  const [teams, fixtures] = await Promise.all([
    competitionsService.listTeams(seasonId),
    competitionsService.listFixtures(seasonId),
  ]);

  const rows = computeCompetitionStandings(teams, fixtures, rules);
  const standingsRef = doc(database, COL_STANDINGS, seasonId);
  await setDoc(
    standingsRef,
    {
      season_id: seasonId,
      competition_id: season.competition_id,
      rows,
      updated_at: serverTimestamp(),
    },
    { merge: true },
  );
  return rows;
}

async function appendClaim(input: {
  fixture_id: string;
  season_id: string;
  kind: 'submit' | 'validate' | 'contest' | 'resolve_contest';
  actor_uid: string;
  home_score?: number | null;
  away_score?: number | null;
  note?: string | null;
}): Promise<void> {
  const database = requireDb();
  const ref = doc(collection(database, COL_CLAIMS));
  await setDoc(ref, {
    fixture_id: input.fixture_id,
    season_id: input.season_id,
    kind: input.kind,
    actor_uid: input.actor_uid,
    home_score: input.home_score ?? null,
    away_score: input.away_score ?? null,
    note: input.note ?? null,
    created_at: serverTimestamp(),
  });
}

export const competitionsService = {
  async listCompetitions(max = 40): Promise<Competition[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const snap = await getDocs(query(collection(database, COL_COMP), limit(max)));
      return snap.docs.map((d) => competitionFromFirestore(d.id, d.data() as Record<string, unknown>));
    } catch {
      return [];
    }
  },

  async getCompetition(id: string): Promise<Competition | null> {
    if (!isFirebaseConfigured()) return null;
    const database = getDb();
    if (!database) return null;
    const snap = await getDoc(doc(database, COL_COMP, id));
    if (!snap.exists()) return null;
    return competitionFromFirestore(snap.id, snap.data() as Record<string, unknown>);
  },

  async createCompetition(input: CreateCompetitionInput): Promise<string> {
    const database = requireDb();
    const ref = doc(collection(database, COL_COMP));
    const rules: CompetitionRules = { ...DEFAULT_RULES, ...input.rules };
    await setDoc(ref, {
      name: input.name.trim(),
      format: input.format ?? 'league',
      category: input.category?.trim() || null,
      season_label: input.season_label.trim(),
      organizer_uids: input.organizer_uids,
      club_ids: input.club_ids ?? [],
      rules,
      created_by: input.created_by,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    return ref.id;
  },

  async createSeason(input: CreateSeasonInput): Promise<string> {
    const database = requireDb();
    const competition = await this.getCompetition(input.competition_id);
    if (!competition) throw new Error('Compétition introuvable');

    const ref = doc(collection(database, COL_SEASONS));
    await setDoc(ref, {
      competition_id: input.competition_id,
      competition_name: competition.name,
      label: input.label.trim(),
      starts_at: input.starts_at,
      ends_at: input.ends_at ?? null,
      status: 'draft',
      organizer_uids: input.organizer_uids.length
        ? input.organizer_uids
        : competition.organizer_uids,
      external_provider: null,
      external_season_id: null,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    return ref.id;
  },

  async getSeason(id: string): Promise<CompetitionSeason | null> {
    if (!isFirebaseConfigured()) return null;
    const database = getDb();
    if (!database) return null;
    const snap = await getDoc(doc(database, COL_SEASONS, id));
    if (!snap.exists()) return null;
    return competitionSeasonFromFirestore(snap.id, snap.data() as Record<string, unknown>);
  },

  async listSeasons(competitionId?: string, max = 40): Promise<CompetitionSeason[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const q = competitionId
        ? query(
            collection(database, COL_SEASONS),
            where('competition_id', '==', competitionId),
            limit(max),
          )
        : query(collection(database, COL_SEASONS), orderBy('starts_at', 'desc'), limit(max));
      const snap = await getDocs(q);
      return snap.docs.map((d) =>
        competitionSeasonFromFirestore(d.id, d.data() as Record<string, unknown>),
      );
    } catch {
      const snap = await getDocs(collection(database, COL_SEASONS));
      return snap.docs
        .map((d) => competitionSeasonFromFirestore(d.id, d.data() as Record<string, unknown>))
        .filter((s) => !competitionId || s.competition_id === competitionId)
        .sort((a, b) => b.starts_at.getTime() - a.starts_at.getTime())
        .slice(0, max);
    }
  },

  async setSeasonStatus(
    seasonId: string,
    status: CompetitionSeason['status'],
  ): Promise<void> {
    const database = requireDb();
    await updateDoc(doc(database, COL_SEASONS, seasonId), {
      status,
      updated_at: serverTimestamp(),
    });
  },

  async addTeam(input: AddCompetitionTeamInput): Promise<string> {
    const database = requireDb();
    const season = await this.getSeason(input.season_id);
    if (!season) throw new Error('Saison introuvable');
    if (season.status === 'closed') throw new Error('Saison clôturée');

    const ref = doc(collection(database, COL_TEAMS));
    await setDoc(ref, {
      season_id: input.season_id,
      competition_id: season.competition_id,
      club_id: input.club_id,
      team_id: input.team_id ?? null,
      display_name: input.display_name.trim(),
      created_at: serverTimestamp(),
    });
    return ref.id;
  },

  async listTeams(seasonId: string): Promise<CompetitionTeam[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const q = query(
        collection(database, COL_TEAMS),
        where('season_id', '==', seasonId),
        limit(64),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) =>
        competitionTeamFromFirestore(d.id, d.data() as Record<string, unknown>),
      );
    } catch {
      return [];
    }
  },

  async generateSchedule(
    seasonId: string,
    mode: 'round_robin' | 'home_away' = 'home_away',
  ): Promise<number> {
    const database = requireDb();
    const season = await this.getSeason(seasonId);
    if (!season) throw new Error('Saison introuvable');
    const teams = await this.listTeams(seasonId);
    if (teams.length < 2) throw new Error('Au moins 2 équipes requises');

    const existing = await this.listFixtures(seasonId);
    if (existing.length > 0) throw new Error('Un calendrier existe déjà pour cette saison');

    const seeds = buildCompetitionSchedule(
      seasonId,
      season.competition_id,
      teams,
      mode,
      season.starts_at,
    );

    const batch = writeBatch(database);
    for (const seed of seeds) {
      const ref = doc(collection(database, COL_FIXTURES));
      batch.set(ref, {
        ...seed,
        kickoff_at: seed.kickoff_at,
        team_event_id: null,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
    }
    await batch.commit();
    await this.setSeasonStatus(seasonId, 'active');
    await recomputeAndPersistStandings(seasonId);
    return seeds.length;
  },

  async listFixtures(seasonId: string, max = 200): Promise<CompetitionFixture[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const q = query(
        collection(database, COL_FIXTURES),
        where('season_id', '==', seasonId),
        orderBy('kickoff_at', 'asc'),
        limit(max),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) =>
        competitionFixtureFromFirestore(d.id, d.data() as Record<string, unknown>),
      );
    } catch {
      const snap = await getDocs(
        query(collection(database, COL_FIXTURES), where('season_id', '==', seasonId), limit(max)),
      );
      return snap.docs
        .map((d) => competitionFixtureFromFirestore(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => a.kickoff_at.getTime() - b.kickoff_at.getTime());
    }
  },

  async listUpcomingFixtures(max = 40): Promise<CompetitionFixture[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const now = new Date();
      const q = query(
        collection(database, COL_FIXTURES),
        where('kickoff_at', '>=', now),
        orderBy('kickoff_at', 'asc'),
        limit(max),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) =>
        competitionFixtureFromFirestore(d.id, d.data() as Record<string, unknown>),
      );
    } catch {
      const snap = await getDocs(query(collection(database, COL_FIXTURES), limit(120)));
      const now = Date.now();
      return snap.docs
        .map((d) => competitionFixtureFromFirestore(d.id, d.data() as Record<string, unknown>))
        .filter((f) => f.kickoff_at.getTime() >= now - 3 * 24 * 60 * 60 * 1000)
        .sort((a, b) => a.kickoff_at.getTime() - b.kickoff_at.getTime())
        .slice(0, max);
    }
  },

  async getFixture(id: string): Promise<CompetitionFixture | null> {
    if (!isFirebaseConfigured()) return null;
    const database = getDb();
    if (!database) return null;
    const snap = await getDoc(doc(database, COL_FIXTURES, id));
    if (!snap.exists()) return null;
    return competitionFixtureFromFirestore(snap.id, snap.data() as Record<string, unknown>);
  },

  async submitResult(input: {
    fixture_id: string;
    actor_uid: string;
    home_score: number;
    away_score: number;
  }): Promise<void> {
    const database = requireDb();
    const fixture = await this.getFixture(input.fixture_id);
    if (!fixture) throw new Error('Match introuvable');
    if (fixture.source === 'external') {
      throw new Error('Les scores externes ne sont pas modifiables');
    }
    if (['validated', 'void'].includes(fixture.status)) {
      throw new Error('Résultat déjà validé');
    }
    if (fixture.status === 'contested') {
      throw new Error('Match contesté — résoudre d’abord le litige');
    }

    await updateDoc(doc(database, COL_FIXTURES, input.fixture_id), {
      home_score: Math.max(0, Math.round(input.home_score)),
      away_score: Math.max(0, Math.round(input.away_score)),
      status: 'awaiting_validation',
      updated_at: serverTimestamp(),
    });
    await appendClaim({
      fixture_id: input.fixture_id,
      season_id: fixture.season_id,
      kind: 'submit',
      actor_uid: input.actor_uid,
      home_score: input.home_score,
      away_score: input.away_score,
    });
  },

  async validateResult(input: {
    fixture_id: string;
    actor_uid: string;
    contest_hours?: number;
  }): Promise<void> {
    const database = requireDb();
    const fixture = await this.getFixture(input.fixture_id);
    if (!fixture) throw new Error('Match introuvable');
    if (fixture.home_score == null || fixture.away_score == null) {
      throw new Error('Score manquant');
    }
    if (!['awaiting_validation', 'scheduled', 'live'].includes(fixture.status)) {
      throw new Error('Ce match ne peut pas être validé');
    }

    const hours = input.contest_hours ?? DEFAULT_RULES.contest_hours;
    const now = new Date();
    const deadline = new Date(now.getTime() + hours * 60 * 60 * 1000);

    await updateDoc(doc(database, COL_FIXTURES, input.fixture_id), {
      status: 'validated',
      validated_at: now,
      validated_by: input.actor_uid,
      contest_deadline_at: deadline,
      contested_at: null,
      contested_by: null,
      contest_reason: null,
      updated_at: serverTimestamp(),
    });
    await appendClaim({
      fixture_id: input.fixture_id,
      season_id: fixture.season_id,
      kind: 'validate',
      actor_uid: input.actor_uid,
      home_score: fixture.home_score,
      away_score: fixture.away_score,
    });
    await recomputeAndPersistStandings(fixture.season_id);
    try {
      const { onFixtureValidatedMatchdayPipeline } = await import(
        './competitionMatchday.service'
      );
      await onFixtureValidatedMatchdayPipeline(input.fixture_id);
    } catch (err) {
      console.warn('[competitions] matchday pipeline:', err);
    }
  },

  async contestResult(input: {
    fixture_id: string;
    actor_uid: string;
    reason?: string;
  }): Promise<void> {
    const database = requireDb();
    const fixture = await this.getFixture(input.fixture_id);
    if (!fixture) throw new Error('Match introuvable');
    if (!isContestWindowOpen(fixture)) {
      throw new Error('Délai de contestation expiré');
    }

    await updateDoc(doc(database, COL_FIXTURES, input.fixture_id), {
      status: 'contested',
      contested_at: new Date(),
      contested_by: input.actor_uid,
      contest_reason: input.reason?.trim() || null,
      updated_at: serverTimestamp(),
    });
    await appendClaim({
      fixture_id: input.fixture_id,
      season_id: fixture.season_id,
      kind: 'contest',
      actor_uid: input.actor_uid,
      note: input.reason,
    });
    // Freeze: recompute excludes contested fixtures
    await recomputeAndPersistStandings(fixture.season_id);
  },

  async resolveContest(input: {
    fixture_id: string;
    actor_uid: string;
    home_score: number;
    away_score: number;
    void_match?: boolean;
  }): Promise<void> {
    const database = requireDb();
    const fixture = await this.getFixture(input.fixture_id);
    if (!fixture) throw new Error('Match introuvable');
    if (fixture.status !== 'contested') throw new Error('Match non contesté');

    const hours = DEFAULT_RULES.contest_hours;
    const now = new Date();
    if (input.void_match) {
      await updateDoc(doc(database, COL_FIXTURES, input.fixture_id), {
        status: 'void',
        home_score: null,
        away_score: null,
        contested_at: null,
        contested_by: null,
        contest_reason: null,
        updated_at: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(database, COL_FIXTURES, input.fixture_id), {
        status: 'validated',
        home_score: Math.max(0, Math.round(input.home_score)),
        away_score: Math.max(0, Math.round(input.away_score)),
        validated_at: now,
        validated_by: input.actor_uid,
        contest_deadline_at: new Date(now.getTime() + hours * 60 * 60 * 1000),
        contested_at: null,
        contested_by: null,
        contest_reason: null,
        updated_at: serverTimestamp(),
      });
    }
    await appendClaim({
      fixture_id: input.fixture_id,
      season_id: fixture.season_id,
      kind: 'resolve_contest',
      actor_uid: input.actor_uid,
      home_score: input.void_match ? null : input.home_score,
      away_score: input.void_match ? null : input.away_score,
      note: input.void_match ? 'void' : 'resolved',
    });
    await recomputeAndPersistStandings(fixture.season_id);
  },

  async getStandings(seasonId: string): Promise<CompetitionStandingRow[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    const snap = await getDoc(doc(database, COL_STANDINGS, seasonId));
    if (!snap.exists()) {
      try {
        return await recomputeAndPersistStandings(seasonId);
      } catch {
        return [];
      }
    }
    return competitionStandingsFromFirestore(snap.id, snap.data() as Record<string, unknown>).rows;
  },

  async recomputeStandings(seasonId: string): Promise<CompetitionStandingRow[]> {
    return recomputeAndPersistStandings(seasonId);
  },

  async linkTeamEvent(fixtureId: string, teamEventId: string): Promise<void> {
    const database = requireDb();
    await updateDoc(doc(database, COL_FIXTURES, fixtureId), {
      team_event_id: teamEventId,
      updated_at: serverTimestamp(),
    });
  },

  async updateFixtureExtras(
    fixtureId: string,
    patch: {
      auto_potm_uid?: string | null;
      auto_potm_name?: string | null;
      ai_summary?: string | null;
      highlight_urls?: string[];
      status?: CompetitionFixture['status'];
    },
  ): Promise<void> {
    const database = requireDb();
    await updateDoc(doc(database, COL_FIXTURES, fixtureId), {
      ...patch,
      updated_at: serverTimestamp(),
    });
  },

  async upsertPlayerStats(
    seasonId: string,
    competitionId: string,
    stats: Omit<PlayerCompetitionStats, 'id' | 'season_id' | 'competition_id' | 'updated_at'>[],
  ): Promise<void> {
    const database = requireDb();
    const batch = writeBatch(database);
    for (const row of stats) {
      const id = `${seasonId}_${row.uid}`;
      batch.set(
        doc(database, COL_PLAYER_STATS, id),
        {
          season_id: seasonId,
          competition_id: competitionId,
          ...row,
          updated_at: serverTimestamp(),
        },
        { merge: true },
      );
    }
    await batch.commit();
  },

  async listPlayerStats(seasonId: string, max = 100): Promise<PlayerCompetitionStats[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const q = query(
        collection(database, COL_PLAYER_STATS),
        where('season_id', '==', seasonId),
        limit(max),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) =>
        playerCompetitionStatsFromFirestore(d.id, d.data() as Record<string, unknown>),
      );
    } catch {
      return [];
    }
  },

  /** Upsert external mirrored fixture (source: external). */
  async upsertExternalFixture(
    data: Omit<CompetitionFixture, 'id' | 'created_at' | 'updated_at'> & {
      id?: string;
    },
  ): Promise<string> {
    const database = requireDb();
    const id =
      data.id ??
      (data.external_fixture_id
        ? `ext_${data.external_fixture_id}`
        : doc(collection(database, COL_FIXTURES)).id);
    await setDoc(
      doc(database, COL_FIXTURES, id),
      {
        ...data,
        source: 'external',
        updated_at: serverTimestamp(),
        created_at: serverTimestamp(),
      },
      { merge: true },
    );
    return id;
  },
};
