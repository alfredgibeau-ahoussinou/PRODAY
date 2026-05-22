import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type { Club } from '../models/Club';
import type { GeoPoint } from '../models/User';

function clubFromFirestore(id: string, data: Record<string, unknown>): Club {
  const loc = data.location as { latitude?: number; longitude?: number } | undefined;
  return {
    id,
    name: String(data.name ?? ''),
    city: String(data.city ?? ''),
    department: data.department as string | undefined,
    location: {
      latitude: loc?.latitude ?? 0,
      longitude: loc?.longitude ?? 0,
    },
    logo_url: data.logo_url as string | undefined,
    verified: Boolean(data.verified),
    categories: (data.categories as string[]) ?? [],
    sponsor_ids: (data.sponsor_ids as string[]) ?? [],
    owner_uid: String(data.owner_uid ?? ''),
    created_at: new Date(),
  };
}

export interface CreateClubInput {
  name: string;
  city: string;
  department?: string;
  categories: string[];
  owner_uid: string;
  location?: GeoPoint;
}

export const clubsService = {
  async list(max = 50): Promise<Club[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    const snap = await getDocs(query(collection(database, 'clubs'), limit(max)));
    return snap.docs.map((d) => clubFromFirestore(d.id, d.data() as Record<string, unknown>));
  },

  async getById(clubId: string): Promise<Club | null> {
    if (!isFirebaseConfigured()) return null;
    const database = getDb();
    if (!database) return null;
    const snap = await getDoc(doc(database, 'clubs', clubId));
    if (!snap.exists()) return null;
    return clubFromFirestore(snap.id, snap.data() as Record<string, unknown>);
  },

  async getByOwner(ownerUid: string): Promise<Club | null> {
    if (!isFirebaseConfigured()) return null;
    const database = getDb();
    if (!database) return null;
    try {
      const q = query(
        collection(database, 'clubs'),
        where('owner_uid', '==', ownerUid),
        limit(1)
      );
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const d = snap.docs[0];
      return clubFromFirestore(d.id, d.data() as Record<string, unknown>);
    } catch {
      const all = await this.list();
      return all.find((c) => c.owner_uid === ownerUid) ?? null;
    }
  },

  async searchByName(term: string): Promise<Club[]> {
    const q = term.trim().toLowerCase();
    if (!q) return this.list();
    const all = await this.list();
    return all.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
    );
  },

  async create(input: CreateClubInput): Promise<string> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const ref = doc(collection(database, 'clubs'));
    await setDoc(ref, {
      name: input.name.trim(),
      city: input.city.trim(),
      department: input.department?.trim() ?? null,
      location: input.location ?? { latitude: 0, longitude: 0 },
      verified: false,
      categories: input.categories,
      sponsor_ids: [],
      owner_uid: input.owner_uid,
      is_active: true,
      created_at: serverTimestamp(),
    });
    return ref.id;
  },
};
