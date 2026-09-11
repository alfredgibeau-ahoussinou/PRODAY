/**
 * Calendriers FFF/DOFA -> fff_league_standings/{leagueId}.fixtures.
 *
 * Aucun identifiant de compétition n'est deviné ici : seuls les IDs fournis
 * dans DOFA_COMPET_IDS sont interrogés. Un échec ou une réponse vide conserve
 * le dernier calendrier connu afin de ne pas remplacer un calendrier officiel
 * par une liste vide lors d'une panne temporaire.
 */
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';

const COL = 'fff_league_standings';
const DOFA_BASE_URL = 'https://api-dofa.prd-aws.fff.fr/api';

export type DofaFixture = {
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
};

type FixtureSyncResult = {
  updated: number;
  skipped: number;
  errors: string[];
};

type RawRecord = Record<string, unknown>;

function seasonLabel(now = new Date()): string {
  const year = now.getFullYear();
  const start = now.getMonth() >= 6 ? year : year - 1;
  return `${start}-${start + 1}`;
}

function slug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 64);
}

function asRecord(value: unknown): RawRecord {
  return value && typeof value === 'object' ? (value as RawRecord) : {};
}

function firstString(record: RawRecord, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return '';
}

function firstNumber(record: RawRecord, keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return null;
}

function nestedRecord(record: RawRecord, keys: string[]): RawRecord {
  for (const key of keys) {
    const candidate = record[key];
    if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
      return candidate as RawRecord;
    }
  }
  return {};
}

function extractItems(json: unknown): unknown[] {
  if (Array.isArray(json)) return json;
  const root = asRecord(json);
  const directKeys = [
    'hydra:member',
    'member',
    'items',
    'fixtures',
    'matches',
    'rencontres',
    'calendrier',
    'journees',
    'games',
  ];
  for (const key of directKeys) {
    if (Array.isArray(root[key])) return root[key] as unknown[];
  }
  for (const key of ['data', 'donnees', 'result', 'results']) {
    const nested = root[key];
    if (nested && typeof nested === 'object') {
      const found = extractItems(nested);
      if (found.length > 0) return found;
    }
  }
  return [];
}

function normalizeDate(record: RawRecord): string {
  const raw = firstString(record, [
    'date',
    'match_date',
    'date_match',
    'dateMatch',
    'dateRencontre',
    'clDateMatch',
    'datetime',
    'kickoff_at',
  ]);
  if (!raw) return '';
  const iso = raw.match(/(\d{4})[-/](\d{2})[-/](\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const french = raw.match(/(\d{2})[/-](\d{2})[/-](\d{4})/);
  if (french) return `${french[3]}-${french[2]}-${french[1]}`;
  return '';
}

function normalizeTime(record: RawRecord): string {
  const raw = firstString(record, ['time', 'heure', 'kickoff_time', 'heure_match', 'clHeureMatch']);
  const match = raw.match(/(\d{1,2})[:h](\d{2})/i);
  if (!match) return '00:00';
  return `${match[1].padStart(2, '0')}:${match[2]}`;
}

function normalizeStatus(record: RawRecord, date: string): DofaFixture['status'] {
  const status = firstString(record, ['status', 'statut', 'match_status', 'state']).toLowerCase();
  if (status.includes('live') || status.includes('encours') || status.includes('en cours')) return 'live';
  if (
    status.includes('finish') ||
    status.includes('term') ||
    status.includes('joue') ||
    status.includes('played')
  ) {
    return 'finished';
  }
  const homeScore = firstNumber(record, ['home_score', 'homeScore', 'score_home', 'scoreDomicile', 'score_dom']);
  const awayScore = firstNumber(record, ['away_score', 'awayScore', 'score_away', 'scoreExterieur', 'score_ext']);
  if (homeScore !== null && awayScore !== null) return 'finished';
  // Une date passée n'est pas suffisante pour inventer un résultat : elle reste
  // scheduled tant que DOFA n'a pas publié le statut ou les scores.
  void date;
  return 'scheduled';
}

function normalizeFixture(raw: unknown, index: number): DofaFixture | null {
  const record = asRecord(raw);
  const home = nestedRecord(record, ['homeTeam', 'home_team', 'equipe_domicile', 'domicile', 'home']);
  const away = nestedRecord(record, ['awayTeam', 'away_team', 'equipe_exterieure', 'exterieur', 'away']);
  const homeName = firstString(home, ['name', 'nom', 'label', 'short_name', 'clgNomEquipe']) ||
    firstString(record, ['homeTeamName', 'home_team_name', 'home_name', 'equipe_domicile_nom', 'domicile_nom', 'clNomEquipeDomicile']);
  const awayName = firstString(away, ['name', 'nom', 'label', 'short_name', 'clgNomEquipe']) ||
    firstString(record, ['awayTeamName', 'away_team_name', 'away_name', 'equipe_exterieure_nom', 'exterieur_nom', 'clNomEquipeExterieure']);
  const date = normalizeDate(record);
  if (!homeName || !awayName || !date) return null;

  const homeId = firstString(home, ['id', 'team_id', 'code', 'clNo']) ||
    firstString(record, ['homeTeamId', 'home_team_id', 'home_id', 'clNoEquipeDomicile']) || slug(homeName);
  const awayId = firstString(away, ['id', 'team_id', 'code', 'clNo']) ||
    firstString(record, ['awayTeamId', 'away_team_id', 'away_id', 'clNoEquipeExterieure']) || slug(awayName);
  const homeScore = firstNumber(record, ['home_score', 'homeScore', 'score_home', 'scoreDomicile', 'score_dom']);
  const awayScore = firstNumber(record, ['away_score', 'awayScore', 'score_away', 'scoreExterieur', 'score_ext']);
  const rawId = firstString(record, ['id', 'fixture_id', 'match_id', 'rencontre_id', 'idMatch']);
  const venue = firstString(record, ['venue', 'stadium', 'lieu', 'terrain', 'stade']) || undefined;

  return {
    id: rawId || `${date}_${homeId}_${awayId}_${index}`,
    matchday: firstNumber(record, ['matchday', 'journee', 'round', 'num_journee', 'clJournee']) ?? 0,
    homeTeamName: homeName,
    awayTeamName: awayName,
    homeTeamId: homeId,
    awayTeamId: awayId,
    date,
    time: normalizeTime(record),
    venue,
    homeScore,
    awayScore,
    status: normalizeStatus(record, date),
  };
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'ProDayStandingsSync/1.0',
      Origin: 'https://www.fff.fr',
      Referer: 'https://www.fff.fr/',
    },
  });
  if (!response.ok) throw new Error(`DOFA ${response.status} (${url})`);
  return response.json();
}

/**
 * DOFA a changé plusieurs fois le nom de ses routes. On essaie uniquement des
 * routes calendrier/journées rattachées à l'ID de compétition fourni.
 */
export async function fetchDofaFixtures(competId: string): Promise<DofaFixture[]> {
  const encoded = encodeURIComponent(competId);
  const paths = [
    `/compets/${encoded}/calendrier.json`,
    `/compets/${encoded}/calendrier`,
    `/compets/${encoded}/journees.json`,
    `/compets/${encoded}/journees`,
  ];
  let lastError: unknown;
  for (const path of paths) {
    try {
      const json = await fetchJson(`${DOFA_BASE_URL}${path}`);
      const fixtures = extractItems(json)
        .map((item, index) => normalizeFixture(item, index))
        .filter((item): item is DofaFixture => item !== null);
      if (fixtures.length > 0) {
        const unique = new Map(fixtures.map((fixture) => [fixture.id, fixture]));
        return [...unique.values()].sort((a, b) =>
          `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`),
        );
      }
      // Un endpoint valide mais vide est une réponse fiable ; on ne lance pas
      // des routes historiques supplémentaires inutilement.
      if (Array.isArray(json) || extractItems(json).length === 0) continue;
    } catch (error) {
      lastError = error;
    }
  }
  if (lastError) throw lastError;
  return [];
}

function parseDofaMap(): Record<string, string> {
  try {
    const raw = process.env.DOFA_COMPET_IDS || '';
    if (!raw.trim()) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const res: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === 'string' && /^\d+$/.test(v.trim())) {
        res[k] = v.trim();
      }
    }
    return res;
  } catch {
    return {};
  }
}

/** Synchronise tous les calendriers dont la compétition DOFA est mappée. */
export async function processFffStandingsFixturesDailySync(db: Firestore): Promise<FixtureSyncResult> {
  const result: FixtureSyncResult = { updated: 0, skipped: 0, errors: [] };
  const mapping = parseDofaMap();

  const nowIso = new Date().toISOString();
  const season = seasonLabel();

  for (const [leagueId, competId] of Object.entries(mapping)) {
    const ref = db.collection(COL).doc(leagueId);
    try {
      const fixtures = await fetchDofaFixtures(competId);
      if (fixtures.length === 0) {
        await ref.set(
          {
            last_fixture_attempt_at: nowIso,
            fixtures_season: season,
            updated_at: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
        result.skipped += 1;
        continue;
      }
      await ref.set(
        {
          fixtures,
          fixtures_season: season,
          fixtures_source: 'fff_dofa_live',
          fixtures_last_sync_at: nowIso,
          last_fixture_attempt_at: nowIso,
          updated_at: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      result.updated += 1;
    } catch (error) {
      result.errors.push(`${leagueId}: ${error instanceof Error ? error.message : String(error)}`);
      try {
        await ref.set(
          { last_fixture_attempt_at: nowIso, updated_at: FieldValue.serverTimestamp() },
          { merge: true },
        );
      } catch {
        // L'erreur principale est déjà remontée dans le résumé.
      }
    }
  }

  return result;
}
