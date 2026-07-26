import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type { Club } from '../models/Club';
import type {
  ClubOfficialContact,
  ClubOfficialContactKind,
} from '../models/ClubOfficialContact';
import type { GeoPoint, User } from '../models/User';
import { canManageClubEntity } from '../utils/roleCapabilities';
import { validateClubInput } from '../utils/clubValidation';

function parseOfficialContacts(raw: unknown): ClubOfficialContact[] {
  if (!Array.isArray(raw)) return [];
  const contacts: ClubOfficialContact[] = [];
  raw.forEach((item, index) => {
    if (!item || typeof item !== 'object') return;
    const row = item as Record<string, unknown>;
    const name = String(row.name ?? '').trim();
    if (!name) return;
    contacts.push({
      id: String(row.id ?? `contact_${index}`),
      kind: row.kind === 'dirigeant' ? 'dirigeant' : 'arbitre',
      name,
      role_label: row.role_label ? String(row.role_label) : undefined,
      phone: row.phone ? String(row.phone) : undefined,
      email: row.email ? String(row.email) : undefined,
      notes: row.notes ? String(row.notes) : undefined,
      created_at: row.created_at ? new Date(String(row.created_at)) : new Date(),
      updated_at: row.updated_at ? new Date(String(row.updated_at)) : new Date(),
    });
  });
  return contacts;
}

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
    official_contacts: parseOfficialContacts(data.official_contacts),
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

  async create(input: CreateClubInput, owner?: User): Promise<string> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    if (owner) {
      if (!canManageClubEntity(owner.role)) {
        throw new Error('Votre profil ne peut pas créer de club.');
      }
      if (owner.uid !== input.owner_uid) {
        throw new Error('Identité propriétaire invalide.');
      }
    }

    const validated = validateClubInput(input);

    const ref = doc(collection(database, 'clubs'));
    await setDoc(ref, {
      name: validated.name,
      city: validated.city,
      department: validated.department ?? null,
      location: input.location ?? { latitude: 0, longitude: 0 },
      verified: false,
      categories: validated.categories,
      sponsor_ids: [],
      owner_uid: input.owner_uid,
      official_contacts: [],
      is_active: true,
      created_at: serverTimestamp(),
    });
    return ref.id;
  },

  async upsertOfficialContact(
    clubId: string,
    input: {
      id?: string;
      kind: ClubOfficialContactKind;
      name: string;
      role_label?: string;
      phone?: string;
      email?: string;
      notes?: string;
    },
  ): Promise<ClubOfficialContact[]> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const club = await this.getById(clubId);
    if (!club) throw new Error('Club introuvable');

    const now = new Date();
    const existing = club.official_contacts ?? [];
    let next: ClubOfficialContact[];
    if (input.id) {
      next = existing.map((contact) =>
        contact.id === input.id
          ? {
              ...contact,
              kind: input.kind,
              name: input.name.trim(),
              role_label: input.role_label,
              phone: input.phone,
              email: input.email,
              notes: input.notes,
              updated_at: now,
            }
          : contact,
      );
    } else {
      next = [
        ...existing,
        {
          id: `c_${Date.now().toString(36)}`,
          kind: input.kind,
          name: input.name.trim(),
          role_label: input.role_label,
          phone: input.phone,
          email: input.email,
          notes: input.notes,
          created_at: now,
          updated_at: now,
        },
      ];
    }

    await updateDoc(doc(database, 'clubs', clubId), {
      official_contacts: next.map((contact) => ({
        ...contact,
        created_at: contact.created_at.toISOString(),
        updated_at: contact.updated_at.toISOString(),
      })),
      updated_at: serverTimestamp(),
    });
    return next;
  },

  async removeOfficialContact(clubId: string, contactId: string): Promise<ClubOfficialContact[]> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const club = await this.getById(clubId);
    if (!club) throw new Error('Club introuvable');
    const next = (club.official_contacts ?? []).filter((contact) => contact.id !== contactId);
    await updateDoc(doc(database, 'clubs', clubId), {
      official_contacts: next.map((contact) => ({
        ...contact,
        created_at: contact.created_at.toISOString(),
        updated_at: contact.updated_at.toISOString(),
      })),
      updated_at: serverTimestamp(),
    });
    return next;
  },
};
