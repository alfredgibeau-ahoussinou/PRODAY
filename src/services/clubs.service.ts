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
import type { GeoPoint, User } from '../models/User';
import { canEditClubBranding, canManageClubEntity } from '../utils/roleCapabilities';
import { validateClubInput } from '../utils/clubValidation';
import { normalizeCoachHexColor } from '../utils/coachColorPicker';
import { storageService, type UploadFileInput } from './storage.service';
import { usersService } from './users.service';

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
    primary_color: data.primary_color as string | undefined,
    secondary_color: data.secondary_color as string | undefined,
    verified: Boolean(data.verified),
    categories: (data.categories as string[]) ?? [],
    sponsor_ids: (data.sponsor_ids as string[]) ?? [],
    owner_uid: String(data.owner_uid ?? ''),
    fff_affiliation_number: data.fff_affiliation_number
      ? String(data.fff_affiliation_number)
      : undefined,
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
  fff_affiliation_number?: string;
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

  /** Résout un club ProDay par n° d’affiliation FFF (join joueur/coach). */
  async getByFffAffiliationNumber(fffNumber: string): Promise<Club | null> {
    const database = getDb();
    if (!database) return null;
    const code = fffNumber.trim();
    if (!code) return null;
    try {
      const snap = await getDocs(
        query(
          collection(database, 'clubs'),
          where('fff_affiliation_number', '==', code),
          limit(1),
        ),
      );
      if (snap.empty) return null;
      return clubFromFirestore(snap.docs[0].id, snap.docs[0].data() as Record<string, unknown>);
    } catch {
      return null;
    }
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
      fff_affiliation_number: input.fff_affiliation_number?.trim() || null,
      is_active: true,
      created_at: serverTimestamp(),
    });
    return ref.id;
  },

  /** Lie / met à jour le n° d’affiliation FFF d’un club ProDay. */
  async setFffAffiliationNumber(clubId: string, fffNumber: string): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const code = fffNumber.trim();
    if (!code) throw new Error('Numéro d’affiliation FFF requis.');
    await updateDoc(doc(database, 'clubs', clubId), {
      fff_affiliation_number: code,
      updated_at: serverTimestamp(),
    });
  },

  /**
   * Met à jour le logo club (Storage avatars/{uid} + champ logo_url).
   * Tout compte rôle Club rattaché au clubId (pôle Club), pas seulement owner_uid.
   */
  async updateLogo(clubId: string, actorUid: string, file: UploadFileInput): Promise<string> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const club = await this.getById(clubId);
    if (!club) throw new Error('Club introuvable.');

    const actor = await usersService.getById(actorUid);
    const allowed =
      club.owner_uid === actorUid ||
      canEditClubBranding(actor?.role, actor?.profile.club_id, clubId);
    if (!allowed) {
      throw new Error(
        'Seuls les comptes Club rattachés à ce club peuvent changer le logo.',
      );
    }

    const url = await storageService.uploadProfileImage(actorUid, file, 'avatars');
    await updateDoc(doc(database, 'clubs', clubId), { logo_url: url });
    return url;
  },

  /**
   * Met à jour primary_color / secondary_color du club.
   * Même ACL que le logo (staff pôle Club rattaché) — hérité par joueurs/coachs licenciés.
   */
  async updateBrandColors(
    clubId: string,
    actorUid: string,
    colors: { primary: string; secondary: string },
  ): Promise<{ primary: string; secondary: string }> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const primary = normalizeCoachHexColor(colors.primary);
    const secondary = normalizeCoachHexColor(colors.secondary);
    if (!primary || !secondary) {
      throw new Error('Couleurs invalides — utilisez un hex #RRGGBB.');
    }

    const club = await this.getById(clubId);
    if (!club) throw new Error('Club introuvable.');

    const actor = await usersService.getById(actorUid);
    const allowed =
      club.owner_uid === actorUid ||
      canEditClubBranding(actor?.role, actor?.profile.club_id, clubId);
    if (!allowed) {
      throw new Error(
        'Seuls les comptes Club rattachés à ce club peuvent changer les couleurs.',
      );
    }

    await updateDoc(doc(database, 'clubs', clubId), {
      primary_color: primary,
      secondary_color: secondary,
    });
    return { primary, secondary };
  },
};
