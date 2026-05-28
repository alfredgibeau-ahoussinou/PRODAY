import {
  collection,
  doc,
  getDoc,
  query,
  setDoc,
  where,
  getCountFromServer,
  serverTimestamp,
} from 'firebase/firestore';
import { getDb, getFirebaseAuth } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';

export interface RecruitmentStats {
  players: number;
  coaches: number;
  agents: number;
  clubs: number;
  recruitment_posts_open: number;
}

const EMPTY_STATS: RecruitmentStats = {
  players: 0,
  coaches: 0,
  agents: 0,
  clubs: 0,
  recruitment_posts_open: 0,
};

const PLATFORM_STATS_COLLECTION = 'platform_stats';
const PLATFORM_STATS_ID = 'recruitment';

function mapPlatformStats(data: Record<string, unknown>): RecruitmentStats {
  return {
    players: Number(data.players ?? 0),
    coaches: Number(data.coaches ?? 0),
    agents: Number(data.agents ?? 0),
    clubs: Number(data.clubs ?? 0),
    recruitment_posts_open: Number(data.recruitment_posts_open ?? 0),
  };
}

async function aggregateRecruitmentStats(): Promise<RecruitmentStats> {
  const database = getDb();
  if (!database) return { ...EMPTY_STATS };

  const usersRef = collection(database, 'users');
  const clubsRef = collection(database, 'clubs');
  const postsRef = collection(database, 'recruitment_posts');

  const [playersSnap, coachesSnap, agentsSnap, clubsSnap, postsSnap] =
    await Promise.all([
      getCountFromServer(
        query(usersRef, where('role', '==', 'player'), where('is_active', '==', true))
      ),
      getCountFromServer(
        query(usersRef, where('role', '==', 'coach'), where('is_active', '==', true))
      ),
      getCountFromServer(
        query(usersRef, where('role', '==', 'agent'), where('is_active', '==', true))
      ),
      getCountFromServer(clubsRef),
      getCountFromServer(query(postsRef, where('status', '==', 'OPEN'))),
    ]);

  return {
    players: playersSnap.data().count,
    coaches: coachesSnap.data().count,
    agents: agentsSnap.data().count,
    clubs: clubsSnap.data().count,
    recruitment_posts_open: postsSnap.data().count,
  };
}

/** Comptages Firestore — document public `platform_stats/recruitment` ou agrégation si connecté. */
export const statsService = {
  async getRecruitmentStats(): Promise<RecruitmentStats> {
    if (!isFirebaseConfigured()) {
      return { ...EMPTY_STATS };
    }

    try {
      const database = getDb();
      if (!database) return { ...EMPTY_STATS };

      const publicSnap = await getDoc(
        doc(database, PLATFORM_STATS_COLLECTION, PLATFORM_STATS_ID)
      );
      if (publicSnap.exists()) {
        return mapPlatformStats(publicSnap.data() as Record<string, unknown>);
      }

      const auth = getFirebaseAuth();
      if (!auth?.currentUser) {
        return { ...EMPTY_STATS };
      }

      return await aggregateRecruitmentStats();
    } catch (error) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code: string }).code)
          : '';
      if (code !== 'permission-denied') {
        console.error('[statsService] Erreur lecture stats:', error);
      }
      return { ...EMPTY_STATS };
    }
  },

  /** Met à jour le document public (admin / script). */
  async publishRecruitmentStats(stats: RecruitmentStats): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    await setDoc(
      doc(database, PLATFORM_STATS_COLLECTION, PLATFORM_STATS_ID),
      {
        ...stats,
        updated_at: serverTimestamp(),
      },
      { merge: true }
    );
  },

  /** Recalcule depuis Firestore et publie (nécessite droits lecture users). */
  async refreshAndPublishRecruitmentStats(): Promise<RecruitmentStats> {
    const stats = await aggregateRecruitmentStats();
    await this.publishRecruitmentStats(stats);
    return stats;
  },
};

/** Affichage localisé : "0 profil", "1 profil", "42 profils" */
export function formatCount(count: number, singular: string, plural?: string): string {
  const pl = plural ?? `${singular}s`;
  if (count === 0) return `0 ${singular}`;
  if (count === 1) return `1 ${singular}`;
  return `${count.toLocaleString('fr-FR')} ${pl}`;
}
