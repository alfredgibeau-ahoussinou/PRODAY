import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type { PlayerPulseEntry, UpsertPlayerPulseInput } from '../models/PlayerPulse';
import type { PlayerActivity } from '../models/PlayerActivity';
import { averagePulseRating } from '../utils/prodayMatchRating';

const COL = 'player_pulse';

function toDate(v: unknown): Date {
  if (v && typeof v === 'object' && 'toDate' in v) {
    return (v as { toDate: () => Date }).toDate();
  }
  return new Date();
}

function mapDoc(id: string, data: Record<string, unknown>): PlayerPulseEntry {
  return {
    uid: id,
    display_name: String(data.display_name ?? ''),
    city: data.city != null ? String(data.city) : undefined,
    level: data.level != null ? String(data.level) : undefined,
    category: data.category != null ? String(data.category) : undefined,
    club_id: data.club_id != null ? String(data.club_id) : undefined,
    pulse_avg: Number(data.pulse_avg ?? 0),
    matches_count: Number(data.matches_count ?? 0),
    goals: Number(data.goals ?? 0),
    assists: Number(data.assists ?? 0),
    motm_count: Number(data.motm_count ?? 0),
    updated_at: toDate(data.updated_at),
  };
}

function startOfIsoWeek(d = new Date()): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? 6 : day - 1;
  copy.setDate(copy.getDate() - diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export const playerPulseLeaderboardService = {
  async upsertFromActivities(
    profile: UpsertPlayerPulseInput & { activities: PlayerActivity[] }
  ): Promise<void> {
    const matches = profile.activities.filter((a) => a.type === 'match');
    const pulseAvg = averagePulseRating(profile.activities) ?? profile.pulse_avg;
    const goals = matches.reduce((s, a) => s + (a.goals ?? 0), 0);
    const assists = matches.reduce((s, a) => s + (a.assists ?? 0), 0);
    await this.upsert({
      ...profile,
      pulse_avg: pulseAvg,
      matches_count: matches.length,
      goals,
      assists,
      motm_count: profile.motm_count ?? 0,
    });
  },

  async upsert(input: UpsertPlayerPulseInput): Promise<void> {
    if (!isFirebaseConfigured()) return;
    const database = getDb();
    if (!database) return;
    await setDoc(
      doc(database, COL, input.uid),
      {
        display_name: input.display_name,
        city: input.city ?? null,
        level: input.level ?? null,
        category: input.category ?? null,
        club_id: input.club_id ?? null,
        pulse_avg: input.pulse_avg,
        matches_count: input.matches_count,
        goals: input.goals,
        assists: input.assists,
        motm_count: input.motm_count ?? 0,
        updated_at: serverTimestamp(),
      },
      { merge: true }
    );
  },

  async listTop(max = 25, filters?: { city?: string; level?: string }): Promise<PlayerPulseEntry[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const q = query(collection(database, COL), orderBy('pulse_avg', 'desc'), limit(80));
      const snap = await getDocs(q);
      let rows = snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>));
      if (filters?.city?.trim()) {
        const c = filters.city.trim().toLowerCase();
        rows = rows.filter((r) => (r.city ?? '').toLowerCase().includes(c));
      }
      if (filters?.level?.trim()) {
        const l = filters.level.trim().toLowerCase();
        rows = rows.filter((r) => (r.level ?? '').toLowerCase() === l);
      }
      return rows.slice(0, max);
    } catch (error) {
      console.error('[playerPulseLeaderboardService] listTop:', error);
      return [];
    }
  },

  /** Team of the Week — joueurs mis à jour depuis le début de semaine, tri cote. */
  async teamOfTheWeek(max = 11): Promise<PlayerPulseEntry[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    const weekStart = startOfIsoWeek();
    try {
      const q = query(
        collection(database, COL),
        where('updated_at', '>=', weekStart),
        orderBy('updated_at', 'desc'),
        limit(80)
      );
      const snap = await getDocs(q);
      const rows = snap.docs
        .map((d) => mapDoc(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.pulse_avg - a.pulse_avg || b.goals - a.goals);
      return rows.slice(0, max);
    } catch (error) {
      // Index composite peut manquer — fallback sur top global.
      console.warn('[playerPulseLeaderboardService] totw fallback:', error);
      return this.listTop(max);
    }
  },
};
