import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import { userFromFirestore } from '../lib/firestoreMappers';
import type { User, UserRole } from '../models/User';

const LIST_LIMIT = 50;
const POPULAR_LIMIT = 5;

export type StaffType = 'coach' | 'agent';

function matchesSearch(user: User, q: string): boolean {
  if (!q) return true;
  const lower = q.toLowerCase();
  const p = user.profile;
  return (
    user.display_name.toLowerCase().includes(lower) ||
    (p.position?.toLowerCase().includes(lower) ?? false) ||
    (p.job_title?.toLowerCase().includes(lower) ?? false) ||
    (user.city?.toLowerCase().includes(lower) ?? false) ||
    (p.level?.toLowerCase().includes(lower) ?? false)
  );
}

function isNewProfile(user: User, days = 7): boolean {
  const ms = Date.now() - user.created_at.getTime();
  return ms < days * 24 * 60 * 60 * 1000;
}

export const usersService = {
  async getById(uid: string): Promise<User | null> {
    if (!isFirebaseConfigured()) return null;
    const database = getDb();
    if (!database) return null;

    const snap = await getDoc(doc(database, 'users', uid));
    if (!snap.exists()) return null;
    return userFromFirestore(snap.id, snap.data() as Record<string, unknown>);
  },

  async listByRole(role: UserRole, search = ''): Promise<User[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    const mapDocs = (snap: Awaited<ReturnType<typeof getDocs>>) => {
      const users = snap.docs.map((d) =>
        userFromFirestore(d.id, d.data() as Record<string, unknown>)
      );
      return users
        .filter((u) => matchesSearch(u, search.trim()))
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    };

    try {
      const q = query(
        collection(database, 'users'),
        where('role', '==', role),
        where('is_active', '==', true),
        orderBy('created_at', 'desc'),
        limit(LIST_LIMIT)
      );
      return mapDocs(await getDocs(q));
    } catch (error) {
      console.warn(`[usersService] Index Firestore manquant pour ${role}, requête simplifiée`);
      try {
        const qFallback = query(
          collection(database, 'users'),
          where('role', '==', role),
          where('is_active', '==', true),
          limit(LIST_LIMIT)
        );
        return mapDocs(await getDocs(qFallback));
      } catch (fallbackError) {
        console.error(`[usersService] listByRole(${role}):`, fallbackError);
        return [];
      }
    }
  },

  async listPlayers(search = ''): Promise<User[]> {
    return this.listByRole('player', search);
  },

  async listStaff(type: StaffType, search = ''): Promise<User[]> {
    return this.listByRole(type, search);
  },

  /** Profils coach/agent les mieux notés (données réelles). */
  async listPopularStaff(type: StaffType): Promise<User[]> {
    const all = await this.listStaff(type);
    return [...all]
      .sort((a, b) => (b.profile.rating ?? 0) - (a.profile.rating ?? 0))
      .slice(0, POPULAR_LIMIT);
  },

  /** Joueurs récents inscrits. */
  async listRecentPlayers(): Promise<User[]> {
    const players = await this.listPlayers();
    return players.slice(0, POPULAR_LIMIT);
  },

  isNewProfile,
};
