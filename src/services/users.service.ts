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
import { sanitizePublicUser } from '../utils/sanitizePublicUser';
import { resolveContactViewerRelation } from '../utils/contactPrivacyVisibility';
import { filterRealUsers } from '../utils/realUserFilter';

const LIST_LIMIT = 50;
const POPULAR_LIMIT = 5;
/** Plafond de la lecture bornée à un club (aligné sur la limite de requête des règles). */
const CLUB_MEMBERS_LIMIT = 50;

export type StaffType = 'coach' | 'agent';

export type PublicProfileViewerContext = {
  viewerUid?: string | null;
  viewerRole?: UserRole | null;
  /** Favori / connexion mutuelle — audience `connections`. */
  isConnection?: boolean;
};

function matchesSearch(user: User, q: string): boolean {
  if (!q) return true;
  const lower = q.toLowerCase();
  const p = user.profile;
  return (
    user.display_name.toLowerCase().includes(lower) ||
    (p.position?.toLowerCase().includes(lower) ?? false) ||
    (p.job_title?.toLowerCase().includes(lower) ?? false) ||
    (p.medical_specialty?.toLowerCase().includes(lower) ?? false) ||
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

  /**
   * Profil public : données parentales retirées ; contacts filtrés selon
   * `contact_privacy` et la relation du viewer (stranger par défaut).
   */
  async getPublicById(
    uid: string,
    viewer?: PublicProfileViewerContext,
  ): Promise<User | null> {
    const user = await this.getById(uid);
    if (!user) return null;
    const viewerRelation = resolveContactViewerRelation({
      targetUid: uid,
      viewerUid: viewer?.viewerUid,
      viewerRole: viewer?.viewerRole,
      isConnection: viewer?.isConnection,
    });
    return sanitizePublicUser(user, { viewerRelation });
  },

  async listPhysios(search = ''): Promise<User[]> {
    return this.listByRole('physio', search);
  },

  async listByRole(role: UserRole, search = ''): Promise<User[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    const mapDocs = (snap: Awaited<ReturnType<typeof getDocs>>) => {
      const users = snap.docs.map((d) =>
        sanitizePublicUser(userFromFirestore(d.id, d.data() as Record<string, unknown>))
      );
      return filterRealUsers(users)
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
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code: string }).code)
          : '';
      const isIndexError = code === 'failed-precondition';
      if (isIndexError) {
        console.warn(`[usersService] Index Firestore manquant pour ${role}, requête simplifiée`);
      }
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

  /**
   * Personnes d'un club — requête **bornée au club** (`profile.club_id`).
   *
   * CA-12 : la recherche de personnes ne doit jamais lire l'annuaire global
   * puis filtrer côté client. Ici la requête elle-même porte la contrainte de
   * club ; en cas d'index ou de règles indisponibles, on renvoie une liste vide
   * plutôt que d'élargir la lecture.
   */
  async listPlayersInClub(clubId: string, search = ''): Promise<User[]> {
    if (!clubId) return [];
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const q = query(
        collection(database, 'users'),
        where('profile.club_id', '==', clubId),
        limit(CLUB_MEMBERS_LIMIT),
      );
      const users = (await getDocs(q)).docs
        .map((d) =>
          sanitizePublicUser(userFromFirestore(d.id, d.data() as Record<string, unknown>)),
        )
        // Double vérification : seuls les profils rattachés à ce club remontent.
        .filter((u) => u.profile.club_id === clubId)
        // Un compte désactivé n'est pas un membre du club (parité avec listByRole).
        .filter((u) => u.is_active !== false);
      return filterRealUsers(users).filter((u) => matchesSearch(u, search.trim()));
    } catch (error) {
      console.warn('[usersService] listPlayersInClub:', error);
      return [];
    }
  },

  /** Membres liés à un club (convocations) — memberships actifs en priorité. */
  async listMembersByClubId(clubId: string): Promise<User[]> {
    if (!clubId) return [];
    try {
      const database = getDb();
      if (database && isFirebaseConfigured()) {
        const snap = await getDocs(
          query(
            collection(database, 'memberships'),
            where('club_id', '==', clubId),
            where('status', '==', 'active'),
            limit(200),
          ),
        );
        const uniqueUids = Array.from(
          new Set(
            snap.docs
              .map((d) => (d.data() as { player_uid?: string }).player_uid)
              .filter((uid): uid is string => Boolean(uid)),
          ),
        );
        if (uniqueUids.length > 0) {
          const members = (
            await Promise.all(uniqueUids.map((uid) => this.getPublicById(uid)))
          ).filter((u): u is User => Boolean(u));
          return members;
        }
      }
    } catch (error) {
      console.warn('[usersService] listMembersByClubId fallback club_id:', error);
    }

    // Fallback legacy: profils directement rattachés au club (zéro membership actif).
    // CA-12 : requête bornée au club, jamais une lecture globale filtrée après coup.
    return this.listPlayersInClub(clubId);
  },

  isNewProfile,
};
