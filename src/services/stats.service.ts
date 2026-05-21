import {
  collection,
  query,
  where,
  getCountFromServer,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
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

/** Comptages réels Firestore (pas de chiffres fictifs). */
export const statsService = {
  async getRecruitmentStats(): Promise<RecruitmentStats> {
    if (!isFirebaseConfigured()) {
      console.warn('[statsService] Firebase non configuré — stats à 0');
      return { ...EMPTY_STATS };
    }

    try {
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
          getCountFromServer(
            query(postsRef, where('status', '==', 'OPEN'))
          ),
        ]);

      return {
        players: playersSnap.data().count,
        coaches: coachesSnap.data().count,
        agents: agentsSnap.data().count,
        clubs: clubsSnap.data().count,
        recruitment_posts_open: postsSnap.data().count,
      };
    } catch (error) {
      console.error('[statsService] Erreur lecture stats:', error);
      return { ...EMPTY_STATS };
    }
  },
};

/** Affichage localisé : "0 profil", "1 profil", "42 profils" */
export function formatCount(count: number, singular: string, plural?: string): string {
  const pl = plural ?? `${singular}s`;
  if (count === 0) return `0 ${singular}`;
  if (count === 1) return `1 ${singular}`;
  return `${count.toLocaleString('fr-FR')} ${pl}`;
}
