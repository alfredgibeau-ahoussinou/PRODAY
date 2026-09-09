/**
 * Sync quotidienne des effectifs FootClubs → cache `fff_club_rosters`
 * indexé par n° d’affiliation FFF (pour l’inscription).
 *
 * Impossible de scraper les licenciés FFF/DOFA (non publics / 401).
 * On republie uniquement les imports FootClubs / memberships déjà en base ProDay.
 */

import type { DocumentSnapshot, Firestore } from 'firebase-admin/firestore';

export interface FffRosterSyncResult {
  clubsScanned: number;
  rostersPublished: number;
  membersPublished: number;
  skippedNoAffiliation: number;
  errors: string[];
}

type MemberRow = {
  id: string;
  displayName: string;
  role: 'player' | 'coach';
  category: string;
  licenseNumber: string | null;
};

function asString(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v != null ? String(v).trim() : '';
}

async function publishRosterForClubDoc(
  db: Firestore,
  clubDoc: DocumentSnapshot,
): Promise<{ published: boolean; members: number; affiliation: string | null; error?: string }> {
  const club = clubDoc.data() ?? {};
  const affiliation = asString(club.fff_affiliation_number);
  if (!affiliation) {
    return { published: false, members: 0, affiliation: null };
  }

  try {
    const memSnap = await db
      .collection('memberships')
      .where('club_id', '==', clubDoc.id)
      .limit(500)
      .get();

    const members: MemberRow[] = [];
    const seen = new Set<string>();

    for (const mDoc of memSnap.docs) {
      const m = mDoc.data();
      const name = asString(m.player_name);
      if (!name) continue;

      const source = asString(m.source);
      const license = asString(m.license_number);
      const uid = asString(m.player_uid);
      const status = asString(m.status);
      const isImport =
        source === 'footclubs_import' ||
        Boolean(m.pre_registered_roster_id) ||
        uid.startsWith('pre_') ||
        Boolean(license);

      // Uniquement données licence / import — pas les comptes « fantômes »
      if (!isImport && status !== 'active') continue;
      if (!isImport && !license) continue;

      const key = license || `${normalizeKey(name)}|${asString(m.category)}`;
      if (seen.has(key)) continue;
      seen.add(key);

      members.push({
        id: mDoc.id,
        displayName: name,
        role: m.role === 'coach' ? 'coach' : 'player',
        category: asString(m.category),
        licenseNumber: license || null,
      });
    }

    await db
      .collection('fff_club_rosters')
      .doc(affiliation)
      .set(
        {
          affiliation_number: affiliation,
          club_name: asString(club.name) || 'Club FFF',
          proday_club_id: clubDoc.id,
          city: asString(club.city) || null,
          source: 'memberships_sync',
          synced_at: new Date().toISOString(),
          members,
          member_count: members.length,
          updated_at: new Date().toISOString(),
        },
        { merge: true },
      );

    return { published: true, members: members.length, affiliation };
  } catch (e) {
    return {
      published: false,
      members: 0,
      affiliation,
      error: `${clubDoc.id}/${affiliation}: ${e instanceof Error ? e.message : 'erreur'}`,
    };
  }
}

/** Force-publish cache effectif pour un club ProDay (par id ou n° FFF). */
export async function processFffClubRosterForClub(
  db: Firestore,
  input: { club_id?: string | null; fff_affiliation_number?: string | null },
): Promise<{
  published: boolean;
  members: number;
  affiliation: string | null;
  club_id: string | null;
}> {
  const clubId = asString(input.club_id);
  const fff = asString(input.fff_affiliation_number);

  let clubDoc: DocumentSnapshot | null = null;
  if (clubId) {
    clubDoc = await db.collection('clubs').doc(clubId).get();
  } else if (fff) {
    const q = await db
      .collection('clubs')
      .where('fff_affiliation_number', '==', fff)
      .limit(1)
      .get();
    clubDoc = q.docs[0] ?? null;
  }

  if (!clubDoc || !clubDoc.exists) {
    throw new Error('Club introuvable pour sync effectif');
  }

  const result = await publishRosterForClubDoc(db, clubDoc);
  if (result.error) throw new Error(result.error);
  return {
    published: result.published,
    members: result.members,
    affiliation: result.affiliation,
    club_id: clubDoc.id,
  };
}

/**
 * Republie le cache signup pour chaque club ProDay ayant un n° d’affiliation FFF.
 */
export async function processFffClubRosterDailySync(db: Firestore): Promise<FffRosterSyncResult> {
  const result: FffRosterSyncResult = {
    clubsScanned: 0,
    rostersPublished: 0,
    membersPublished: 0,
    skippedNoAffiliation: 0,
    errors: [],
  };

  const clubsSnap = await db.collection('clubs').limit(500).get();
  result.clubsScanned = clubsSnap.size;

  for (const clubDoc of clubsSnap.docs) {
    const out = await publishRosterForClubDoc(db, clubDoc);
    if (!out.affiliation) {
      result.skippedNoAffiliation++;
      continue;
    }
    if (out.error) {
      result.errors.push(out.error);
      continue;
    }
    if (out.published) {
      result.rostersPublished++;
      result.membersPublished += out.members;
    }
  }

  return result;
}

function normalizeKey(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .slice(0, 64);
}
