/**
 * Cache effectif FootClubs indexé par n° d’affiliation FFF.
 * Permet l’inscription de retrouver les licenciés importés par le club,
 * sans exposer toute la collection `memberships` (règles Firestore strictes).
 *
 * Source = import FootClubs / sync quotidienne — jamais de noms inventés.
 * La FFF/DOFA ne publie pas les listes de licenciés (RGPD / 401).
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  limit,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type { PreRegisteredMember } from './fffOfficialRegistry.service';

export const FFF_CLUB_ROSTERS_COL = 'fff_club_rosters';

export interface FffClubRosterMember {
  id: string;
  displayName: string;
  role: 'player' | 'coach';
  category: string;
  licenseNumber?: string;
}

export interface FffClubRosterDoc {
  affiliation_number: string;
  club_name: string;
  proday_club_id?: string;
  city?: string;
  source: 'footclubs_import' | 'memberships_sync';
  synced_at?: Date;
  members: FffClubRosterMember[];
  member_count: number;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function categorySoftMatch(memberCat: string, wanted: string): boolean {
  if (!wanted) return true;
  if (!memberCat) return false;
  const a = normalize(memberCat);
  const b = normalize(wanted);
  if (!a || !b) return false;
  if (a === b || a.includes(b) || b.includes(a)) return true;
  // Tokens communs (U18, R2, Seniors…)
  const at = new Set(a.split(' ').filter((t) => t.length >= 2));
  const bt = b.split(' ').filter((t) => t.length >= 2);
  const hits = bt.filter((t) => at.has(t));
  return hits.length >= Math.min(2, bt.length) || (bt.length === 1 && hits.length === 1);
}

export const fffClubRosterService = {
  /** Lit le cache public d’effectif pour un n° d’affiliation FFF. */
  async getByAffiliationNumber(fffNumber: string): Promise<FffClubRosterDoc | null> {
    const code = fffNumber.trim();
    if (!code || !isFirebaseConfigured()) return null;
    const database = getDb();
    if (!database) return null;

    try {
      const snap = await getDoc(doc(database, FFF_CLUB_ROSTERS_COL, code));
      if (!snap.exists()) return null;
      const data = snap.data() as Record<string, unknown>;
      const synced = data.synced_at as { toDate?: () => Date } | Date | string | undefined;
      let syncedAt: Date | undefined;
      if (synced && typeof synced === 'object' && 'toDate' in synced && typeof synced.toDate === 'function') {
        syncedAt = synced.toDate();
      } else if (synced instanceof Date) {
        syncedAt = synced;
      } else if (typeof synced === 'string') {
        syncedAt = new Date(synced);
      }

      const membersRaw = Array.isArray(data.members) ? data.members : [];
      const members: FffClubRosterMember[] = (membersRaw
        .map((m) => {
          const row = m as Record<string, unknown>;
          const displayName = String(row.displayName ?? row.player_name ?? '').trim();
          if (!displayName) return null;
          return {
            id: String(row.id ?? row.licenseNumber ?? displayName),
            displayName,
            role: (row.role === 'coach' ? 'coach' : 'player') as 'coach' | 'player',
            category: String(row.category ?? ''),
            licenseNumber: row.licenseNumber
              ? String(row.licenseNumber)
              : row.license_number
                ? String(row.license_number)
                : undefined,
          };
        })
        .filter((m) => m !== null) as FffClubRosterMember[]);

      return {
        affiliation_number: code,
        club_name: String(data.club_name ?? ''),
        proday_club_id: data.proday_club_id ? String(data.proday_club_id) : undefined,
        city: data.city ? String(data.city) : undefined,
        source: data.source === 'memberships_sync' ? 'memberships_sync' : 'footclubs_import',
        synced_at: syncedAt,
        members,
        member_count: members.length,
      };
    } catch {
      return null;
    }
  },

  /**
   * Licenciés pour l’inscription : filtre catégorie souple.
   * Si aucun match catégorie → retourne tout l’effectif (mieux que liste vide trompeuse).
   */
  async listMembersForSignup(
    fffNumber: string,
    category?: string
  ): Promise<{
    members: PreRegisteredMember[];
    syncedAt?: Date;
    clubName?: string;
    totalInClub: number;
    categoryFallback: boolean;
  }> {
    const docRoster = await this.getByAffiliationNumber(fffNumber);
    if (!docRoster || docRoster.members.length === 0) {
      return { members: [], totalInClub: 0, categoryFallback: false };
    }

    const all: PreRegisteredMember[] = docRoster.members.map((m) => ({
      id: m.id,
      displayName: m.displayName,
      role: m.role,
      category: m.category,
      licenseNumber: m.licenseNumber,
    }));

    if (!category?.trim()) {
      return {
        members: all,
        syncedAt: docRoster.synced_at,
        clubName: docRoster.club_name,
        totalInClub: all.length,
        categoryFallback: false,
      };
    }

    const filtered = all.filter((m) => categorySoftMatch(m.category, category));
    const usedFallback = filtered.length === 0;
    return {
      members: usedFallback ? all : filtered,
      syncedAt: docRoster.synced_at,
      clubName: docRoster.club_name,
      totalInClub: all.length,
      categoryFallback: usedFallback,
    };
  },

  /**
   * Publie / remplace le cache après import FootClubs (appelé côté club staff).
   */
  async publishRoster(params: {
    affiliationNumber: string;
    clubName: string;
    prodayClubId: string;
    city?: string;
    members: FffClubRosterMember[];
    source?: FffClubRosterDoc['source'];
  }): Promise<void> {
    const code = params.affiliationNumber.trim();
    if (!code || !isFirebaseConfigured()) return;
    const database = getDb();
    if (!database) return;

    const members = params.members
      .filter((m) => m.displayName.trim())
      .slice(0, 500)
      .map((m) => ({
        id: m.id || m.licenseNumber || normalize(m.displayName).replace(/\s+/g, '_'),
        displayName: m.displayName.trim(),
        role: m.role === 'coach' ? 'coach' : 'player',
        category: (m.category || '').trim(),
        licenseNumber: m.licenseNumber?.trim() || null,
      }));

    await setDoc(
      doc(database, FFF_CLUB_ROSTERS_COL, code),
      {
        affiliation_number: code,
        club_name: params.clubName.trim(),
        proday_club_id: params.prodayClubId,
        city: params.city?.trim() || null,
        source: params.source || 'footclubs_import',
        synced_at: serverTimestamp(),
        members,
        member_count: members.length,
        updated_at: serverTimestamp(),
      },
      { merge: true }
    );
  },

  /** Trouve un club ProDay déjà lié à ce n° d’affiliation. */
  async findProdayClubIdByAffiliation(fffNumber: string): Promise<string | null> {
    const code = fffNumber.trim();
    if (!code || !isFirebaseConfigured()) return null;
    const database = getDb();
    if (!database) return null;
    try {
      const snap = await getDocs(
        query(collection(database, 'clubs'), where('fff_affiliation_number', '==', code), limit(1))
      );
      if (!snap.empty) return snap.docs[0].id;
      return null;
    } catch {
      return null;
    }
  },
};
