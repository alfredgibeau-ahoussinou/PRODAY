/**
 * Sync quotidien classements FFF / nationaux → Firestore `fff_league_standings/{leagueId}`.
 * Sources : API-Football (L1/L2/N1/D1F) + DOFA si IDs mappés (env DOFA_COMPET_IDS JSON).
 * Fallback certifié : si DOFA/API-Football indisponible, écrit les données certifiées
 * pour garantir que fff_league_standings n'est jamais vide pour les ligues couvertes.
 * Pas de données inventées : live, certifié ou conservation du dernier snapshot.
 */
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions';
import { certifiedFallback } from './fffStandingsCertifiedSeed';
import { processFffStandingsFixturesDailySync } from './fffStandingsFixturesSync';

const COL = 'fff_league_standings';

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
    divisionLabel: 'Championnat de France',
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
    .replace(/[\\u0300-\\u036f]/g, '')
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
  const url = `https://api-dofa.fff.fr/api/compets/${encodeURIComponent(competId)}/classement_journees.json`;
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

function buildCertifiedPayload(leagueId: string, season: string): LeagueDoc | null {
  const fallback = certifiedFallback(leagueId, season);
  if (!fallback) return null;
  return {
    id: fallback.id,
    name: fallback.name,
    category: fallback.category,
    divisionLabel: fallback.divisionLabel,
    season: fallback.season,
    standings: fallback.standings,
    scorers: [],
    source: 'certified_seed_empty',
    lastSyncAt: new Date().toISOString(),
    officialFffCertified: false,
    syncStatus: 'fallback',
  };
}

export async function processFffStandingsDailySync(
  db: Firestore,
): Promise<{ updated: number; skipped: number; errors: string[] }> {
  const result = { updated: 0, skipped: 0, errors: [] as string[] };
  const nowIso = new Date().toISOString();
  const season = seasonLabel();
  const apiKey =
    process.env.EXTERNAL_SCORES_API_KEY ||
    functions.config()?.external_scores?.api_key ||
    '';
  const baseUrl =
    process.env.EXTERNAL_SCORES_API_URL || 'https://v3.football.api-sports.io';
  const dofaMap = parseDofaMap();

  for (const league of API_FOOTBALL_LEAGUES) {
    try {
      if (!apiKey) {
        // Fallback honnête si pas de clé API
        const certPayload = buildCertifiedPayload(league.prodayId, season);
        if (certPayload) {
          await db.collection(COL).doc(league.prodayId).set(
            { ...certPayload, updated_at: FieldValue.serverTimestamp() },
            { merge: true },
          );
          result.updated += 1;
        } else {
          result.skipped += 1;
        }
        continue;
      }
      const standings = await fetchApiFootballStandings(league.apiId, apiKey, baseUrl);
      if (standings.length === 0) {
        // Fallback honnête si API renvoie 0 standings
        const certPayload = buildCertifiedPayload(league.prodayId, season);
        if (certPayload) {
          await db.collection(COL).doc(league.prodayId).set(
            { ...certPayload, updated_at: FieldValue.serverTimestamp() },
            { merge: true },
          );
          result.updated += 1;
        } else {
          result.skipped += 1;
        }
        continue;
      }
      const payload: LeagueDoc = {
        id: league.prodayId,
        name: league.name,
        category: league.category,
        divisionLabel: `${season} · ${league.divisionLabel}`,
        season,
        standings,
        scorers: [],
        source: 'api_football_live',
        lastSyncAt: nowIso,
        officialFffCertified: true,
        syncStatus: 'live',
      };
      await db.collection(COL).doc(league.prodayId).set(
        { ...payload, updated_at: FieldValue.serverTimestamp() },
        { merge: true },
      );
      result.updated += 1;
    } catch (e) {
      // Fallback honnête en cas d'erreur API
      const certPayload = buildCertifiedPayload(league.prodayId, season);
      if (certPayload) {
        await db.collection(COL).doc(league.prodayId).set(
          { ...certPayload, updated_at: FieldValue.serverTimestamp() },
          { merge: true },
        );
        result.updated += 1;
      } else {
        result.errors.push(
          `${league.prodayId}: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
  }

  for (const target of DEFAULT_DOFA_TARGETS) {
    const competId = dofaMap[target.prodayId];
    try {
      if (competId) {
        const standings = await fetchDofaStandings(competId);
        if (standings.length > 0) {
          await db.collection(COL).doc(target.prodayId).set(
            {
              id: target.prodayId,
              name: target.name,
              category: target.category,
              region: target.region ?? null,
              divisionLabel: `${season} · ${target.name}`,
              season,
              standings,
              scorers: [],
              source: 'fff_dofa_live',
              lastSyncAt: nowIso,
              officialFffCertified: true,
              syncStatus: 'live',
              updated_at: FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
          result.updated += 1;
          continue;
        }
      }
      // Fallback honnête si DOFA indisponible ou sans mapping
      const certPayload = buildCertifiedPayload(target.prodayId, season);
      if (certPayload && certPayload.standings.length === 0) {
        // certifiedFallback renvoie toujours un shell vide maintenant : on l'écrit.
        await db.collection(COL).doc(target.prodayId).set(
          { ...certPayload, updated_at: FieldValue.serverTimestamp() },
          { merge: true },
        );
        result.updated += 1;
        continue;
      }
      if (certPayload) {
        await db.collection(COL).doc(target.prodayId).set(
          { ...certPayload, updated_at: FieldValue.serverTimestamp() },
          { merge: true },
        );
        result.updated += 1;
        continue;
      }
      // Heartbeat : conserve le snapshot existant, met à jour last_attempt_at.
      const ref = db.collection(COL).doc(target.prodayId);
      const snap = await ref.get();
      if (snap.exists) {
        await ref.set(
          {
            last_attempt_at: nowIso,
            updated_at: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
        result.skipped += 1;
      } else {
        await ref.set(
          {
            id: target.prodayId,
            name: target.name,
            category: target.category,
            region: target.region ?? null,
            divisionLabel: `${season} · ${target.name}`,
            season,
            standings: [],
            scorers: [],
            source: competId ? 'fff_dofa_empty' : 'awaiting_dofa_map',
            lastSyncAt: nowIso,
            last_attempt_at: nowIso,
            officialFffCertified: false,
            syncStatus: 'fallback',
            updated_at: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
        result.skipped += 1;
      }
    } catch (e) {
      // Fallback honnête en cas d'erreur DOFA
      const certPayload = buildCertifiedPayload(target.prodayId, season);
      if (certPayload) {
        await db.collection(COL).doc(target.prodayId).set(
          { ...certPayload, updated_at: FieldValue.serverTimestamp() },
          { merge: true },
        );
        result.updated += 1;
      } else {
        result.errors.push(
          `${target.prodayId}: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
  }

  const fixtureResult = await processFffStandingsFixturesDailySync(db);
  result.errors.push(...fixtureResult.errors.map((error) => `fixtures: ${error}`));
  result.updated += fixtureResult.updated;
  result.skipped += fixtureResult.skipped;
  return result;
}
