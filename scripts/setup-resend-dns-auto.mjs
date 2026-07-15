/**
 * Configure les DNS Resend pour proday75.fr (IONOS ou Netlify DNS).
 *
 *   node scripts/setup-resend-dns-auto.mjs
 *   node scripts/setup-resend-dns-auto.mjs --verify-only
 *
 * Prérequis (au moins un) :
 *   - IONOS_API_KEY dans .env → enregistrements chez IONOS (DNS actif)
 *   - Netlify CLI connecté → enregistrements zone Netlify DNS
 *   - RESEND_API_KEY (clé complète, pas send-only) → récupère le DKIM automatiquement
 *   - RESEND_DKIM_TXT dans .env → valeur DKIM copiée depuis Resend
 *   - RESEND_DOMAIN_VERIFICATION dans .env → TXT apex (resend-domain-verification=…)
 */

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const ZONE_NAME = 'proday75.fr';
const NETLIFY_ZONE_ID = '6a4e7fb3dec61854d476757b';
const IONOS_DNS_BASE = 'https://api.hosting.ionos.com/dns/v1';

const SPF = 'v=spf1 include:amazonses.com ~all';
const MX = 'feedback-smtp.eu-west-1.amazonses.com';

function verificationTxtFromEnv() {
  const raw = env.RESEND_DOMAIN_VERIFICATION?.trim();
  if (!raw) return '';
  return raw.startsWith('resend-domain-verification=')
    ? raw
    : `resend-domain-verification=${raw}`;
}


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
const verifyOnly = process.argv.includes('--verify-only');

async function fetchResendDkim(apiKey) {
  const listRes = await fetch('https://api.resend.com/domains', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!listRes.ok) {
    const detail = await listRes.text();
    throw new Error(`Resend domains ${listRes.status}: ${detail}`);
  }
  const list = await listRes.json();
  const domains = list.data || list;
  const domain = domains.find((d) => d.name === ZONE_NAME || d.domain === ZONE_NAME);
  if (!domain?.id) {
    throw new Error(`Domaine ${ZONE_NAME} introuvable sur Resend.`);
  }
  const detailRes = await fetch(`https://api.resend.com/domains/${domain.id}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!detailRes.ok) throw new Error(`Resend domain detail ${detailRes.status}`);
  const detail = await detailRes.json();
  const records = detail.records || [];
  const dkim = records.find(
    (r) =>
      (r.name === 'resend._domainkey' || r.record === 'resend._domainkey') &&
      (r.type === 'TXT' || r.record_type === 'TXT')
  );
  const value = dkim?.value || dkim?.content || dkim?.txt;
  if (!value) throw new Error('Enregistrement DKIM introuvable dans la réponse Resend.');
  return value.replace(/^"|"$/g, '');
}

async function ionosApi(path, options = {}) {
  const res = await fetch(`${IONOS_DNS_BASE}${path}`, {
    ...options,
    headers: {
      'X-API-Key': env.IONOS_API_KEY,
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
    throw new Error(`IONOS ${res.status}: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
  }
  return body;
}

async function ionosFindZoneId() {
  const zones = await ionosApi('/zones');
  const list = Array.isArray(zones) ? zones : zones?.zones || [];
  const zone = list.find(
    (z) => z?.name === ZONE_NAME || z?.zoneName === ZONE_NAME || z?.properties?.zoneName === ZONE_NAME
  );
  if (!zone?.id) throw new Error(`Zone IONOS ${ZONE_NAME} introuvable.`);
  return zone.id;
}

async function ionosListRecords(zoneId) {
  const data = await ionosApi(`/zones/${zoneId}`);
  return data?.records || [];
}

function hasRecord(records, hostname, type, hint) {
  return records.some((r) => {
    const n = r.name || r.properties?.name || r.hostname || '';
    const t = (r.type || r.properties?.type || '').toUpperCase();
    const c = r.content || r.properties?.content || r.value || r.target || '';
    const host = n.replace(`.${ZONE_NAME}`, '').replace(ZONE_NAME, '@');
    const matchHost =
      hostname === '@'
        ? host === '@' || host === '' || n === ZONE_NAME
        : n === hostname || host === hostname || n === `${hostname}.${ZONE_NAME}`;
    return matchHost && t === type.toUpperCase() && (!hint || String(c).includes(hint));
  });
}

async function ionosCreate(zoneId, name, type, content, priority) {
  await ionosApi(`/zones/${zoneId}/records`, {
    method: 'POST',
    body: JSON.stringify({
      name,
      type: type.toUpperCase(),
      content,
      ttl: 3600,
      prio: priority,
      disabled: false,
    }),
  });
}

async function netlifyListRecords() {
  const raw = execSync(`netlify api getDnsZone --data '{"zone_id":"${NETLIFY_ZONE_ID}"}'`, {
    encoding: 'utf8',
    cwd: root,
  });
  const zone = JSON.parse(raw);
  return zone.records || [];
}

async function netlifyCreate(hostname, type, value, priority) {
  const payload = {
    zone_id: NETLIFY_ZONE_ID,
    type,
    hostname,
    value,
    ttl: 3600,
  };
  if (priority != null) payload.priority = priority;
  execSync(`netlify api createDnsRecord --data '${JSON.stringify(payload)}'`, {
    encoding: 'utf8',
    cwd: root,
  });
}

function buildResendPlan(dkimTxt) {
  const plan = [];
  const verify = verificationTxtFromEnv();
  if (verify) {
    plan.push({ host: '@', type: 'TXT', value: verify, hint: 'resend-domain-verification' });
  }
  if (dkimTxt) {
    plan.push(
      { host: 'resend._domainkey', type: 'TXT', value: dkimTxt, hint: 'p=' },
      { host: 'send', type: 'TXT', value: SPF, hint: 'spf1' },
      { host: 'send', type: 'MX', value: MX, hint: 'amazonses', priority: 10 }
    );
  }
  return plan;
}

async function applyRecords(provider, listFn, createFn, plan) {
  if (!plan.length) return;
  const records = await listFn();

  for (const rec of plan) {
    const fqdn = rec.host === '@' ? ZONE_NAME : `${rec.host}.${ZONE_NAME}`;
    if (hasRecord(records, rec.host, rec.type, rec.hint)) {
      console.log(`  → Déjà présent (${provider}) : ${rec.type} ${fqdn}`);
      continue;
    }
    await createFn(rec.host, rec.type, rec.value, rec.priority);
    console.log(`  ✓ Créé (${provider}) : ${rec.type} ${fqdn}`);
  }
}

async function verifyPublic() {
  const { execSync: sh } = await import('child_process');
  const checks = [
    ['TXT', ZONE_NAME, 'resend-domain-verification'],
    ['TXT', `resend._domainkey.${ZONE_NAME}`, 'p='],
    ['TXT', `send.${ZONE_NAME}`, 'spf1'],
    ['MX', `send.${ZONE_NAME}`, 'amazonses'],
  ];
  console.log('\nPropagation DNS publique (Google 8.8.8.8) :');
  for (const [type, name, hint] of checks) {
    try {
      const out = sh(`dig +short ${type} ${name} @8.8.8.8`, { encoding: 'utf8' }).trim();
      const ok = out && out.toLowerCase().includes(hint.toLowerCase());
      console.log(`${ok ? '✓' : '✗'} ${type} ${name}${out ? `\n    ${out.split('\n').join('\n    ')}` : ''}`);
    } catch {
      console.log(`✗ ${type} ${name}`);
    }
  }
}

async function main() {
  console.log(`=== DNS Resend · ${ZONE_NAME} ===\n`);

  let dkimTxt = env.RESEND_DKIM_TXT?.trim();
  const resendKey =
    env.RESEND_API_KEY?.trim() ||
    (() => {
      try {
        const beta = JSON.parse(execSync('firebase functions:config:get beta', { encoding: 'utf8' }));
        return beta.resend_api_key?.trim();
      } catch {
        return '';
      }
    })();

  if (!dkimTxt && resendKey) {
    try {
      dkimTxt = await fetchResendDkim(resendKey);
      console.log('✓ DKIM récupéré depuis l’API Resend.\n');
    } catch (e) {
      console.warn(`⚠ DKIM auto : ${e instanceof Error ? e.message : e}\n`);
    }
  }

  if (verifyOnly) {
    if (!env.IONOS_API_KEY) {
      console.warn('IONOS_API_KEY absent — contrôle API IONOS ignoré.\n');
    }
    if (env.IONOS_API_KEY) {
      const zoneId = await ionosFindZoneId();
      const records = await ionosListRecords(zoneId);
      console.log('IONOS :');
      for (const [name, type, hint] of [
        ['@', 'TXT', 'resend-domain-verification'],
        ['resend._domainkey', 'TXT', 'p='],
        ['send', 'TXT', 'spf1'],
        ['send', 'MX', 'amazonses'],
      ]) {
        console.log(`  ${hasRecord(records, name, type, hint) ? '✓' : '✗'} ${type} ${name}`);
      }
    }
    try {
      const records = await netlifyListRecords();
      console.log('Netlify DNS :');
      for (const [host, type, hint] of [
        [ZONE_NAME, 'TXT', 'resend-domain-verification'],
        ['resend._domainkey.proday75.fr', 'TXT', 'p='],
        ['send.proday75.fr', 'TXT', 'spf1'],
        ['send.proday75.fr', 'MX', 'amazonses'],
      ]) {
        const ok = records.some(
          (r) => r.hostname === host && r.type === type && String(r.value).includes(hint)
        );
        console.log(`  ${ok ? '✓' : '✗'} ${type} ${host}`);
      }
    } catch (e) {
      console.warn('Netlify :', e instanceof Error ? e.message : e);
    }
    await verifyPublic();
    return;
  }

  const verifyTxt = verificationTxtFromEnv();
  if (!dkimTxt && !verifyTxt) {
    console.error(
      'Rien à publier. Ajoutez RESEND_DOMAIN_VERIFICATION et/ou RESEND_DKIM_TXT dans .env\n' +
        '(DKIM : copié depuis Resend, ou RESEND_API_KEY avec droits domaines — pas send-only).'
    );
    process.exit(1);
  }
  if (!dkimTxt) {
    console.warn(
      '⚠ DKIM absent — seule la TXT de vérification domaine sera créée (si IONOS/Netlify disponible).\n' +
        '   Il restera : resend._domainkey TXT, send TXT (SPF), send MX.\n'
    );
  }

  let created = false;

  if (env.IONOS_API_KEY) {
    console.log('Provider : IONOS DNS API');
    const zoneId = await ionosFindZoneId();
    await applyRecords(
      'IONOS',
      () => ionosListRecords(zoneId),
      (name, type, value, priority) => ionosCreate(zoneId, name === '@' ? '@' : name, type, value, priority),
      buildResendPlan(dkimTxt)
    );
    created = true;
  } else {
    console.warn('IONOS_API_KEY absent — saut IONOS.\n');
  }

  try {
    console.log('Provider : Netlify DNS');
    await applyRecords(
      'Netlify',
      netlifyListRecords,
      (host, type, value, priority) => {
        const hostname = host === '@' ? ZONE_NAME : `${host}.${ZONE_NAME}`;
        return netlifyCreate(hostname, type, value, priority);
      },
      buildResendPlan(dkimTxt)
    );
    created = true;
    console.log(
      '\nNote : les NS publics pointent encore vers IONOS (ui-dns.*).\n' +
        'Les enregistrements Netlify ne seront actifs qu’après bascule NS vers :\n' +
        '  dns1.p05.nsone.net · dns2.p05.nsone.net · dns3.p05.nsone.net · dns4.p05.nsone.net\n'
    );
  } catch (e) {
    console.warn('Netlify DNS :', e instanceof Error ? e.message : e);
  }

  if (!created) {
    console.error(
      'Aucun provider disponible.\n' +
        'Ajoutez IONOS_API_KEY dans .env (https://developer.hosting.ionos.com/keys)\n' +
        'ou connectez Netlify CLI : netlify login'
    );
    process.exit(1);
  }

  await verifyPublic();
  console.log('\n→ Resend : cliquez « Verify DNS Records » dans 5–30 min.');
}

main().catch((e) => {
  console.error('✗', e.message);
  process.exit(1);
});
