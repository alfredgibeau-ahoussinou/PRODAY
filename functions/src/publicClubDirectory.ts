/**
 * Annuaire public clubs français + claim.
 * Seed depuis structure FootClubs / clubs ProDay (sans PII licenciés).
 */

import * as functions from 'firebase-functions';
import type { Firestore } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';

const DIRECTORY = 'fff_public_clubs';
const CLAIMS = 'fff_public_club_claims';
const ROSTERS = 'fff_club_rosters';

type ClaimStatus = 'unclaimed' | 'claimed_pending' | 'verified' | 'activated';

function asString(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v != null ? String(v).trim() : '';
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function buildPrefixes(parts: string[], max = 48): string[] {
  const out = new Set<string>();
  for (const part of parts) {
    const n = normalize(part);
    if (!n) continue;
    const digits = n.replace(/\s/g, '');
    if (/^\d{2,}$/.test(digits)) {
      out.add(digits.slice(0, 2));
      out.add(digits.slice(0, Math.min(5, digits.length)));
      continue;
    }
    for (const token of n.split(' ')) {
      if (token.length < 2) continue;
      for (let i = 2; i <= Math.min(4, token.length); i++) out.add(token.slice(0, i));
    }
  }
  return Array.from(out).slice(0, max);
}

function buildHaystack(parts: string[]): string {
  return normalize(parts.filter(Boolean).join(' '));
}

function scoreMatch(query: string, haystack: string, nameNorm: string): number {
  const q = normalize(query);
  if (!q || q.length < 2) return 0;
  const h = haystack || nameNorm;
  if (nameNorm === q) return 100;
  if (nameNorm.startsWith(q)) return 92;
  if (h.includes(q)) return 80;
  const tokens = q.split(' ').filter((t) => t.length >= 2);
  if (!tokens.length) return 0;
  let hit = 0;
  for (const t of tokens) if (h.includes(t)) hit++;
  const ratio = hit / tokens.length;
  if (ratio >= 1) return 72;
  if (ratio >= 0.5) return 55;
  return hit > 0 ? 35 : 0;
}

function pickPrefix(query: string): string | null {
  const n = normalize(query);
  if (!n) return null;
  const digits = n.replace(/\s/g, '');
  if (/^\d{2,}$/.test(digits)) return digits.slice(0, Math.min(5, digits.length));
  const first = n.split(' ')[0] ?? '';
  return first.length >= 2 ? first.slice(0, Math.min(4, first.length)) : null;
}

function publicPayload(input: {
  fff: string;
  name: string;
  city?: string;
  postal?: string;
  department?: string;
  region?: string;
  league?: string;
  dofaId?: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  source: 'fff_dofa' | 'footclubs_structure' | 'proday_seed';
  claimStatus?: ClaimStatus;
  prodayClubId?: string | null;
}) {
  const name = input.name.trim();
  const city = (input.city ?? '').trim();
  const postal = (input.postal ?? '').trim();
  const department = (input.department ?? '').trim();
  return {
    fff_affiliation_number: input.fff,
    dofa_id: input.dofaId ?? null,
    name,
    name_normalized: normalize(name),
    city,
    city_normalized: normalize(city),
    postal_code: postal,
    department,
    region: input.region ?? null,
    league: input.league ?? null,
    logo_url: input.logoUrl ?? null,
    primary_color: input.primaryColor ?? null,
    secondary_color: input.secondaryColor ?? null,
    search_prefixes: buildPrefixes([name, city, postal, department, input.fff]),
    search_haystack: buildHaystack([
      name,
      city,
      postal,
      department,
      input.fff,
      input.league ?? '',
    ]),
    claim_status: input.claimStatus ?? 'unclaimed',
    proday_club_id: input.prodayClubId ?? null,
    source: input.source,
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  };
}

export interface PublicDirectorySyncResult {
  fromRosters: number;
  fromClubs: number;
  upserted: number;
  skipped: number;
  errors: string[];
}

/**
 * Peuple / rafraîchit l’annuaire PUBLIC depuis :
 * - `fff_club_rosters` (club_name + affiliation + city seulement — PAS members)
 * - `clubs` ProDay (name/city/dept/fff/logo/colors)
 */
export async function processPublicClubDirectorySync(
  db: Firestore,
): Promise<PublicDirectorySyncResult> {
  const result: PublicDirectorySyncResult = {
    fromRosters: 0,
    fromClubs: 0,
    upserted: 0,
    skipped: 0,
    errors: [],
  };

  const upsert = async (
    fff: string,
    payload: ReturnType<typeof publicPayload>,
  ) => {
    const ref = db.collection(DIRECTORY).doc(fff);
    const snap = await ref.get();
    const prev = snap.data() ?? {};
    const prevStatus = asString(prev.claim_status) || 'unclaimed';
    const order = ['unclaimed', 'claimed_pending', 'verified', 'activated'];
    const keepStatus =
      order.indexOf(prevStatus) > 0 ? prevStatus : payload.claim_status;
    await ref.set(
      {
        ...payload,
        claim_status: keepStatus,
        proday_club_id: prev.proday_club_id ?? payload.proday_club_id ?? null,
        logo_url: payload.logo_url || prev.logo_url || null,
        primary_color: prev.primary_color ?? payload.primary_color ?? null,
        secondary_color: prev.secondary_color ?? payload.secondary_color ?? null,
        ...(snap.exists ? {} : { created_at: admin.firestore.FieldValue.serverTimestamp() }),
      },
      { merge: true },
    );
    result.upserted++;
  };

  try {
    const rosterSnap = await db.collection(ROSTERS).limit(2000).get();
    result.fromRosters = rosterSnap.size;
    for (const docSnap of rosterSnap.docs) {
      const data = docSnap.data();
      const fff = asString(data.affiliation_number) || docSnap.id;
      const name = asString(data.club_name);
      if (!fff || !name) {
        result.skipped++;
        continue;
      }
      // Ne jamais copier `members` — PII
      await upsert(
        fff,
        publicPayload({
          fff,
          name,
          city: asString(data.city),
          source: 'footclubs_structure',
          prodayClubId: asString(data.proday_club_id) || null,
          claimStatus: asString(data.proday_club_id) ? 'activated' : 'unclaimed',
        }),
      );
    }
  } catch (e) {
    result.errors.push(`rosters: ${e instanceof Error ? e.message : String(e)}`);
  }

  try {
    const clubsSnap = await db.collection('clubs').limit(2000).get();
    result.fromClubs = clubsSnap.size;
    for (const docSnap of clubsSnap.docs) {
      const data = docSnap.data();
      const fff = asString(data.fff_affiliation_number);
      const name = asString(data.name);
      if (!fff || !name) {
        result.skipped++;
        continue;
      }
      await upsert(
        fff,
        publicPayload({
          fff,
          name,
          city: asString(data.city),
          department: asString(data.department),
          logoUrl: asString(data.logo_url) || null,
          primaryColor: asString(data.primary_color) || null,
          secondaryColor: asString(data.secondary_color) || null,
          source: 'proday_seed',
          prodayClubId: docSnap.id,
          claimStatus: data.verified === true ? 'verified' : 'claimed_pending',
        }),
      );
    }
  } catch (e) {
    result.errors.push(`clubs: ${e instanceof Error ? e.message : String(e)}`);
  }

  return result;
}

export async function searchPublicClubsInFirestore(
  db: Firestore,
  queryText: string,
  maxResults = 30,
): Promise<Record<string, unknown>[]> {
  const q = queryText.trim();
  if (q.length < 2) return [];
  const prefix = pickPrefix(q);
  if (!prefix) return [];

  const snap = await db
    .collection(DIRECTORY)
    .where('search_prefixes', 'array-contains', prefix)
    .limit(100)
    .get();

  const scored = snap.docs
    .map((d) => {
      const data = d.data();
      return {
        data: { ...data, fff_affiliation_number: d.id },
        score: scoreMatch(
          q,
          asString(data.search_haystack),
          asString(data.name_normalized),
        ),
      };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);

  return scored.map((x) => x.data);
}

export async function claimPublicClubInFirestore(
  db: Firestore,
  uid: string,
  input: {
    fff_affiliation_number: string;
    proday_club_id: string;
    mandate_document_name?: string | null;
  },
): Promise<{ status: ClaimStatus; proday_club_id: string }> {
  const fff = asString(input.fff_affiliation_number);
  const clubId = asString(input.proday_club_id);
  if (!fff || !clubId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'fff_affiliation_number et proday_club_id requis',
    );
  }

  const clubRef = db.collection('clubs').doc(clubId);
  const clubSnap = await clubRef.get();
  if (!clubSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Club ProDay introuvable');
  }
  const club = clubSnap.data()!;
  const currentOwner = asString(club.owner_uid);
  // Stub créé à l’adhésion joueur (owner vide) : le claimant devient propriétaire.
  if (currentOwner && currentOwner !== uid) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Seul le propriétaire du club peut claim',
    );
  }
  if (!currentOwner || club.unclaimed_stub === true) {
    await clubRef.set(
      {
        owner_uid: uid,
        unclaimed_stub: false,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  const dirRef = db.collection(DIRECTORY).doc(fff);
  const dirSnap = await dirRef.get();
  const existingStatus = asString(dirSnap.data()?.claim_status) || 'unclaimed';
  const existingOwnerClub = asString(dirSnap.data()?.proday_club_id);
  if (
    existingOwnerClub &&
    existingOwnerClub !== clubId &&
    (existingStatus === 'verified' || existingStatus === 'activated')
  ) {
    throw new functions.https.HttpsError(
      'already-exists',
      'Ce club FFF est déjà lié à un espace ProDay vérifié',
    );
  }

  const nextStatus: ClaimStatus =
    club.verified === true ? 'verified' : 'claimed_pending';

  await dirRef.set(
    {
      fff_affiliation_number: fff,
      name: asString(club.name) || asString(dirSnap.data()?.name) || fff,
      name_normalized: normalize(asString(club.name) || asString(dirSnap.data()?.name) || fff),
      city: asString(club.city) || asString(dirSnap.data()?.city) || '',
      city_normalized: normalize(asString(club.city) || asString(dirSnap.data()?.city) || ''),
      postal_code: asString(dirSnap.data()?.postal_code) || '',
      department: asString(club.department) || asString(dirSnap.data()?.department) || '',
      logo_url: asString(club.logo_url) || dirSnap.data()?.logo_url || null,
      primary_color: asString(club.primary_color) || dirSnap.data()?.primary_color || null,
      secondary_color: asString(club.secondary_color) || dirSnap.data()?.secondary_color || null,
      search_prefixes: buildPrefixes([
        asString(club.name),
        asString(club.city),
        asString(club.department),
        fff,
      ]),
      search_haystack: buildHaystack([
        asString(club.name),
        asString(club.city),
        asString(club.department),
        fff,
      ]),
      claim_status: nextStatus,
      proday_club_id: clubId,
      source: dirSnap.exists ? dirSnap.data()?.source ?? 'proday_seed' : 'proday_seed',
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      ...(dirSnap.exists ? {} : { created_at: admin.firestore.FieldValue.serverTimestamp() }),
    },
    { merge: true },
  );

  await db
    .collection(CLAIMS)
    .doc(fff)
    .set(
      {
        fff_affiliation_number: fff,
        claimed_by_uid: uid,
        status: nextStatus,
        proday_club_id: clubId,
        mandate_document_name: input.mandate_document_name ?? null,
        claimed_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

  await clubRef.set(
    {
      fff_affiliation_number: fff,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return { status: nextStatus, proday_club_id: clubId };
}
