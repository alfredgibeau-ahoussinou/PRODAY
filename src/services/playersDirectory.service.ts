import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import { userFromFirestore } from '../lib/firestoreMappers';
import type { User } from '../models/User';
import { filterRealUsers } from '../utils/realUserFilter';
import { sanitizePublicUser } from '../utils/sanitizePublicUser';
import { distanceBetween } from '../utils/geoLocation';
import type { GeoPoint } from '../models/User';
import type { RecruiterPlayerLevelFilter } from '../models/PlayerLevel';
import { playerLevelMatchesFilter, resolvePlayerLevel } from '../utils/playerLevelBadge';

const PAGE_SIZE = 25;

export type PlayersDirectoryCursor = QueryDocumentSnapshot | null;

export type PlayersDirectoryQuery = {
  search?: string;
  city?: string;
  radiusKm?: number;
  viewerLocation?: GeoPoint | null;
  /** Filtre badge Pôle Joueur (recruteurs). */
  playerBadge?: RecruiterPlayerLevelFilter;
  cursor?: PlayersDirectoryCursor;
  pageSize?: number;
};

export type PlayersDirectoryPage = {
  users: User[];
  cursor: PlayersDirectoryCursor;
  hasMore: boolean;
};

function matchesSearch(user: User, q: string): boolean {
  if (!q) return true;
  const lower = q.toLowerCase();
  const p = user.profile;
  return (
    user.display_name.toLowerCase().includes(lower) ||
    (p.position?.toLowerCase().includes(lower) ?? false) ||
    (user.city?.toLowerCase().includes(lower) ?? false) ||
    (p.level?.toLowerCase().includes(lower) ?? false)
  );
}

function matchesCity(user: User, city: string): boolean {
  if (!city.trim()) return true;
  const norm = city.trim().toLowerCase();
  return (user.city ?? '').toLowerCase().includes(norm);
}

function matchesRadius(user: User, viewerLocation: GeoPoint, radiusKm: number): boolean {
  if (!user.location) return false;
  const km = distanceBetween(viewerLocation, user.location);
  return km != null && km <= radiusKm;
}

export const playersDirectoryService = {
  pageSize: PAGE_SIZE,

  async fetchPage(options: PlayersDirectoryQuery = {}): Promise<PlayersDirectoryPage> {
    if (!isFirebaseConfigured()) {
      return { users: [], cursor: null, hasMore: false };
    }
    const database = getDb();
    if (!database) return { users: [], cursor: null, hasMore: false };

    const pageSize = options.pageSize ?? PAGE_SIZE;
    const base = [
      where('role', '==', 'player'),
      where('is_active', '==', true),
      orderBy('created_at', 'desc'),
    ];

    const q = options.cursor
      ? query(collection(database, 'users'), ...base, startAfter(options.cursor), limit(pageSize))
      : query(collection(database, 'users'), ...base, limit(pageSize));

    try {
      const snap = await getDocs(q);
      let users = filterRealUsers(
        snap.docs.map((d) =>
          sanitizePublicUser(userFromFirestore(d.id, d.data() as Record<string, unknown>)),
        ),
      );

      if (options.search?.trim()) {
        users = users.filter((u) => matchesSearch(u, options.search!.trim()));
      }
      if (options.city?.trim()) {
        users = users.filter((u) => matchesCity(u, options.city!));
      }
      if (options.radiusKm && options.viewerLocation) {
        users = users.filter((u) => matchesRadius(u, options.viewerLocation!, options.radiusKm!));
      }
      if (options.playerBadge && options.playerBadge !== 'all') {
        users = users.filter((u) =>
          playerLevelMatchesFilter(resolvePlayerLevel(u), options.playerBadge!),
        );
      }

      const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
      return {
        users,
        cursor: lastDoc,
        hasMore: snap.docs.length >= pageSize,
      };
    } catch (error) {
      console.error('[playersDirectoryService] fetchPage:', error);
      return { users: [], cursor: null, hasMore: false };
    }
  },
};
