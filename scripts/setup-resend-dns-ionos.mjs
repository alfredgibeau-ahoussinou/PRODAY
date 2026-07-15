/**
 * Ajoute les enregistrements DNS Resend pour proday75.fr via l'API IONOS DNS.
 *
 * Prérequis :
 *   1. Clé API IONOS : https://developer.hosting.ionos.com/keys
 *      → IONOS_API_KEY=prefix.secret dans .env
 *   2. Valeurs DNS depuis Resend (page domaine → copier les 3 lignes) :
 *      RESEND_DKIM_TXT=p=MIGfMA0GCS...
 *      RESEND_SPF_TXT=v=spf1 include:amazonses.com ~all
 *      RESEND_MX_TARGET=feedback-smtp.eu-west-1.amazonses.com
 *      RESEND_DOMAIN_VERIFICATION=resend-domain-verification=<token>
 *
 * Usage :
 *   node scripts/setup-resend-dns-ionos.mjs
 *   node scripts/setup-resend-dns-ionos.mjs --verify-only
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const IONOS_DNS_BASE = 'https://api.hosting.ionos.com/dns/v1';
const ZONE_NAME = 'proday75.fr';

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

const env = { ...loadEnv(), ...process.env };
const apiKey = env.IONOS_API_KEY?.trim();
const verifyOnly = process.argv.includes('--verify-only');

const dkimTxt = env.RESEND_DKIM_TXT?.trim();
const spfTxt = env.RESEND_SPF_TXT?.trim() || 'v=spf1 include:amazonses.com ~all';
const mxTarget =
  env.RESEND_MX_TARGET?.trim() || 'feedback-smtp.eu-west-1.amazonses.com';

function verificationTxtFromEnv() {
  const raw = env.RESEND_DOMAIN_VERIFICATION?.trim();
  if (!raw) return '';
  return raw.startsWith('resend-domain-verification=')
    ? raw
    : `resend-domain-verification=${raw}`;
}

async function ionos(path, options = {}) {
  const res = await fetch(`${IONOS_DNS_BASE}${path}`, {
    ...options,
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    throw new Error(`IONOS ${res.status} ${path}: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
  }
  return body;
}

async function findZoneId() {
  const zones = await ionos('/zones');
  const list = Array.isArray(zones) ? zones : zones?.zones || [];
  const zone = list.find(
    (z) =>
      z?.name === ZONE_NAME ||
      z?.zoneName === ZONE_NAME ||
      z?.properties?.zoneName === ZONE_NAME
  );
  if (!zone?.id) {
    throw new Error(`Zone ${ZONE_NAME} introuvable dans IONOS (${list.length} zone(s)).`);
  }
  return zone.id;
}

async function listRecords(zoneId) {
  const data = await ionos(`/zones/${zoneId}`);
  return data?.records || [];
}

function hasRecord(records, name, type, contentIncludes) {
  return records.some((r) => {
    const n = r.name || r.properties?.name || r.hostname || '';
    const t = (r.type || r.properties?.type || '').toUpperCase();
    const c = r.content || r.properties?.content || r.target || '';
    const host = n.replace(`.${ZONE_NAME}`, '').replace(ZONE_NAME, '@');
    const matchName =
      name === '@'
        ? host === '@' || host === '' || n === '@' || n === ZONE_NAME
        : n === name || n === `${name}.${ZONE_NAME}`;
    return (
      matchName &&
      t === type.toUpperCase() &&
      (!contentIncludes || String(c).includes(contentIncludes))
    );
  });
}

async function createRecord(zoneId, name, type, content, priority) {
  const payload = {
    name,
    type: type.toUpperCase(),
    content,
    ttl: 3600,
    prio: priority,
    disabled: false,
  };
  return ionos(`/zones/${zoneId}/records`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function main() {
  if (!apiKey) {
    console.error(
      'IONOS_API_KEY manquant.\n' +
        '1. https://developer.hosting.ionos.com/keys → créer une clé DNS\n' +
        '2. Ajouter dans .env : IONOS_API_KEY=prefix.secret\n' +
        '3. Relancer : node scripts/setup-resend-dns-ionos.mjs'
    );
    process.exit(1);
  }

  console.log(`Zone cible : ${ZONE_NAME}`);
  const zoneId = await findZoneId();
  console.log(`Zone ID : ${zoneId}`);

  const records = await listRecords(zoneId);
  console.log(`Enregistrements existants : ${records.length}`);

  if (verifyOnly) {
    const checks = [
      ['@', 'TXT', 'resend-domain-verification'],
      ['resend._domainkey', 'TXT', 'p='],
      ['send', 'TXT', 'spf1'],
      ['send', 'MX', 'amazonses'],
    ];
    for (const [name, type, hint] of checks) {
      const ok = hasRecord(records, name, type, hint);
      console.log(`${ok ? '✓' : '✗'} ${type} ${name}.${ZONE_NAME}`);
    }
    return;
  }

  const verifyTxt = verificationTxtFromEnv();
  if (!dkimTxt && !verifyTxt) {
    console.error(
      'RESEND_DKIM_TXT et RESEND_DOMAIN_VERIFICATION absents.\n' +
        'Ajoutez au minimum la TXT apex depuis Resend (vérification domaine).'
    );
    process.exit(1);
  }
  if (!dkimTxt) {
    console.warn(
      '⚠ RESEND_DKIM_TXT manquant — seule la TXT de vérification sera créée.\n' +
        '   Copiez le DKIM depuis Resend → Domaines → proday75.fr\n'
    );
  }

  const plan = [];
  if (verifyTxt) {
    plan.push({ name: '@', type: 'TXT', content: verifyTxt });
  }
  if (dkimTxt) {
    plan.push(
      { name: 'resend._domainkey', type: 'TXT', content: dkimTxt },
      { name: 'send', type: 'TXT', content: spfTxt },
      { name: 'send', type: 'MX', content: mxTarget, priority: 10 }
    );
  }

  for (const rec of plan) {
    const hint = rec.type === 'TXT' ? rec.content.slice(0, 8) : 'amazonses';
    if (hasRecord(records, rec.name, rec.type, hint)) {
      console.log(`→ Déjà présent : ${rec.type} ${rec.name}`);
      continue;
    }
    await createRecord(zoneId, rec.name, rec.type, rec.content, rec.priority);
    console.log(`✓ Créé : ${rec.type} ${rec.name}.${ZONE_NAME}`);
  }

  console.log('\nAttendez 5–30 min puis cliquez « Verify DNS Records » sur Resend.');
}

main().catch((e) => {
  console.error('✗', e.message);
  process.exit(1);
});
