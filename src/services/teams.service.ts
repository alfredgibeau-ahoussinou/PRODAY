import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  limit,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type { CreateTeamInput, Team } from '../models/Team';
import { teamFromFirestore } from '../lib/firestoreMappers';

const COL = 'teams';
const DEFAULT_TEAM_NAME = 'Effectif général';

export const teamsService = {
  async getById(teamId: string): Promise<Team | null> {
    if (!isFirebaseConfigured()) return null;
    const database = getDb();
    if (!database) return null;
    const snap = await getDoc(doc(database, COL, teamId));
    if (!snap.exists()) return null;
    return teamFromFirestore(snap.id, snap.data() as Record<string, unknown>);
  },

  async listByClubId(clubId: string): Promise<Team[]> {
    if (!isFirebaseConfigured() || !clubId) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const snap = await getDocs(
        query(collection(database, COL), where('club_id', '==', clubId), limit(40)),
      );
      return snap.docs.map((d) => teamFromFirestore(d.id, d.data() as Record<string, unknown>));
    } catch {
      return [];
    }
  },

  async getDefaultTeam(clubId: string): Promise<Team | null> {
    const teams = await this.listByClubId(clubId);
    return teams.find((t) => t.is_default) ?? teams[0] ?? null;
  },

  /** Crée l'équipe par défaut du club si absente. */
  async ensureDefaultTeam(clubId: string, clubName?: string): Promise<Team> {
    const existing = await this.getDefaultTeam(clubId);
    if (existing) return existing;
    return this.create({
      club_id: clubId,
      name: clubName ? `${clubName}. ${DEFAULT_TEAM_NAME}` : DEFAULT_TEAM_NAME,
      is_default: true,
      gender_scope: 'unspecified',
    });
  },

  async create(input: CreateTeamInput): Promise<Team> {
    if (!isFirebaseConfigured()) throw new Error('Firebase non configuré');
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const ref = doc(collection(database, COL));
    const payload = {
      club_id: input.club_id,
      name: input.name.trim(),
      category: input.category?.trim() || null,
      gender_scope: input.gender_scope ?? 'unspecified',
      coach_uids: input.coach_uids ?? [],
      season_id: input.season_id ?? null,
      fff_league_id: input.fff_league_id ?? null,
      fff_team_id: input.fff_team_id ?? null,
      fff_competition_id: input.fff_competition_id ?? null,
      fff_district_code: input.fff_district_code ?? null,
      fff_division_label: input.fff_division_label ?? null,
      fff_group_label: input.fff_group_label ?? null,
      fff_season: input.fff_season ?? null,
      is_default: input.is_default ?? false,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };
    await setDoc(ref, payload);
    const snap = await getDoc(ref);
    return teamFromFirestore(snap.id, snap.data() as Record<string, unknown>);
  },

  async assignCoach(teamId: string, coachUid: string): Promise<void> {
    if (!isFirebaseConfigured()) throw new Error('Firebase non configuré');
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const team = await this.getById(teamId);
    if (!team) throw new Error('Équipe introuvable');
    const coach_uids = team.coach_uids.includes(coachUid)
      ? team.coach_uids
      : [...team.coach_uids, coachUid];
    await updateDoc(doc(database, COL, teamId), {
      coach_uids,
      updated_at: serverTimestamp(),
    });
  },

  /** Retire un coach de l’équipe (sans supprimer le compte). */
  async removeCoach(teamId: string, coachUid: string): Promise<void> {
    if (!isFirebaseConfigured()) throw new Error('Firebase non configuré');
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const team = await this.getById(teamId);
    if (!team) throw new Error('Équipe introuvable');
    const coach_uids = team.coach_uids.filter((uid) => uid !== coachUid);
    await updateDoc(doc(database, COL, teamId), {
      coach_uids,
      updated_at: serverTimestamp(),
    });
  },
};
