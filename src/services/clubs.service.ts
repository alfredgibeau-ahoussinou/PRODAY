import { collection, getDocs, query, limit } from 'firebase/firestore';
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

export const clubsService = {
  async list(max = 50): Promise<Club[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    const snap = await getDocs(query(collection(database, 'clubs'), limit(max)));
    return snap.docs.map((d) => clubFromFirestore(d.id, d.data() as Record<string, unknown>));
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
};
