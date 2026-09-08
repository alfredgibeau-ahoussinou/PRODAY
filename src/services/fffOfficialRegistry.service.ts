/**
 * Registre clubs / équipes / licenciés pour l’inscription.
 *
 * Sources officielles uniquement :
 * - API DOFA FFF (`cl_cp`, `cl_cod`) — le param `filter=` est ignoré par DOFA
 * - geo.api.gouv.fr pour résoudre ville → code(s) postal(aux)
 * - Imports FootClubs / memberships Firestore pour les licenciés
 *
 * Aucune liste mock, aucun n° d’affiliation inventé, aucun effectif fictif.
 */

import { isFirebaseConfigured } from '../config/firebase';

export interface PreRegisteredMember {
  id: string;
  displayName: string;
  role: 'player' | 'coach';
  category: string;
  licenseNumber?: string;
  position?: string;
}

export interface OfficialFffClub {
  id: string;
  /** Identifiant interne DOFA (cl_no), si disponible */
  dofaId?: string;
  name: string;
  fffNumber: string;
  city: string;
  postalCode: string;
  department: string;
  region: string;
  league: string;
  categories: string[];
  /** Toujours source officielle — pas de clubs « custom » inventés côté client */
  source: 'fff_dofa';
}

export class FffOfficialRegistryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FffOfficialRegistryError';
  }
}

const DOFA_BASE = 'https://api-dofa.fff.fr/api';
const GEO_GOUV_BASE = 'https://geo.api.gouv.fr';
const FETCH_TIMEOUT_MS = 12_000;
const MIN_SEARCH_CHARS = 2;
const MAX_RESULTS = 40;

const DOFA_HEADERS: Record<string, string> = {
  Accept: 'application/json, application/ld+json, text/plain, */*',
  'Accept-Language': 'fr-FR,fr;q=0.9',
  Origin: 'https://www.fff.fr',
  Referer: 'https://www.fff.fr/',
  'User-Agent':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 ProDay/1.0',
};

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

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function pickString(raw: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const v = raw[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  }
  return '';
}

function pickNestedString(
  raw: Record<string, unknown>,
  path: string[],
  leafKeys: string[]
): string {
  let cur: unknown = raw;
  for (const p of path) {
    const rec = asRecord(cur);
    if (!rec) return '';
    cur = rec[p];
  }
  const leaf = asRecord(cur);
  if (!leaf) {
    if (typeof cur === 'string') return cur.trim();
    if (typeof cur === 'number') return String(cur);
    return '';
  }
  return pickString(leaf, leafKeys);
}

/** Variantes de saisie utilisateur (accents, tirets, « Le Mée »…). */
export function buildSearchQueryVariants(query: string): string[] {
  const raw = query.trim();
  if (!raw) return [];

  const variants = new Set<string>();
  const add = (s: string) => {
    const t = s.trim();
    if (t.length >= MIN_SEARCH_CHARS) variants.add(t);
  };

  add(raw);
  add(normalize(raw));
  add(raw.replace(/-/g, ' '));
  add(normalize(raw.replace(/-/g, ' ')));

  // « Le Mée-sur-Seine » / « Le mee sur seine »
  const withoutArticle = normalize(raw).replace(/^(le|la|les|l)\s+/, '');
  add(withoutArticle);
  add(withoutArticle.replace(/\s+sur\s+/g, ' sur '));

  // Tokens utiles (≥ 3 lettres) pour geo + ranking
  for (const token of normalize(raw).split(' ')) {
    if (token.length >= 3 && !['sur', 'saint', 'ste', 'fc', 'as', 'us', 'sc'].includes(token)) {
      add(token);
    }
  }

  return Array.from(variants);
}

/** Extrait la collection Hydra / tableau brut d’une réponse DOFA. */
export function extractDofaMembers(json: unknown): Record<string, unknown>[] {
  if (Array.isArray(json)) {
    return json.map(asRecord).filter((x): x is Record<string, unknown> => !!x);
  }
  const root = asRecord(json);
  if (!root) return [];

  const members =
    root['hydra:member'] ??
    root.member ??
    root.items ??
    root.data ??
    root.clubs;

  if (!Array.isArray(members)) return [];
  return members.map(asRecord).filter((x): x is Record<string, unknown> => !!x);
}

/** Mappe un objet club DOFA / FFF vers le modèle ProDay. */
export function mapDofaClubToOfficial(raw: Record<string, unknown>): OfficialFffClub | null {
  const name = pickString(raw, [
    'name',
    'cl_name',
    'cl_nom',
    'clName',
    'nom',
    'short_name',
    'cl_short_name',
  ]);
  if (!name) return null;

  const dofaId = pickString(raw, ['cl_no', 'clNo', 'id', 'cl_id']);
  const fffNumber = pickString(raw, [
    'affiliation_number',
    'cl_cod',
    'cl_code',
    'clCode',
    'code',
    'affiliation',
    'numero_affiliation',
  ]);

  const city =
    pickString(raw, ['location', 'cl_city', 'cl_loca', 'city', 'ville', 'localite', 'locality']) ||
    pickNestedString(raw, ['adresse'], ['city', 'ville', 'localite', 'cl_loca']);

  const postalCode = pickString(raw, [
    'postal_code',
    'cl_cp',
    'cl_zip',
    'postalCode',
    'cp',
    'code_postal',
  ]);

  const department =
    pickString(raw, ['department_code', 'cl_department', 'department', 'departement', 'dept']) ||
    (postalCode.replace(/\D/g, '').length >= 5
      ? postalCode.replace(/\D/g, '').startsWith('97') || postalCode.replace(/\D/g, '').startsWith('98')
        ? postalCode.replace(/\D/g, '').slice(0, 3)
        : postalCode.replace(/\D/g, '').slice(0, 2)
      : '');

  const league =
    pickNestedString(raw, ['district'], ['name', 'short_name', 'cg_name', 'nom']) ||
    pickString(raw, ['league', 'ligue', 'district', 'cdg_name']) ||
    'FFF';

  const region =
    pickString(raw, ['region', 'région', 'cl_region']) ||
    pickNestedString(raw, ['district'], ['region', 'région']) ||
    '';

  const id = dofaId
    ? `dofa_${dofaId}`
    : fffNumber
      ? `fff_${fffNumber}`
      : `fff_${normalize(name).replace(/\s+/g, '_').slice(0, 48)}`;

  return {
    id,
    dofaId: dofaId || undefined,
    name,
    fffNumber: fffNumber || '',
    city,
    postalCode,
    department: String(department),
    region,
    league,
    categories: [],
    source: 'fff_dofa',
  };
}

function mapEquipeCategory(raw: Record<string, unknown>): string | null {
  const label = pickString(raw, [
    'category_label',
    'category_code',
    'short_name',
    'name',
    'nom',
    'libelle',
    'label',
    'category',
    'categorie',
  ]);

  // Préfère le libellé compétition engagée si plus précis
  const engagements = raw.engagements;
  if (Array.isArray(engagements) && engagements.length > 0) {
    const first = asRecord(engagements[0]);
    const comp = first ? asRecord(first.competition) : null;
    const compName = comp ? pickString(comp, ['name', 'nom', 'short_name']) : '';
    if (compName && !/coupe/i.test(compName)) return compName;
    if (label && compName) return `${label} · ${compName}`;
  }

  if (!label) return null;
  if (/^\d+$/.test(label)) return null;
  return label;
}

async function fetchJson(
  url: string,
  headers: Record<string, string> = DOFA_HEADERS
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type') || '';
    if (!response.ok) {
      throw new FffOfficialRegistryError(`Source officielle indisponible (${response.status}).`);
    }

    const text = await response.text();
    if (
      contentType.includes('text/html') ||
      text.trimStart().startsWith('<!DOCTYPE') ||
      text.trimStart().startsWith('<html')
    ) {
      throw new FffOfficialRegistryError(
        'Le registre FFF a bloqué la requête. Réessayez dans un instant.'
      );
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new FffOfficialRegistryError('Réponse FFF illisible.');
    }
  } finally {
    clearTimeout(timer);
  }
}

async function fetchDofaClubsByParams(params: Record<string, string>): Promise<OfficialFffClub[]> {
  const qs = new URLSearchParams({ page: '1', itemsPerPage: '50', ...params });
  const json = await fetchJson(`${DOFA_BASE}/clubs.json?${qs.toString()}`);
  return extractDofaMembers(json)
    .map(mapDofaClubToOfficial)
    .filter((c): c is OfficialFffClub => !!c);
}

interface GeoCommune {
  nom: string;
  codesPostaux: string[];
  departement?: { code?: string; nom?: string };
  population?: number;
}

/** Résout une saisie libre vers des codes postaux officiels (API geo gouv). */
export async function resolvePostalCodesFromQuery(query: string): Promise<string[]> {
  const variants = buildSearchQueryVariants(query);
  const codes = new Set<string>();

  for (const variant of variants.slice(0, 4)) {
    const qs = new URLSearchParams({
      nom: variant,
      fields: 'nom,codesPostaux,departement,population',
      boost: 'population',
      limit: '8',
    });
    try {
      const json = await fetchJson(`${GEO_GOUV_BASE}/communes?${qs.toString()}`, {
        Accept: 'application/json',
        'User-Agent': DOFA_HEADERS['User-Agent'],
      });
      if (!Array.isArray(json)) continue;
      const communes = json as GeoCommune[];
      // Prefer exact-ish matches first
      const qn = normalize(variant);
      const ranked = [...communes].sort((a, b) => {
        const an = normalize(a.nom || '');
        const bn = normalize(b.nom || '');
        const as = an === qn ? 0 : an.startsWith(qn) ? 1 : an.includes(qn) ? 2 : 3;
        const bs = bn === qn ? 0 : bn.startsWith(qn) ? 1 : bn.includes(qn) ? 2 : 3;
        if (as !== bs) return as - bs;
        return (b.population || 0) - (a.population || 0);
      });
      for (const c of ranked.slice(0, 4)) {
        for (const cp of c.codesPostaux || []) {
          if (/^\d{5}$/.test(cp)) codes.add(cp);
        }
      }
      if (codes.size >= 8) break;
    } catch {
      // try next variant
    }
  }

  return Array.from(codes);
}

function clubMatchesQuery(club: OfficialFffClub, query: string): boolean {
  const q = normalize(query);
  if (!q) return true;
  const hay = normalize(`${club.name} ${club.city} ${club.postalCode} ${club.fffNumber} ${club.league}`);
  if (hay.includes(q)) return true;
  // Tous les tokens significatifs doivent matcher
  const tokens = q.split(' ').filter((t) => t.length >= 3);
  if (tokens.length === 0) return hay.includes(q);
  return tokens.every((t) => hay.includes(t));
}

function rankClub(club: OfficialFffClub, query: string): number {
  const q = normalize(query);
  const name = normalize(club.name);
  const city = normalize(club.city);
  let score = 0;
  if (name === q || city === q) score += 100;
  if (name.startsWith(q) || city.startsWith(q)) score += 50;
  if (name.includes(q)) score += 30;
  if (city.includes(q)) score += 40;
  if (club.fffNumber && club.fffNumber === query.trim()) score += 200;
  if (club.postalCode === query.trim()) score += 180;
  // Pénalise les « CLUB DISTRICT … » génériques
  if (/^club district/i.test(club.name)) score -= 40;
  return score;
}

function dedupeClubs(clubs: OfficialFffClub[]): OfficialFffClub[] {
  const seen = new Set<string>();
  const out: OfficialFffClub[] = [];
  for (const club of clubs) {
    const key = club.fffNumber
      ? `n:${club.fffNumber}`
      : club.dofaId
        ? `d:${club.dofaId}`
        : `n:${normalize(club.name)}|${normalize(club.city)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(club);
  }
  return out;
}

export const fffOfficialRegistryService = {
  /**
   * Recherche live FFF.
   * DOFA ignore `filter=` / `name=` — on utilise `cl_cp` (via geo.gouv) et `cl_cod` (n° affiliation).
   */
  async searchOfficialClubs(
    query: string,
    options?: { department?: string; region?: string }
  ): Promise<OfficialFffClub[]> {
    const q = query.trim();
    if (q.length < MIN_SEARCH_CHARS) return [];

    const collected: OfficialFffClub[] = [];
    const errors: string[] = [];

    // 1) Code postal exact → cl_cp (filtre DOFA réellement supporté)
    if (/^\d{5}$/.test(q)) {
      try {
        collected.push(...(await fetchDofaClubsByParams({ cl_cp: q })));
      } catch (e) {
        errors.push(e instanceof Error ? e.message : 'Erreur DOFA CP');
      }
    }

    // 2) N° d’affiliation FFF → cl_cod (filtre DOFA réellement supporté)
    if (/^\d{4,7}$/.test(q) && !/^\d{5}$/.test(q)) {
      try {
        collected.push(...(await fetchDofaClubsByParams({ cl_cod: q })));
      } catch (e) {
        errors.push(e instanceof Error ? e.message : 'Erreur DOFA affiliation');
      }
    } else if (/^\d{5,7}$/.test(q)) {
      // Un CP à 5 chiffres peut aussi être un n° d’affiliation — tenter les deux
      try {
        collected.push(...(await fetchDofaClubsByParams({ cl_cod: q })));
      } catch {
        // ignore
      }
    }

    // 3) Ville / libellé → communes officielles → codes postaux → clubs DOFA
    if (!/^\d{4,7}$/.test(q)) {
      try {
        const postalCodes = await resolvePostalCodesFromQuery(q);
        // Limite les appels parallèles
        const cps = postalCodes.slice(0, 6);
        const batches = await Promise.all(
          cps.map(async (cp) => {
            try {
              return await fetchDofaClubsByParams({ cl_cp: cp });
            } catch {
              return [] as OfficialFffClub[];
            }
          })
        );
        for (const batch of batches) collected.push(...batch);

        if (postalCodes.length === 0 && collected.length === 0) {
          // Dernier recours : si la saisie ressemble à un CP partiel 2 chiffres département — non supporté
          // On ne dump pas la page 1 DOFA (fausse couverture).
        }
      } catch (e) {
        errors.push(e instanceof Error ? e.message : 'Erreur geo gouv');
      }
    }

    let clubs = dedupeClubs(collected);

    // Filtre client pour coller à la requête (évite tout le CP voisin hors sujet)
    if (!/^\d{4,7}$/.test(q)) {
      const filtered = clubs.filter((c) => clubMatchesQuery(c, q));
      // Si trop strict (ex. nom club ≠ ville), garder les résultats CP
      if (filtered.length > 0) clubs = filtered;
    }

    clubs.sort((a, b) => rankClub(b, q) - rankClub(a, q));

    if (options?.department) {
      clubs = clubs.filter((c) => c.department === options.department);
    }
    if (options?.region) {
      const r = normalize(options.region);
      clubs = clubs.filter((c) => normalize(c.region).includes(r));
    }

    if (clubs.length === 0 && errors.length > 0 && collected.length === 0) {
      throw new FffOfficialRegistryError(errors[0]);
    }

    return clubs.slice(0, MAX_RESULTS);
  },

  /** Lookup exact par numéro d’affiliation FFF (`cl_cod`). */
  async getOfficialClubByFffNumber(fffNumber: string): Promise<OfficialFffClub | null> {
    const code = fffNumber.trim();
    if (!code) return null;

    try {
      const byCod = await fetchDofaClubsByParams({ cl_cod: code });
      const exact = byCod.find((c) => c.fffNumber === code);
      if (exact) return exact;
      if (byCod[0]) return byCod[0];
    } catch {
      // fallback search
    }

    const results = await this.searchOfficialClubs(code);
    return results.find((c) => c.fffNumber === code) ?? results[0] ?? null;
  },

  async getOfficialClubById(clubId: string): Promise<OfficialFffClub | null> {
    const id = clubId.trim();
    if (!id) return null;

    if (id.startsWith('dofa_')) {
      const dofaId = id.slice('dofa_'.length);
      try {
        const json = await fetchJson(`${DOFA_BASE}/clubs/${encodeURIComponent(dofaId)}.json`);
        const root = asRecord(json);
        if (root) return mapDofaClubToOfficial(root);
      } catch {
        return null;
      }
    }

    if (id.startsWith('fff_')) {
      return this.getOfficialClubByFffNumber(id.slice('fff_'.length));
    }

    return this.getOfficialClubByFffNumber(id);
  },

  /**
   * Catégories / équipes engagées du club (DOFA `/clubs/{clNo}/equipes`).
   * Si indisponible → tableau vide (l’UI doit rester honnête).
   */
  async getCategoriesForClub(club: OfficialFffClub): Promise<string[]> {
    const dofaId = club.dofaId;
    if (!dofaId) return [];

    try {
      const json = await fetchJson(`${DOFA_BASE}/clubs/${encodeURIComponent(dofaId)}/equipes.json`);
      const members = extractDofaMembers(json);
      const labels = members
        .map(mapEquipeCategory)
        .filter((x): x is string => !!x);

      const seen = new Set<string>();
      const unique: string[] = [];
      for (const label of labels) {
        const key = normalize(label);
        if (seen.has(key)) continue;
        seen.add(key);
        unique.push(label);
      }
      return unique;
    } catch {
      return [];
    }
  },

  /**
   * Licenciés pour l’inscription.
   * 1) Cache public `fff_club_rosters/{n° affiliation}` (FootClubs + sync quotidienne)
   * 2) Pas de lecture memberships côté client anonyme (ACL Firestore) — d’où le cache.
   * Jamais de noms inventés. FFF/DOFA ne publie pas les listes de licenciés.
   */
  async getRosterForTeam(
    clubId: string,
    category?: string,
    clubHint?: Pick<OfficialFffClub, 'name' | 'city' | 'fffNumber'>
  ): Promise<PreRegisteredMember[]> {
    try {
      const { fffClubRosterService } = await import('./fffClubRoster.service');

      // Priorité : n° d’affiliation FFF du club DOFA sélectionné
      if (clubHint?.fffNumber?.trim()) {
        const fromCache = await fffClubRosterService.listMembersForSignup(
          clubHint.fffNumber,
          category
        );
        if (fromCache.members.length > 0) return fromCache.members;
      }

      // Si Firebase non configuré → vide honnête
      if (!isFirebaseConfigured()) return [];

      // Tentative : club ProDay déjà lié à ce n° (lecture clubs = publique)
      if (clubHint?.fffNumber?.trim()) {
        const prodayId = await fffClubRosterService.findProdayClubIdByAffiliation(
          clubHint.fffNumber
        );
        if (prodayId) {
          const again = await fffClubRosterService.listMembersForSignup(
            clubHint.fffNumber,
            category
          );
          if (again.members.length > 0) return again.members;
        }
      }

      // Dernier recours staff déjà connecté : memberships (échoue silencieusement sinon)
      try {
        const { membershipsService } = await import('./memberships.service');
        const { clubsService } = await import('./clubs.service');

        let memberships = clubId.startsWith('dofa_') || clubId.startsWith('fff_')
          ? []
          : await membershipsService.listByClub(clubId);

        if (memberships.length === 0 && clubHint?.name) {
          const matches = await clubsService.searchByName(clubHint.name);
          const match =
            matches.find(
              (c) =>
                normalize(c.name) === normalize(clubHint.name) &&
                (!clubHint.city || normalize(c.city) === normalize(clubHint.city))
            ) ??
            matches.find((c) => normalize(c.name) === normalize(clubHint.name)) ??
            null;
          if (match) {
            if (match.fff_affiliation_number) {
              const cached = await fffClubRosterService.listMembersForSignup(
                match.fff_affiliation_number,
                category
              );
              if (cached.members.length > 0) return cached.members;
            }
            memberships = await membershipsService.listByClub(match.id);
          }
        }

        const catNorm = category ? normalize(category) : '';
        return memberships
          .filter((m) => {
            if (!m.player_name?.trim()) return false;
            const hasLicense = Boolean(m.license_number?.trim());
            const isImportLike =
              Boolean(m.pre_registered_roster_id) ||
              hasLicense ||
              m.player_uid.startsWith('pre_');
            if (!isImportLike) return false;
            if (!catNorm) return true;
            if (!m.category) return true; // ne pas exclure si catégorie absente
            const mc = normalize(m.category);
            return mc.includes(catNorm) || catNorm.includes(mc);
          })
          .map((m) => ({
            id: m.id,
            displayName: m.player_name,
            role: (m.role === 'coach' ? 'coach' : 'player') as 'player' | 'coach',
            category: m.category || category || '',
            licenseNumber: m.license_number,
          }));
      } catch {
        return [];
      }
    } catch {
      return [];
    }
  },
};
