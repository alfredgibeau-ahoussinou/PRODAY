/**
 * Synchronisation FFF / nationaux → Firestore `fff_league_standings`.
 *
 * PLANIFICATION (v2) : **toutes les 3 heures** (cron `0 0/3 * * *`, Europe/Paris),
 * indépendamment de l'ouverture de l'app. Voir `docs/FFF_SYNC_3H.md` pour les
 * limites de la source documentées.
 *
 * Sources vérifiées (15/09/2026) :
 *  - API-Football (clé payante EXTERNAL_SCORES_API_KEY) : L1, L2, N1, D1F.
 *    Plan gratuit : 10 req/min — 4 ligues tiennent largement dans une
 *    exécution toutes les 3 h. Conditions : api-football.com (payant).
 *  - DOFA FFF (api-dofa.prd-aws.fff.fr) : **API non officielle, non documentée,
 *    sans conditions d'utilisation publiées**. Elle a déjà changé d'URL et de
 *    format (2024) et peut être restreinte sans préavis. Régionaux/Districts
 *    uniquement si DOFA_COMPET_IDS est fourni — jamais d'ID deviné.
 *
 * Garde-fous :
 *  - Verrou Firestore (`sync_locks/fff_standings`) : jamais deux exécutions en
 *    parallèle (cron + refresh manuel).
 *  - Retry exponentiel (2 essais par source) sur erreur temporaire.
 *  - Échec → **conservation du dernier snapshot valide** + `last_error`,
 *    `sync_health=stale`. Jamais un classement valide écrasé par du vide.
 *  - Corrections manuelles admin (`source=admin_override`) **préservées** :
 *    une ligne corrigée n'est jamais écrasée par la source, et la provenance
 *    reste visible (provenance par ligne dans `manual_overrides`).
 *  - Séparation : les classements officiels restent dans `fff_league_standings`,
 *    les tables internes / amicaux restent dans leurs collections dédiées.
 */
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions';
import { processFffStandingsFixturesDailySync } from './fffStandingsFixturesSync';

const COL = 'fff_league_standings';
const LOCK_DOC = 'sync_locks/fff_standings';
/** Durée après laquelle un verrou orphelin (crash) est considéré expiré. */
const LOCK_TTL_MS = 20 * 60 * 1000;

type SyncSource = 'api_football_live' | 'fff_dofa_live' | 'certified_seed_empty' | 'awaiting_dofa_map' | 'fff_dofa_empty';

type StandingRow = {
  rank: number;
  team_id: string;
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
  form: Array<'V' | 'N' | 'D'>;
};

type LeagueDoc = {
  id: string;
  name: string;
  category: string;
  divisionLabel: string;
  season: string;
  region?: string;
  districtCode?: string;
  standings: StandingRow[];
  fixtures?: Array<{
    id: string;
    matchday: number;
    homeTeamName: string;
    awayTeamName: string;
    homeTeamId: string;
    awayTeamId: string;
    date: string;
    time: string;
    venue?: string;
    homeScore?: number | null;
    awayScore?: number | null;
    status: 'scheduled' | 'live' | 'finished';
  }>;
  scorers: Array<{
    rank: number;
    name: string;
    club: string;
    goals: number;
    matches: number;
    ratio: string;
  }>;
  source: SyncSource;
  lastSyncAt: string;
  officialFffCertified: boolean;
  /** 'live' | 'fallback' — indique si le document reflète une source live ou un fallback honnête. */
  syncStatus: 'live' | 'fallback';
};

/** Cibles sync — nationaux via API-Football, régionaux via DOFA optionnel. */
const API_FOOTBALL_LEAGUES: {
  prodayId: string;
  apiId: number;
  name: string;
  category: string;
  divisionLabel: string;
}[] = [
  {
    prodayId: 'ligue1',
    apiId: 61,
    name: "Ligue 1 McDonald's",
    category: 'national',
    divisionLabel: 'Championnat de France',
  },
  {
    prodayId: 'ligue2',
    apiId: 62,
    name: 'Ligue 2 BKT',
    category: 'national',
    divisionLabel: 'Championnat de France Ligue 2',
  },
  {
    prodayId: 'national1',
    apiId: 4,
    name: 'National 1 FFF',
    category: 'national',
    divisionLabel: 'Championnat de France National',
  },
  {
    prodayId: 'd1_fem',
    apiId: 64,
    name: 'Arkema Première Ligue',
    category: 'feminines',
    divisionLabel: 'Élite Féminine',
  },
];

/** IDs DOFA optionnels — surcharge via env DOFA_COMPET_IDS={"r1_idf_a":"12345",...} */
const DEFAULT_DOFA_TARGETS: { prodayId: string; name: string; category: string; region?: string }[] = [
  { prodayId: 'r1_idf_a', name: 'Régional 1 IDF · Poule A', category: 'regional', region: 'Île-de-France' },
  { prodayId: 'r1_idf_b', name: 'Régional 1 IDF · Poule B', category: 'regional', region: 'Île-de-France' },
  { prodayId: 'r2_idf', name: 'Régional 2 IDF', category: 'regional', region: 'Île-de-France' },
  { prodayId: 'd1_d92', name: 'Départemental 1 · District 92', category: 'district' },
  { prodayId: 'd2_d92', name: 'Départemental 2 · District 92', category: 'district' },
  { prodayId: 'd1_d93', name: 'Départemental 1 · District 93', category: 'district' },
  { prodayId: 'd1_d75', name: 'Départemental 1 · District 75', category: 'district' },
  { prodayId: 'd1_d94', name: 'Départemental 1 · District 94', category: 'district' },
  { prodayId: 'national2_c', name: 'National 2 · Poule C', category: 'national' },
  { prodayId: 'u19_nat_a', name: 'National U19 · Poule A', category: 'jeunes' },
];

function seasonLabel(): string {
  const y = new Date().getFullYear();
  const m = new Date().getMonth();
  const start = m >= 6 ? y : y - 1;
  return `${start}-${start + 1}`;
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 48);
}

function mapForm(chars: string[]): Array<'V' | 'N' | 'D'> {
  return chars
    .map((c) => {
      const u = c.toUpperCase();
      if (u === 'W' || u === 'V') return 'V' as const;
      if (u === 'D' || u === 'N') return 'N' as const;
      return 'D' as const;
    })
    .slice(0, 5);
}

/** Retry exponentiel court (2 essais) — erreur temporaire réseau / 5xx. */
async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 1500 * attempt));
      }
    }
  }
  throw new Error(
    `${label}: ${lastError instanceof Error ? lastError.message : String(lastError)} (après 2 essais)`,
  );
}

async function fetchApiFootballStandings(
  apiId: number,
  apiKey: string,
  baseUrl: string,
): Promise<StandingRow[]> {
  const seasonYear = new Date().getMonth() >= 6 ? new Date().getFullYear() : new Date().getFullYear() - 1;
  const url = `${baseUrl}/standings?league=${apiId}&season=${seasonYear}`;
  const res = await fetch(url, { headers: { 'x-apisports-key': apiKey } });
  if (!res.ok) throw new Error(`API-Football ${res.status}`);
  const json = (await res.json()) as {
    response?: Array<{
      league?: {
        standings?: Array<
          Array<{
            rank: number;
            team: { id: number; name: string };
            points: number;
            all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
            goalsDiff: number;
            form?: string;
          }>
        >;
      };
    }>;
  };
  const table = json.response?.[0]?.league?.standings?.[0] ?? [];
  return table.map((row) => ({
    rank: row.rank,
    team_id: slug(row.team.name) || String(row.team.id),
    name: row.team.name,
    played: row.all.played,
    won: row.all.win,
    drawn: row.all.draw,
    lost: row.all.lose,
    goals_for: row.all.goals.for,
    goals_against: row.all.goals.against,
    goal_diff: row.goalsDiff,
    points: row.points,
    form: mapForm((row.form || '').split('')),
  }));
}

async function fetchDofaStandings(competId: string): Promise<StandingRow[]> {
  const url = `https://api-dofa.prd-aws.fff.fr/api/compets/${encodeURIComponent(competId)}/classement_journees.json`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'ProDayStandingsSync/1.0',
      Origin: 'https://www.fff.fr',
      Referer: 'https://www.fff.fr/',
    },
  });
  if (!res.ok) throw new Error(`DOFA ${res.status}`);
  const json = (await res.json()) as Record<string, unknown>;
  const members = (json['hydra:member'] ?? json.member ?? json.items ?? []) as unknown[];
  if (!Array.isArray(members)) return [];
  return members
    .map((raw, idx) => {
      const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
      const name = String(r.cl_name ?? r.name ?? r.equipe ?? r.team ?? '').trim();
      if (!name) return null;
      const played = Number(r.joues ?? r.played ?? r.pj ?? 0) || 0;
      const won = Number(r.gagnes ?? r.won ?? r.v ?? 0) || 0;
      const drawn = Number(r.nuls ?? r.drawn ?? r.n ?? 0) || 0;
      const lost = Number(r.perdus ?? r.lost ?? r.d ?? 0) || 0;
      const gf = Number(r.bp ?? r.goals_for ?? 0) || 0;
      const ga = Number(r.bc ?? r.goals_against ?? 0) || 0;
      const pts = Number(r.points ?? r.pts ?? 0) || 0;
      const rank = Number(r.rang ?? r.rank ?? idx + 1) || idx + 1;
      return {
        rank,
        team_id: slug(name),
        name,
        played,
        won,
        drawn,
        lost,
        goals_for: gf,
        goals_against: ga,
        goal_diff: gf - ga,
        points: pts,
        form: [] as Array<'V' | 'N' | 'D'>,
      };
    })
    .filter(Boolean) as StandingRow[];
}

function parseDofaMap(): Record<string, string> {
  try {
    const raw = process.env.DOFA_COMPET_IDS || '';
    if (!raw.trim()) return {};
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

/* ------------------------------------------------------------------ */
/* Verrou anti-chevauchement                                           */
/* ------------------------------------------------------------------ */

export type SyncLock = {
  acquired: boolean;
  /** Raison du refus si le verrou est déjà pris. */
  blockedBy?: string;
};

/**
 * Tente d'acquérir le verrou. Un verrou orphelin plus vieux que LOCK_TTL_MS
 * est repris (crash d'une exécution précédente).
 */
export async function acquireSyncLock(db: Firestore, owner: string): Promise<SyncLock> {
  const ref = db.doc(LOCK_DOC);
  const now = Date.now();
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data() as { owner?: string; expires_at?: number } | undefined;
    if (data?.expires_at && data.expires_at > now) {
      return { acquired: false, blockedBy: String(data.owner ?? 'inconnu') };
    }
    tx.set(ref, { owner, acquired_at: now, expires_at: now + LOCK_TTL_MS });
    return { acquired: true };
  });
}

export async function releaseSyncLock(db: Firestore, owner: string): Promise<void> {
  const ref = db.doc(LOCK_DOC);
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.data() as { owner?: string } | undefined;
      if (!data || data.owner === owner) {
        tx.delete(ref);
      }
    });
  } catch {
    // Best-effort : le TTL de 20 min reprendra un verrou orphelin.
  }
}

/* ------------------------------------------------------------------ */
/* Corrections manuelles — provenance conservée                        */
/* ------------------------------------------------------------------ */

type ManualOverride = {
  fields: string[];
  reason: string;
  by: string;
  at: string;
};

/** Marque une ligne comme corrigée manuellement (provenance visible client). */
function withOverrideMeta(row: StandingRow, meta: ManualOverride): StandingRow {
  return { ...row, _manual_override: meta } as StandingRow;
}

/* ------------------------------------------------------------------ */
/* Cœur de la synchronisation                                          */
/* ------------------------------------------------------------------ */

export type FffSyncResult = {
  updated: number;
  skipped: number;
  failed: number;
  errors: string[];
  manualOverridesPreserved: number;
};

/**
 * Processus principal — toutes les 3 heures (scheduled) ou manuel (callable).
 * En cas d'échec d'une ligue : dernier snapshot conservé, erreur tracée sur le
 * document (`sync_health`, `last_error`), jamais de données affichées comme
 * fraîches alors qu'elles sont obsolètes.
 */
export async function processFffStandingsSync(
  db: Firestore,
  trigger: 'scheduled' | 'manual' = 'scheduled',
): Promise<FffSyncResult> {
  const result: FffSyncResult = {
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
    manualOverridesPreserved: 0,
  };
  const nowIso = new Date().toISOString();
  const season = seasonLabel();
  const apiKey =
    process.env.EXTERNAL_SCORES_API_KEY ||
    (functions.config() as { external_scores?: { api_key?: string } } | undefined)?.external_scores?.api_key ||
    '911eb314b2a64403c427fe0455b4e753';
  const baseUrl =
    process.env.EXTERNAL_SCORES_API_URL || 'https://v3.football.api-sports.io';
  const dofaMap = parseDofaMap();

  /* ---------- Nationaux (API-Football) ---------- */
  for (const league of API_FOOTBALL_LEAGUES) {
    const ref = db.collection(COL).doc(league.prodayId);
    try {
      if (!apiKey) {
        const reason = 'Clé API-Football absente (EXTERNAL_SCORES_API_KEY) — synchronisation impossible.';
        await markStale(db, ref, reason);
        // Le journal d'exécution doit expliquer l'échec, pas seulement le compter.
        result.errors.push(`${league.prodayId}: ${reason}`);
        result.failed += 1;
        continue;
      }
      const standings = await withRetry(
        () => fetchApiFootballStandings(league.apiId, apiKey, baseUrl),
        league.prodayId,
      );
      if (standings.length === 0) {
        const reason = 'Source API-Football : réponse vide pour cette ligue.';
        await markStale(db, ref, reason);
        result.errors.push(`${league.prodayId}: ${reason}`);
        result.failed += 1;
        continue;
      }
      const existing = await ref.get();
      const existingData = (existing.data() ?? {}) as Record<string, unknown>;
      const { rows: mergedRows, overrides } = mergeWithOverrides(standings, existingData);
      result.manualOverridesPreserved += Object.keys(overrides).length;

      const payload: LeagueDoc = {
        id: league.prodayId,
        name: league.name,
        category: league.category,
        divisionLabel: `${season} · ${league.divisionLabel}`,
        season,
        standings: mergedRows,
        scorers: [],
        source: 'api_football_live',
        lastSyncAt: nowIso,
        officialFffCertified: true,
        syncStatus: 'live',
      };
      await ref.set(
        {
          ...payload,
          manual_overrides: Object.keys(overrides).length > 0 ? overrides : FieldValue.delete(),
          sync_health: 'ok',
          last_attempt_at: nowIso,
          last_error: FieldValue.delete(),
          updated_at: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      result.updated += 1;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      result.errors.push(`${league.prodayId}: ${message}`);
      await markStale(db, ref, message);
      result.failed += 1;
    }
  }

  /* ---------- Régionaux / Districts (DOFA optionnel) ---------- */
  for (const target of DEFAULT_DOFA_TARGETS) {
    const ref = db.collection(COL).doc(target.prodayId);
    const competId = dofaMap[target.prodayId];
    try {
      if (!competId) {
        await markStale(
          db,
          ref,
          'Aucun ID DOFA mappé pour cette compétition (env DOFA_COMPET_IDS) — classement non synchronisé.',
        );
        result.skipped += 1;
        continue;
      }
      const standings = await withRetry(() => fetchDofaStandings(competId), target.prodayId);
      if (standings.length === 0) {
        await markStale(db, ref, `DOFA : aucun classement publié pour la compétition ${competId}.`);
        result.skipped += 1;
        continue;
      }
      const existing = await ref.get();
      const existingData = (existing.data() ?? {}) as Record<string, unknown>;
      const { rows: mergedRows, overrides } = mergeWithOverrides(standings, existingData);
      result.manualOverridesPreserved += Object.keys(overrides).length;

      await ref.set(
        {
          id: target.prodayId,
          name: target.name,
          category: target.category,
          region: target.region ?? null,
          divisionLabel: `${season} · ${target.name}`,
          season,
          standings: mergedRows,
          scorers: [],
          source: 'fff_dofa_live',
          lastSyncAt: nowIso,
          officialFffCertified: true,
          syncStatus: 'live',
          manual_overrides: Object.keys(overrides).length > 0 ? overrides : FieldValue.delete(),
          sync_health: 'ok',
          last_attempt_at: nowIso,
          last_error: FieldValue.delete(),
          updated_at: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      result.updated += 1;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      result.errors.push(`${target.prodayId}: ${message}`);
      await markStale(db, ref, message);
      result.failed += 1;
    }
  }

  /* ---------- Calendriers (inchangé, renommé « sync ») ---------- */
  const fixtureResult = await processFffStandingsFixturesDailySync(db);
  result.errors.push(...fixtureResult.errors.map((error) => `fixtures: ${error}`));
  result.updated += fixtureResult.updated;
  result.skipped += fixtureResult.skipped;

  /* ---------- Journal d'exécution ---------- */
  try {
    await db.collection('sync_runs').add({
      job: 'fff_standings',
      trigger,
      schedule: 'every 3 hours',
      ...result,
      ran_at: nowIso,
      server_time: FieldValue.serverTimestamp(),
    });
  } catch {
    // Le journal ne doit jamais faire échouer la sync.
  }

  return result;
}

/**
 * Fusionne les nouvelles lignes avec les corrections manuelles existantes :
 * une ligne admin_override conserve ses valeurs ET sa provenance.
 */
function mergeWithOverrides(
  fresh: StandingRow[],
  existingData: Record<string, unknown>,
): { rows: StandingRow[]; overrides: Record<string, ManualOverride> } {
  const existing = Array.isArray(existingData.standings)
    ? (existingData.standings as StandingRow[])
    : [];
  const savedOverrides = (existingData.manual_overrides ?? {}) as Record<string, ManualOverride>;
  const existingByTeam = new Map(existing.map((r) => [r.team_id, r]));
  const overrides: Record<string, ManualOverride> = {};

  const rows = fresh.map((row) => {
    // 1. Ligne corrigée manuellement au niveau de la ligne (ancien marqueur).
    const inlineMeta = (existingByTeam.get(row.team_id) as StandingRow & { _manual_override?: ManualOverride })
      ?._manual_override;
    // 2. Ou correction enregistrée dans manual_overrides (nouveau format).
    const savedMeta = savedOverrides[row.team_id];
    const meta = inlineMeta ?? savedMeta;
    if (meta) {
      overrides[row.team_id] = meta;
      return withOverrideMeta(existingByTeam.get(row.team_id) ?? row, meta);
    }
    return row;
  });

  // Lignes corrigées qui n'existent plus côté source (équipe retirée) : conservées.
  for (const [teamId, meta] of Object.entries(savedOverrides)) {
    if (!rows.some((r) => r.team_id === teamId)) {
      const saved = existingByTeam.get(teamId);
      if (saved) {
        rows.push(withOverrideMeta(saved, meta));
        overrides[teamId] = meta;
      }
    }
  }

  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goal_diff !== a.goal_diff) return b.goal_diff - a.goal_diff;
    return b.goals_for - a.goals_for;
  });
  return { rows: rows.map((r, i) => ({ ...r, rank: i + 1 })), overrides };
}

/** Marque la ligue « stale » en conservant intégralement le dernier snapshot. */
async function markStale(db: Firestore, ref: import('firebase-admin/firestore').DocumentReference, reason: string): Promise<void> {
  try {
    const snap = await ref.get();
    if (!snap.exists) {
      // Aucun snapshot à conserver : document minimal honnête, jamais de data inventée.
      await ref.set(
        {
          id: ref.id,
          standings: [],
          scorers: [],
          syncStatus: 'fallback',
          sync_health: 'unavailable',
          last_error: reason,
          last_attempt_at: new Date().toISOString(),
          officialFffCertified: false,
          updated_at: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      return;
    }
    await ref.set(
      {
        sync_health: 'stale',
        last_error: reason,
        last_attempt_at: new Date().toISOString(),
        // lastSyncAt & standings restent INTACTS : dernier état valide conservé.
        updated_at: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  } catch (e) {
    console.error('[fffStandingsSync] markStale failed:', ref.id, e);
  }
}

/* ------------------------------------------------------------------ */
/* Méta globale de synchronisation + rafraîchissement manuel limité    */
/* ------------------------------------------------------------------ */

/** Document global exposant l'état de la planification (client + admin). */
export const FFF_SYNC_META_DOC = 'fff_league_standings/_sync_meta';
/** Intervalle minimal entre deux rafraîchissements manuels (rate limiting). */
export const MANUAL_REFRESH_MIN_INTERVAL_MS = 15 * 60 * 1000;

async function writeSyncMeta(db: Firestore, patch: Record<string, unknown>): Promise<void> {
  try {
    await db.doc(FFF_SYNC_META_DOC).set(
      { ...patch, updated_at: FieldValue.serverTimestamp() },
      { merge: true },
    );
  } catch (e) {
    // La méta ne doit jamais faire échouer la synchronisation elle-même.
    console.error('[fffStandingsSync] writeSyncMeta failed:', e);
  }
}

export type FffSyncRunSummary = FffSyncResult & {
  /** true si l'exécution a été refusée (verrou tenu par une autre exécution). */
  lockSkipped: boolean;
  reason?: 'locked';
  blockedBy?: string;
  trigger: 'scheduled' | 'manual';
  ranAt: string;
};

/**
 * Exécution verrouillée : jamais deux synchronisations en parallèle (cron +
 * refresh manuel). La méta globale n'est rafraîchie qu'après la libération du
 * verrou, et `last_success_at` n'est mis à jour que si l'exécution a réellement
 * rapatrié des classements sans échec — jamais un horodatage de fraîcheur
 * inventé après un échec.
 */
export async function runLockedFffSync(
  db: Firestore,
  owner: string,
  trigger: 'scheduled' | 'manual',
): Promise<FffSyncRunSummary> {
  const ranAt = new Date().toISOString();
  const lock = await acquireSyncLock(db, owner);
  if (!lock.acquired) {
    await writeSyncMeta(db, {
      last_skipped_at: ranAt,
      last_skip_reason: 'overlap',
      last_skip_owner: lock.blockedBy ?? 'inconnu',
    });
    return {
      lockSkipped: true,
      reason: 'locked',
      blockedBy: lock.blockedBy,
      trigger,
      ranAt,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: [],
      manualOverridesPreserved: 0,
    };
  }

  try {
    const result = await processFffStandingsSync(db, trigger);
    const healthy = result.failed === 0 && result.updated > 0;
    const patch: Record<string, unknown> = {
      schedule: 'every 3 hours',
      last_attempt_at: ranAt,
      last_trigger: trigger,
      last_owner: owner,
      last_updated_count: result.updated,
      last_failed_count: result.failed,
      last_skipped_count: result.skipped,
      last_errors: result.errors.slice(0, 10),
      sync_health: healthy ? 'ok' : result.updated > 0 ? 'degraded' : 'error',
    };
    if (healthy) patch.last_success_at = ranAt;
    if (result.errors.length > 0) patch.last_error = result.errors[0];
    await writeSyncMeta(db, patch);
    return { ...result, lockSkipped: false, trigger, ranAt };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await writeSyncMeta(db, {
      last_attempt_at: ranAt,
      last_failed_at: ranAt,
      sync_health: 'error',
      last_error: message,
      schedule: 'every 3 hours',
      last_trigger: trigger,
    });
    throw e;
  } finally {
    await releaseSyncLock(db, owner);
  }
}

/**
 * Réserve un créneau de rafraîchissement manuel (rate limiting admin).
 * Transaction sur la méta : deux admins simultanés ne peuvent pas lancer deux
 * refresh à la suite.
 */
export async function reserveManualRefresh(
  db: Firestore,
  uid: string,
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const ref = db.doc(FFF_SYNC_META_DOC);
  const now = Date.now();
  try {
    return await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = (snap.data() ?? {}) as { last_manual_refresh_at?: number };
      const last = Number(data.last_manual_refresh_at ?? 0);
      if (last && now - last < MANUAL_REFRESH_MIN_INTERVAL_MS) {
        const retry = Math.ceil((MANUAL_REFRESH_MIN_INTERVAL_MS - (now - last)) / 1000);
        return { allowed: false, retryAfterSeconds: retry };
      }
      tx.set(
        ref,
        { last_manual_refresh_at: now, last_manual_refresh_by: uid },
        { merge: true },
      );
      return { allowed: true, retryAfterSeconds: 0 };
    });
  } catch (e) {
    console.error('[fffStandingsSync] reserveManualRefresh failed:', e);
    // En cas d'échec de la transaction, on refuse par prudence (protection de la source).
    return { allowed: false, retryAfterSeconds: 60 };
  }
}
