import type { Firestore } from 'firebase-admin/firestore';

/**
 * Recherche de personnes **bornée au club du demandeur** (CA-12).
 *
 * Pourquoi un callable : une règle Firestore `allow list` ne peut pas inspecter
 * la clause `where` d'une requête, donc elle ne peut pas garantir qu'une liste
 * reste dans un club. Le seul point d'application fiable est côté serveur, avec
 * le SDK Admin qui résout lui-même le club du demandeur depuis son propre
 * document `users/{uid}` — jamais depuis un paramètre fourni par le client.
 *
 * Aucune coordonnée (email, téléphone) n'est renvoyée : ce module expose
 * uniquement des champs d'annuaire déjà publics dans l'application.
 */

export type ClubMemberResult = {
  uid: string;
  display_name: string;
  role: string | null;
  avatar_url: string | null;
  city: string | null;
  position: string | null;
  club_id: string;
};

export type ClubMemberScopeDecision = {
  clubId: string | null;
  allowed: boolean;
  reason: 'ok' | 'no-caller-doc' | 'no-club';
};

/** Normalisation accents/casse — même règle que le client. */
export function normalizeSearchText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Décide du périmètre à partir du **document du demandeur** (source de vérité
 * serveur). Aucun club ⇒ refus, jamais un repli sur l'annuaire global.
 */
export function callerClubScope(
  callerDoc: Record<string, unknown> | undefined | null,
): ClubMemberScopeDecision {
  if (!callerDoc) return { clubId: null, allowed: false, reason: 'no-caller-doc' };
  const profile = (callerDoc.profile ?? {}) as Record<string, unknown>;
  const raw = profile.club_id;
  const clubId = typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : null;
  if (!clubId) return { clubId: null, allowed: false, reason: 'no-club' };
  return { clubId, allowed: true, reason: 'ok' };
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

/**
 * Pur : filtre et projette des documents `users` **déjà bornés au club**.
 * Le club attendu est revérifié document par document : un document hors club
 * est ignoré, même si le filtre de requête a été contourné.
 */
export function selectClubMembers(
  docs: Array<{ id: string; data: Record<string, unknown> }>,
  queryText: string,
  clubId: string,
  limit = 20,
): ClubMemberResult[] {
  const q = normalizeSearchText(queryText);
  const results: ClubMemberResult[] = [];

  for (const doc of docs) {
    const data = doc.data;
    const profile = (data.profile ?? {}) as Record<string, unknown>;
    const docClubId = asString(profile.club_id);
    if (docClubId !== clubId) continue;
    if (data.is_active === false) continue;

    const displayName = asString(data.display_name) ?? '';
    const haystack = normalizeSearchText(
      [displayName, asString(profile.position) ?? '', asString(data.city) ?? ''].join(' '),
    );
    if (q.length > 0 && !haystack.includes(q)) continue;

    results.push({
      uid: doc.id,
      display_name: displayName,
      role: asString(data.role),
      avatar_url: asString(data.avatar_url),
      city: asString(data.city),
      position: asString(profile.position),
      club_id: clubId,
    });
    if (results.length >= limit) break;
  }

  return results;
}

/** Plafond serveur — la limite demandée par le client ne peut pas l'élargir. */
export const CLUB_MEMBER_SEARCH_MAX = 30;

export async function searchClubMembersInFirestore(
  db: Firestore,
  callerUid: string,
  input: { query?: unknown; limit?: unknown } = {},
): Promise<{
  clubId: string | null;
  members: ClubMemberResult[];
  reason: ClubMemberScopeDecision['reason'];
}> {
  const callerSnap = await db.collection('users').doc(callerUid).get();
  const decision = callerClubScope(callerSnap.data());
  if (!decision.allowed || !decision.clubId) {
    return { clubId: null, members: [], reason: decision.reason };
  }

  const requested = typeof input.limit === 'number' ? input.limit : CLUB_MEMBER_SEARCH_MAX;
  const limit = Math.max(1, Math.min(CLUB_MEMBER_SEARCH_MAX, Math.floor(requested)));
  const queryText = typeof input.query === 'string' ? input.query : '';

  const snap = await db
    .collection('users')
    .where('profile.club_id', '==', decision.clubId)
    .where('is_active', '==', true)
    .limit(CLUB_MEMBER_SEARCH_MAX)
    .get();

  const members = selectClubMembers(
    snap.docs.map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> })),
    queryText,
    decision.clubId,
    limit,
  );

  return { clubId: decision.clubId, members, reason: 'ok' };
}
