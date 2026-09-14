/**
 * Annuaire public clubs FFF — lecture Firestore + enrichissement DOFA live.
 * Aucune PII (pas de roster / présidents / téléphones).
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Firestore,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import { callFunction } from '../lib/firebaseFunctions';
import {
  PUBLIC_CLUB_DIRECTORY_COLLECTION,
  type PublicClubClaimStatus,
  type PublicClubDirectoryEntry,
  type PublicClubDirectorySource,
} from '../models/PublicClubDirectory';
import {
  fffOfficialRegistryService,
  type OfficialFffClub,
} from './fffOfficialRegistry.service';
import {
  buildClubSearchHaystack,
  normalizeClubSearchText,
  pickDirectorySearchPrefix,
  scorePublicClubMatch,
} from '../utils/publicClubSearch';
import { overseasClubsService } from './overseasClubs.service';
import {
  directoryPayloadFromOfficial,
  officialFffClubFromDirectory,
} from '../utils/publicClubDirectoryMap';

export {
  directoryPayloadFromOfficial,
  officialFffClubFromDirectory,
} from '../utils/publicClubDirectoryMap';

function databaseOrThrow(): Firestore {
  const db = getDb();
  if (!db) throw new Error('Firebase non configuré');
  return db;
}

function mapDoc(
  id: string,
  data: Record<string, unknown>,
): PublicClubDirectoryEntry {
  return {
    fff_affiliation_number: String(data.fff_affiliation_number ?? id),
    dofa_id: typeof data.dofa_id === 'string' ? data.dofa_id : undefined,
    name: String(data.name ?? ''),
    name_normalized: String(data.name_normalized ?? ''),
    city: String(data.city ?? ''),
    city_normalized: String(data.city_normalized ?? ''),
    postal_code: String(data.postal_code ?? ''),
    department: String(data.department ?? ''),
    region: typeof data.region === 'string' ? data.region : undefined,
    league: typeof data.league === 'string' ? data.league : undefined,
    logo_url: (data.logo_url as string | null | undefined) ?? null,
    primary_color: (data.primary_color as string | null | undefined) ?? null,
    secondary_color: (data.secondary_color as string | null | undefined) ?? null,
    search_prefixes: Array.isArray(data.search_prefixes)
      ? (data.search_prefixes as string[])
      : [],
    search_haystack: String(data.search_haystack ?? ''),
    claim_status: (data.claim_status as PublicClubClaimStatus) || 'unclaimed',
    proday_club_id: (data.proday_club_id as string | null | undefined) ?? null,
    source: (data.source as PublicClubDirectorySource) || 'fff_dofa',
  };
}

export const publicClubDirectoryService = {
  async getByAffiliation(
    fffNumber: string,
  ): Promise<PublicClubDirectoryEntry | null> {
    if (!isFirebaseConfigured()) return null;
    const code = fffNumber.trim();
    if (!code) return null;
    const snap = await getDoc(
      doc(databaseOrThrow(), PUBLIC_CLUB_DIRECTORY_COLLECTION, code),
    );
    if (!snap.exists()) return null;
    return mapDoc(snap.id, snap.data() as Record<string, unknown>);
  },

  /**
   * Upsert organique depuis un hit DOFA — remplit l’annuaire sans PII.
   * Merge soft : ne regresse pas un claim_status plus avancé.
   */
  async upsertFromOfficial(club: OfficialFffClub): Promise<void> {
    if (!isFirebaseConfigured()) return;
    const payload = directoryPayloadFromOfficial(club);
    if (!payload) return;
    const ref = doc(
      databaseOrThrow(),
      PUBLIC_CLUB_DIRECTORY_COLLECTION,
      payload.fff_affiliation_number,
    );
    const existing = await getDoc(ref);
    const prev = existing.exists()
      ? (existing.data() as Record<string, unknown>)
      : null;
    const statusOrder: PublicClubClaimStatus[] = [
      'unclaimed',
      'claimed_pending',
      'verified',
      'activated',
    ];
    const prevStatus = (prev?.claim_status as PublicClubClaimStatus) || 'unclaimed';
    const keepStatus =
      statusOrder.indexOf(prevStatus) > statusOrder.indexOf('unclaimed')
        ? prevStatus
        : payload.claim_status;

    await setDoc(
      ref,
      {
        ...payload,
        claim_status: keepStatus,
        proday_club_id: prev?.proday_club_id ?? payload.proday_club_id ?? null,
        // Nouveau logo DOFA/ProDay remplit ; on ne jamais écraser un logo existant par null.
        logo_url: payload.logo_url || prev?.logo_url || null,
        primary_color: prev?.primary_color ?? payload.primary_color ?? null,
        secondary_color: prev?.secondary_color ?? payload.secondary_color ?? null,
        updated_at: serverTimestamp(),
        ...(existing.exists() ? {} : { created_at: serverTimestamp() }),
      },
      { merge: true },
    );
  },

  async searchDirectoryLocal(queryText: string, max = 25): Promise<PublicClubDirectoryEntry[]> {
    if (!isFirebaseConfigured()) return [];
    const q = queryText.trim();
    if (q.length < 2) return [];
    const prefix = pickDirectorySearchPrefix(q);
    if (!prefix) return [];

    const snap = await getDocs(
      query(
        collection(databaseOrThrow(), PUBLIC_CLUB_DIRECTORY_COLLECTION),
        where('search_prefixes', 'array-contains', prefix),
        limit(80),
      ),
    );

    const scored = snap.docs
      .map((d) => mapDoc(d.id, d.data() as Record<string, unknown>))
      .map((entry) => ({
        entry,
        score: scorePublicClubMatch(
          q,
          entry.search_haystack,
          entry.name_normalized,
        ),
      }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, max).map((x) => x.entry);
  },

  /**
   * Recherche unifiée : annuaire ProDay d’abord, puis DOFA live, upsert des hits.
   */
  async searchClubs(queryText: string): Promise<OfficialFffClub[]> {
    const q = queryText.trim();
    if (q.length < 2) return [];

    const byFff = new Map<string, OfficialFffClub>();

    const putClub = (club: OfficialFffClub, preferLiveMeta = false) => {
      if (!club.fffNumber) return;
      const prev = byFff.get(club.fffNumber);
      if (!prev) {
        byFff.set(club.fffNumber, club);
        return;
      }
      // Conserve le blason connu ; les hits live peuvent mettre à jour nom/ville.
      byFff.set(
        club.fffNumber,
        preferLiveMeta
          ? {
              ...club,
              logoUrl: club.logoUrl || prev.logoUrl || null,
              dofaId: club.dofaId || prev.dofaId,
            }
          : {
              ...prev,
              logoUrl: prev.logoUrl || club.logoUrl || null,
              dofaId: prev.dofaId || club.dofaId,
            },
      );
    };

    try {
      const local = await this.searchDirectoryLocal(q, 25);
      for (const entry of local) {
        putClub(officialFffClubFromDirectory(entry));
      }
    } catch (err) {
      console.warn('[publicClubDirectory] local search:', err);
    }

    try {
      const remote = await callFunction<
        { query: string; limit?: number },
        { clubs: PublicClubDirectoryEntry[] }
      >('searchPublicClubs', { query: q, limit: 30 });
      for (const entry of remote.clubs ?? []) {
        putClub(officialFffClubFromDirectory(entry));
      }
    } catch {
      // CF absente / offline — OK
    }

    try {
      const live = await fffOfficialRegistryService.searchOfficialClubs(q);
      for (const club of live) {
        if (club.fffNumber) {
          putClub(club, true);
          void this.upsertFromOfficial(club).catch(() => undefined);
        }
      }
    } catch (err) {
      if (byFff.size === 0) throw err;
      console.warn('[publicClubDirectory] DOFA fallback:', err);
    }

    // Répertoire Outre-Mer (11 territoires DOM-TOM - Section 24)
    try {
      const omClubs = overseasClubsService.searchOverseasClubs(q);
      for (const club of omClubs) {
        if (club.fffNumber) {
          putClub(club, true);
        }
      }
    } catch (err) {
      console.warn('[publicClubDirectory] overseas clubs lookup:', err);
    }

    const merged = Array.from(byFff.values());
    return merged
      .map((club) => ({
        club,
        score: scorePublicClubMatch(
          q,
          buildClubSearchHaystack({
            name: club.name,
            city: club.city,
            postalCode: club.postalCode,
            department: club.department,
            fffNumber: club.fffNumber,
            league: club.league,
          }),
          normalizeClubSearchText(club.name),
        ),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 40)
      .map((x) => x.club);
  },

  async claimClub(input: {
    fffAffiliationNumber: string;
    prodayClubId: string;
    mandateDocumentName?: string;
  }): Promise<{ status: PublicClubClaimStatus; proday_club_id: string }> {
    return callFunction('claimPublicClub', {
      fff_affiliation_number: input.fffAffiliationNumber.trim(),
      proday_club_id: input.prodayClubId,
      mandate_document_name: input.mandateDocumentName ?? null,
    });
  },
};
