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
  where,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type {
  CoachSeasonObjective,
  CreateCoachSeasonObjectiveInput,
} from '../models/CoachSeasonObjective';

const COL = 'coach_season_objectives';

function toDate(v: unknown): Date {
  if (v instanceof Date) return v;
  if (v && typeof v === 'object' && 'toDate' in v) {
    return (v as { toDate: () => Date }).toDate();
  }
  return new Date(0);
}

function mapRow(id: string, data: Record<string, unknown>): CoachSeasonObjective {
  return {
    id,
    club_id: String(data.club_id ?? ''),
    team_id: data.team_id ? String(data.team_id) : undefined,
    scope: data.scope === 'player' ? 'player' : 'team',
    player_uid: data.player_uid ? String(data.player_uid) : undefined,
    player_name: data.player_name ? String(data.player_name) : undefined,
    title: String(data.title ?? ''),
    description: data.description ? String(data.description) : undefined,
    progress: Math.min(100, Math.max(0, Number(data.progress ?? 0))),
    target_label: data.target_label ? String(data.target_label) : undefined,
    season_label: data.season_label ? String(data.season_label) : undefined,
    created_by: String(data.created_by ?? ''),
    created_at: toDate(data.created_at),
    updated_at: toDate(data.updated_at),
  };
}

export const coachObjectivesService = {
  async listForClub(clubId: string, max = 30): Promise<CoachSeasonObjective[]> {
    if (!isFirebaseConfigured() || !clubId) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const snap = await getDocs(
        query(
          collection(database, COL),
          where('club_id', '==', clubId),
          orderBy('updated_at', 'desc'),
          limit(max),
        ),
      );
      return snap.docs.map((d) => mapRow(d.id, d.data() as Record<string, unknown>));
    } catch {
      const snap = await getDocs(
        query(collection(database, COL), where('club_id', '==', clubId), limit(max)),
      );
      return snap.docs.map((d) => mapRow(d.id, d.data() as Record<string, unknown>));
    }
  },

  async listForPlayer(playerUid: string, max = 20): Promise<CoachSeasonObjective[]> {
    if (!isFirebaseConfigured() || !playerUid) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const snap = await getDocs(
        query(
          collection(database, COL),
          where('player_uid', '==', playerUid),
          orderBy('updated_at', 'desc'),
          limit(max),
        ),
      );
      return snap.docs.map((d) => mapRow(d.id, d.data() as Record<string, unknown>));
    } catch {
      const snap = await getDocs(
        query(collection(database, COL), where('player_uid', '==', playerUid), limit(max)),
      );
      return snap.docs
        .map((d) => mapRow(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime());
    }
  },

  async listTeamObjectives(clubId: string, teamId?: string, max = 30): Promise<CoachSeasonObjective[]> {
    if (!isFirebaseConfigured() || !clubId) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const constraints = [
        where('club_id', '==', clubId),
        where('scope', '==', 'team'),
      ];
      if (teamId) {
        constraints.push(where('team_id', '==', teamId));
      }
      const snap = await getDocs(
        query(
          collection(database, COL),
          ...constraints,
          orderBy('updated_at', 'desc'),
          limit(max),
        ),
      );
      return snap.docs.map((d) => mapRow(d.id, d.data() as Record<string, unknown>));
    } catch {
      const all = await this.listForClub(clubId, max);
      return all.filter((o) => o.scope === 'team' && (!teamId || o.team_id === teamId));
    }
  },

  async create(createdBy: string, input: CreateCoachSeasonObjectiveInput): Promise<string> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    if (!input.title.trim()) throw new Error('Indiquez un titre d’objectif.');
    const ref = await addDoc(collection(database, COL), {
      club_id: input.club_id,
      team_id: input.team_id ?? null,
      scope: input.scope,
      player_uid: input.player_uid ?? null,
      player_name: input.player_name ?? null,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      progress: Math.min(100, Math.max(0, input.progress ?? 0)),
      target_label: input.target_label?.trim() || null,
      season_label: input.season_label?.trim() || null,
      created_by: createdBy,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    return ref.id;
  },

  async setProgress(id: string, progress: number): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await updateDoc(doc(database, COL, id), {
      progress: Math.min(100, Math.max(0, progress)),
      updated_at: serverTimestamp(),
    });
  },
};

export function isObjectiveVisibleToUser(
  objective: CoachSeasonObjective,
  viewer: { uid?: string; role?: string },
): boolean {
  if (!viewer.role) return false;
  if (viewer.role === 'coach' || viewer.role === 'club' || viewer.role === 'admin') {
    return true;
  }
  if (objective.scope === 'team') {
    return true;
  }
  if (viewer.role === 'player') {
    return objective.player_uid === viewer.uid;
  }
  if (viewer.role === 'parent') {
    return true;
  }
  return false;
}

export function filterObjectivesForViewer(
  objectives: CoachSeasonObjective[],
  viewer: { uid?: string; role?: string },
): CoachSeasonObjective[] {
  return objectives.filter((item) => isObjectiveVisibleToUser(item, viewer));
}
