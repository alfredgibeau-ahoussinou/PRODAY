/**
 * Registre clubs / équipes / licenciés pour l’inscription.
 * Source unique : API publique DOFA FFF (+ imports FootClubs Firestore si présents).
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
  /** Toujours fff_dofa — pas de clubs « custom » inventés côté client */
  source: 'fff_dofa';
}

export class FffOfficialRegistryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FffOfficialRegistryError';
  }
}

const DOFA_BASES = [
  'https://api-dofa.prd-aws.fff.fr/api',
  'https://api-dofa.fff.fr/api',
] as const;

const FETCH_TIMEOUT_MS = 10_000;
const MIN_SEARCH_CHARS = 2;

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
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

function departmentFromPostal(postalCode: string): string {
  const digits = postalCode.replace(/\D/g, '');
  if (digits.length >= 5) {
    if (digits.startsWith('97') || digits.startsWith('98')) return digits.slice(0, 3);
    return digits.slice(0, 2);
  }
  return '';
}

/** Mappe un objet club DOFA / FFF vers le modèle ProDay. */
export function mapDofaClubToOfficial(raw: Record<string, unknown>): OfficialFffClub | null {
  const name = pickString(raw, [
    'cl_name',
    'cl_nom',
    'clName',
    'name',
    'nom',
    'short_name',
    'cl_short_name',
  ]);
  if (!name) return null;

  const dofaId = pickString(raw, ['cl_no', 'clNo', 'id', 'cl_id']);
  const fffNumber = pickString(raw, [
    'cl_code',
    'cl_cod',
    'clCode',
    'code',
    'affiliation',
    'affiliation_number',
    'numero_affiliation',
  ]);

  const city =
    pickString(raw, ['cl_city', 'cl_loca', 'city', 'ville', 'localite', 'locality']) ||
    pickNestedString(raw, ['adresse'], ['city', 'ville', 'localite', 'cl_loca']);

  const postalCode =
    pickString(raw, ['cl_zip', 'cl_cp', 'postal_code', 'postalCode', 'cp', 'code_postal']) ||
    pickNestedString(raw, ['adresse'], ['cp', 'postal_code', 'cl_cp']);

  const department =
    pickString(raw, ['cl_department', 'department', 'departement', 'dept']) ||
    departmentFromPostal(postalCode);

  const league =
    pickString(raw, ['league', 'ligue', 'district', 'cdg_name']) ||
    pickNestedString(raw, ['cdg'], ['cg_name', 'name', 'nom', 'cg_nom']) ||
    'FFF';

  const region =
    pickString(raw, ['region', 'région', 'cl_region']) ||
    pickNestedString(raw, ['cdg'], ['region', 'région']) ||
    '';

  const id = dofaId
    ? `dofa_${dofaId}`
    : fffNumber
      ? `fff_${fffNumber}`
      : `fff_${normalize(name).replace(/[^a-z0-9]+/g, '_').slice(0, 48)}`;

  return {
    id,
    dofaId: dofaId || undefined,
    name,
    fffNumber: fffNumber || '',
    city,
    postalCode,
    department,
    region,
    league,
    categories: [],
    source: 'fff_dofa',
  };
}

function mapEquipeCategory(raw: Record<string, unknown>): string | null {
  const label = pickString(raw, [
    'short_name',
    'name',
    'nom',
    'libelle',
    'label',
    'category',
    'categorie',
    'eq_name',
    'equipe_name',
  ]);
  if (!label) return null;
  // Évite les libellés purement techniques
  if (/^\d+$/.test(label)) return null;
  return label;
}

async function fetchDofaJson(pathAndQuery: string): Promise<unknown> {
  let lastError: unknown;

  for (const base of DOFA_BASES) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const url = `${base}${pathAndQuery.startsWith('/') ? pathAndQuery : `/${pathAndQuery}`}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json, application/ld+json, text/plain, */*',
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 ProDay/1.0',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        lastError = new FffOfficialRegistryError(
          `FFF DOFA indisponible (${response.status}).`
        );
        continue;
      }

      return await response.json();
    } catch (err) {
      lastError = err;
    } finally {
      clearTimeout(timer);
    }
  }

  if (lastError instanceof FffOfficialRegistryError) throw lastError;
  throw new FffOfficialRegistryError(
    'Impossible de joindre le registre officiel FFF. Réessayez ou vérifiez votre connexion.'
  );
}

export const fffOfficialRegistryService = {
  /**
   * Recherche live sur l’API DOFA FFF.
   * Sans requête (≥ 2 caractères) → liste vide (pas de dump / pas de seed).
   */
  async searchOfficialClubs(
    query: string,
    options?: { department?: string; region?: string }
  ): Promise<OfficialFffClub[]> {
    const q = query.trim();
    if (q.length < MIN_SEARCH_CHARS) return [];

    const encoded = encodeURIComponent(q);
    const json = await fetchDofaJson(`/clubs.json?filter=${encoded}&page=1`);
    const members = extractDofaMembers(json);

    let clubs = members
      .map(mapDofaClubToOfficial)
      .filter((c): c is OfficialFffClub => !!c);

    // Déduplication par n° d’affiliation ou nom+ville
    const seen = new Set<string>();
    clubs = clubs.filter((club) => {
      const key = club.fffNumber
        ? `n:${club.fffNumber}`
        : `n:${normalize(club.name)}|${normalize(club.city)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (options?.department) {
      clubs = clubs.filter((c) => c.department === options.department);
    }
    if (options?.region) {
      const r = normalize(options.region);
      clubs = clubs.filter((c) => normalize(c.region).includes(r));
    }

    return clubs;
  },

  /** Lookup exact par numéro d’affiliation FFF (cl_cod / code). */
  async getOfficialClubByFffNumber(fffNumber: string): Promise<OfficialFffClub | null> {
    const code = fffNumber.trim();
    if (!code) return null;

    const results = await this.searchOfficialClubs(code);
    const exact = results.find((c) => c.fffNumber === code);
    if (exact) return exact;

    // Certains endpoints filtrent mal les codes numériques — tentative item direct
    try {
      const json = await fetchDofaJson(`/clubs/${encodeURIComponent(code)}.json`);
      const root = asRecord(json);
      if (root) {
        const mapped = mapDofaClubToOfficial(root);
        if (mapped) return mapped;
      }
    } catch {
      // ignore — on reste sur le résultat recherche
    }

    return results[0] ?? null;
  },

  async getOfficialClubById(clubId: string): Promise<OfficialFffClub | null> {
    const id = clubId.trim();
    if (!id) return null;

    if (id.startsWith('dofa_')) {
      const dofaId = id.slice('dofa_'.length);
      try {
        const json = await fetchDofaJson(`/clubs/${encodeURIComponent(dofaId)}.json`);
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
      const json = await fetchDofaJson(
        `/clubs/${encodeURIComponent(dofaId)}/equipes.json`
      );
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
   * Licenciés pré-inscrits : uniquement imports FootClubs / memberships Firestore réels.
   * Jamais de noms inventés. Si le club n’existe pas encore sur ProDay → [].
   */
  async getRosterForTeam(
    clubId: string,
    category?: string,
    clubHint?: Pick<OfficialFffClub, 'name' | 'city' | 'fffNumber'>
  ): Promise<PreRegisteredMember[]> {
    if (!isFirebaseConfigured()) return [];

    try {
      // Imports dynamiques pour éviter de tirer Firebase dans tous les chemins (tests DOFA).
      const { membershipsService } = await import('./memberships.service');
      const { clubsService } = await import('./clubs.service');

      // 1) Si clubId est déjà un id Firestore ProDay
      let memberships = await membershipsService.listByClub(clubId);

      // 2) Correspondance ProDay par nom (hint du club FFF déjà sélectionné — pas de re-fetch DOFA)
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
          if (!m.category) return false;
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
  },
};
