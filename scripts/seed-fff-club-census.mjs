#!/usr/bin/env node
/**
 * Census exhaustif des clubs FFF — DOFA → fff_public_clubs/{n° affiliation}
 *
 *   npm run census:fff           (démo : 2 départements, 2 pages)
 *   npm run census:fff -- --all  (pleine France, toutes les pages)
 *   npm run census:fff -- --departments 92,75,93,94,77
 *   npm run census:fff -- --departments 92 --pages=3
 *
 * Stratégie :
 *  - ON NE se tape pas le site FFF. On utilise l'API DOFA publique.
 *  - DOFA supporte cl_cp (code postal) et cl_cod (n° affiliation) comme filtres réels.
 *    Le param filter= est IGNORE par DOFA → on n'utilise pas du filter= nom de club.
 *  - On énumère les codes postaux réels de chaque département via geo.api.gouv.fr,
 *    puis on interroge DOFA /clubs.json?cl_cp=<cp> pour chaque CP.
 *  - Chaque club trouvé est upserté dans fff_public_clubs/{fff_affiliation_number}
 *    avec nom, ville, CP, département, ligue/district, logo — SOURCE OFFICIELLE.
 *
 * Aucune donnée inventée. Aucun n° d'affiliation fabriqué.
 * Aucune PII (pas de président, pas de téléphone, pas de licenciés).
 *
 * Le résultat alimente directement l'annuaire public déjà lu par l'app
 * (AdminIdentityQueuePane, AdminClubsPane, PublicClubAutocomplete, signup).
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// ---- CLI ---------------------------------------------------------------
const argv = process.argv.slice(2);
const all = argv.includes('--all');
const departmentsRaw = argv
  .flatMap((a, i, arr) => {
  if (a.startsWith('--departments=')) return a.split('=')[1]?.split(',');
  if (a === '--departments' && arr[i+1]) return [arr[i+1]];
  return [];
})
  .filter(Boolean)
  .map((d) => d.trim());
const maxPages = parseInt(argv.find((a) => a.startsWith('--pages='))?.split('=')[1] || '', 10) || (all ? Infinity : 2);
const perPage = 50;

if (!all && departmentsRaw.length === 0) {
  console.log('Usage :\n  npm run census:fff -- --all\n  npm run census:fff -- --departments 92,75,93,94,77\n  npm run census:fff -- --departments 92 --pages=3');
  process.exit(0);
}

const targetDepartments = all
  ? frenchDepartments()
  : departmentsRaw.map((d) => String(d).padStart(2, '0').slice(0, 2));

console.log(`\n🏁 Census FFF — ${targetDepartments.length} département(s) · maxPages=${isFinite(maxPages) ? maxPages : '∞'} · perPage=${perPage}\n`);

// ---- Firebase ---------------------------------------------------------
function loadEnv() {
  const path = resolve(root, '.env');
  if (!existsSync(path)) return {};
  const env = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

function findServiceAccount() {
  const fixed = resolve(root, 'firebase/service-account.json');
  if (existsSync(fixed)) return fixed;
  const firebaseDir = resolve(root, 'firebase');
  if (existsSync(firebaseDir)) {
    const found = readdirSync(firebaseDir).find((f) => f.includes('adminsdk') && f.endsWith('.json'));
    if (found) return resolve(firebaseDir, found);
  }
  return fixed;
}

const env = loadEnv();
const projectId = env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'proday-155b0';

if (getApps().length === 0) {
  const saPath = findServiceAccount();
  if (!existsSync(saPath)) {
    console.error('Service account requis : firebase/*adminsdk*.json');
    process.exit(1);
  }
  initializeApp({ credential: cert(JSON.parse(readFileSync(saPath, 'utf8'))), projectId });
}

const db = getFirestore();

// ---- Sources -----------------------------------------------------------
const DOFA_BASE = 'https://api-dofa.fff.fr/api';
const GEO_GOUV_BASE = 'https://geo.api.gouv.fr';
const FETCH_TIMEOUT_MS = 10_000;

const DOFA_HEADERS = {
  Accept: 'application/json, application/ld+json, text/plain, */*',
  'Accept-Language': 'fr-FR,fr;q=0.9',
  Origin: 'https://www.fff.fr',
  Referer: 'https://www.fff.fr/',
  'User-Agent': 'ProDayCensus/1.0 (football amateur; contact: admin@proday.app)',
};

function normalize(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[‘']/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function asRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value
    : null;
}

function pickString(raw, keys) {
  for (const key of keys) {
    const v = raw[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  }
  return '';
}

function pickNestedString(raw, path, leafKeys) {
  let cur = raw;
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

function frenchDepartments() {
  const metro = [
    '01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
    '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
    '21', '22', '23', '24', '25', '26', '27', '28', '29', '30',
    '31', '32', '33', '34', '35', '36', '37', '38', '39', '40',
    '41', '42', '43', '44', '45', '46', '47', '48', '49', '50',
    '51', '52', '53', '54', '55', '56', '57', '58', '59', '60',
    '61', '62', '63', '64', '65', '66', '67', '68', '69', '70',
    '71', '72', '73', '74', '75', '76', '77', '78', '79', '80',
    '81', '82', '83', '84', '85', '86', '87', '88', '89', '90',
    '91', '92', '93', '94', '95', '971', '972', '973', '974', '976',
  ];
  return metro;
}

function slugForDoc(name, city, fff) {
  const n = normalize(name).replace(/\s+/g, '_').slice(0, 48);
  return fff ? `fff_${fff}` : `fff_${n.replace(/[^a-z0-9_]/g, '') || 'club'}`;
}

async function postalCodesForDepartment(dept) {
  const qs = new URLSearchParams({
    departement: dept,
    fields: 'codesPostaux',
    limit: '1000',
  });
  const json = await fetchJson(`${GEO_GOUV_BASE}/communes?${qs.toString()}`, {
    Accept: 'application/json',
    'User-Agent': DOFA_HEADERS['User-Agent'],
  });
  if (!Array.isArray(json)) return [];
  const codes = new Set();
  for (const c of json) {
    const rec = asRecord(c);
    if (!rec) continue;
    const cpList = rec.codesPostaux;
    if (Array.isArray(cpList)) {
      for (const cp of cpList) {
        if (typeof cp === 'string' && /^\d{5}$/.test(cp)) codes.add(cp);
      }
    }
  }
  return Array.from(codes);
}

async function clubsByPostalCode(cp) {
  const qs = new URLSearchParams({ page: '1', itemsPerPage: String(perPage) });
  const json = await fetchJson(`${DOFA_BASE}/clubs.json?${qs.toString()}&cl_cp=${encodeURIComponent(cp)}`);
  const members = extractDofaMembers(json);
  return members
    .map(mapDofaClubToOfficial)
    .filter((c) => c !== null);
}

function extractDofaMembers(json) {
  if (Array.isArray(json)) {
    return json.map(asRecord).filter((x) => x !== null);
  }
  const root = asRecord(json);
  if (!root) return [];
  const members = root['hydra:member'] ?? root.member ?? root.items ?? root.data ?? root.clubs;
  if (!Array.isArray(members)) return [];
  return members.map(asRecord).filter((x) => x !== null);
}

function mapDofaClubToOfficial(raw) {
  const name = pickString(raw, [
    'name', 'cl_name', 'cl_nom', 'clName', 'nom', 'short_name', 'cl_short_name',
  ]);
  if (!name) return null;

  const dofaId = pickString(raw, ['cl_no', 'clNo', 'id', 'cl_id']);
  const fffNumber = pickString(raw, [
    'affiliation_number', 'cl_cod', 'cl_code', 'clCode', 'code', 'affiliation',
    'numero_affiliation',
  ]);

  const city =
    pickString(raw, ['location', 'cl_city', 'cl_loca', 'city', 'ville', 'localite', 'locality']) ||
    pickNestedString(raw, ['adresse'], ['city', 'ville', 'localite', 'cl_loca']);

  const postalCode = pickString(raw, [
    'postal_code', 'cl_cp', 'cl_zip', 'postalCode', 'cp', 'code_postal',
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
    pickString(raw, ['region', ' région', 'cl_region']) ||
    pickNestedString(raw, ['district'], ['region', ' région']) ||
    '';

  const id = dofaId
    ? `dofa_${dofaId}`
    : fffNumber
      ? `fff_${fffNumber}`
      : slugForDoc(name, city, fffNumber);

  const logoUrl = extractDofaClubLogoUrl(raw);

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
    logoUrl,
    source: 'fff_dofa',
  };
}

function extractDofaClubLogoUrl(raw) {
  const direct = pickString(raw, [
    'logo_url', 'logoUrl', 'logo', 'cl_logo', 'clLogo', 'blason', 'emblem',
    'crest', 'image', 'photo', 'thumbnail', 'thumb',
  ]);
  const fromDirect = resolvePublicAssetUrl(direct);
  if (fromDirect) return fromDirect;

  const nestedLogo =
    pickNestedString(raw, ['logo'], ['url', 'href', '@id', 'contentUrl', 'src']) ||
    pickNestedString(raw, ['media'], ['url', 'href', '@id', 'contentUrl', 'src']) ||
    pickNestedString(raw, ['image'], ['url', 'href', '@id', 'contentUrl', 'src']) ||
    pickNestedString(raw, ['blason'], ['url', 'href', '@id', 'contentUrl', 'src']);
  return resolvePublicAssetUrl(nestedLogo);
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(value.trim());
}

function resolvePublicAssetUrl(value) {
  const v = value.trim();
  if (!v) return null;
  if (isHttpUrl(v)) return v;
  if (v.startsWith('//')) return `https:${v}`;
  if (v.startsWith('/')) return `https://api-dofa.fff.fr${v}`;
  return null;
}

async function fetchJson(url, headers = DOFA_HEADERS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { method: 'GET', headers, signal: controller.signal });
    const text = await response.text();
    if (!response.ok) {
      if (response.status === 404) return [];
      throw new Error(`DOFA ${response.status} pour ${url}`);
    }
    if (text.trimStart().startsWith('<!DOCTYPE') || text.trimStart().startsWith('<html')) {
      throw new Error('Réponse DOFA non JSON (blocage ?)');
    }
    try {
      return JSON.parse(text);
    } catch {
      throw new Error('Réponse DOFA illisible');
    }
  } finally {
    clearTimeout(timer);
  }
}

// ---- Upsert Firestore -------------------------------------------------
const DIRECTORY = 'fff_public_clubs';

async function upsertClub(club) {
  if (!club.fffNumber) {
    return { skipped: true };
  }

  const ref = db.collection(DIRECTORY).doc(club.fffNumber);
  const existing = await ref.get();
  const prev = existing.exists ? (existing.data() || {}) : null;

  const prevStatus = prev.claim_status || 'unclaimed';
  const statusOrder = ['unclaimed', 'claimed_pending', 'verified', 'activated'];
  const keepStatus =
    statusOrder.indexOf(prevStatus) > statusOrder.indexOf('unclaimed') ? prevStatus : 'unclaimed';

  const nameNorm = normalize(club.name);
  const cityNorm = normalize(club.city);
  const prefixes = buildPrefixes([club.name, club.city, club.postalCode, club.department, club.fffNumber]);
  const haystack = normalize(
    [club.name, club.city, club.postalCode, club.department, club.fffNumber, club.league]
      .filter(Boolean)
      .join(' ')
  );

  await ref.set(
    {
      fff_affiliation_number: club.fffNumber,
      dofa_id: club.dofaId || null,
      name: club.name,
      name_normalized: nameNorm,
      city: club.city,
      city_normalized: cityNorm,
      postal_code: club.postalCode || '',
      department: club.department || '',
      region: club.region || null,
      league: club.league || null,
      logo_url: club.logoUrl || null,
      search_prefixes: prefixes,
      search_haystack: haystack,
      claim_status: keepStatus,
      proday_club_id: null,
      source: 'fff_dofa',
      updated_at: FieldValue.serverTimestamp(),
      ...(existing.exists ? {} : { created_at: FieldValue.serverTimestamp() }),
    },
    { merge: true },
  );

  return { updated: true };
}

function buildPrefixes(parts) {
  const out = new Set();
  for (const part of parts) {
    const n = normalize(part ?? '');
    if (!n) continue;
    if (/^\d{5}$/.test(n) || /^\d{5,}$/.test(n.replace(/\s/g, ''))) {
      const digits = n.replace(/\s/g, '');
      out.add(digits.slice(0, 2));
      out.add(digits.slice(0, 3));
      out.add(digits.slice(0, 5));
      continue;
    }
    for (const token of n.split(' ')) {
      if (token.length < 2) continue;
      const lim = Math.min(4, token.length);
      for (let i = 2; i <= lim; i++) out.add(token.slice(0, i));
      if (token.length >= 5) out.add(token.slice(0, 5));
    }
  }
  return Array.from(out).slice(0, 48);
}

// ---- Stats -------------------------------------------------------------
const stats = {
  departmentsScanned: 0,
  postalCodesQueried: 0,
  clubsFound: 0,
  clubsUpserted: 0,
  clubsSkippedNoAffiliation: 0,
  errors: [],
};

// ---- Main loop --------------------------------------------------------
async function main() {
  for (const dept of targetDepartments) {
    console.log(`\n📍 Département ${dept}…`);
    let postalCodes;
    try {
      postalCodes = await postalCodesForDepartment(dept);
    } catch (e) {
      stats.errors.push(`geo gouv ${dept}: ${e instanceof Error ? e.message : String(e)}`);
      continue;
    }

    if (postalCodes.length === 0) {
      console.log(`  → 0 codes postaux officiels`);
      continue;
    }

    stats.departmentsScanned += 1;
    let page = 0;
    let anyClubForDept = false;

    for (const cp of postalCodes) {
      stats.postalCodesQueried += 1;
      if (stats.postalCodesQueried % 200 === 0) {
        console.log(
          `  → ${stats.postalCodesQueried} CP interrogés · ${stats.clubsFound} clubs trouvés · ${stats.clubsUpserted} upsertés`
        );
      }

      let clubsForCp;
      try {
        clubsForCp = await clubsByPostalCode(cp);
      } catch (e) {
        stats.errors.push(`DOFA ${cp}: ${e instanceof Error ? e.message : String(e)}`);
        continue;
      }

      if (clubsForCp.length === 0) continue;
      anyClubForDept = true;
      page += 1;

      for (const club of clubsForCp) {
        stats.clubsFound += 1;
        const out = await upsertClub(club);
        if (out.skipped) {
          stats.clubsSkippedNoAffiliation += 1;
        } else {
          stats.clubsUpserted += 1;
        }
      }

      if (!all && page >= maxPages) {
        console.log(`  → limite --pages=${maxPages} atteinte pour ce département`);
        break;
      }
    }

    if (!anyClubForDept) {
      console.log(`  → aucun club trouvé sur les ${postalCodes.length} codes postaux`);
    } else {
      console.log(
        `  → ${postalCodes.length} CP interrogés · ${page} page(s) avec clubs`
      );
    }

    await sleep(350);
  }

  console.log(`\n✅ Census terminé`);
  console.log(`   Départements scannés       : ${stats.departmentsScanned}`);
  console.log(`   Codes postaux interrogés   : ${stats.postalCodesQueried}`);
  console.log(`   Clubs trouvés (DOFA)       : ${stats.clubsFound}`);
  console.log(`   Clubs upsertés (fff_public_clubs) : ${stats.clubsUpserted}`);
  console.log(`   Clubs ignorés (sans n° FFF) : ${stats.clubsSkippedNoAffiliation}`);
  if (stats.errors.length > 0) {
    console.log(`   Erreurs (${stats.errors.length}) :`);
    for (const e of stats.errors.slice(0, 20)) console.log(`     - ${e}`);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((err) => {
  console.error('\n✖ Échec :', err);
  process.exit(1);
});
