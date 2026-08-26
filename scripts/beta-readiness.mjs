/**
 * Vérifications avant bêta / production.
 *   npm run beta:check
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const siteUrl = process.env.BETA_SITE_URL?.trim() || 'https://proday75.fr';

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

const env = loadEnv();
let failed = 0;
let warned = 0;

function ok(label) {
  console.log(`✅ ${label}`);
}

function warn(label) {
  console.log(`⚠️  ${label}`);
  warned += 1;
}

function fail(label) {
  console.log(`❌ ${label}`);
  failed += 1;
}

console.log('\n🚀 ProDay — contrôle bêta\n');

const requiredFirebase = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
];

const missingFirebase = requiredFirebase.filter((k) => !env[k]?.trim());
if (missingFirebase.length === 0) ok('Firebase — variables .env présentes');
else fail(`Firebase — manquant : ${missingFirebase.join(', ')}`);

if (env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim()) ok('Firebase Storage bucket');
else warn('Firebase Storage bucket absent');

if (env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim()) ok('EAS Project ID (push)');
else warn('EXPO_PUBLIC_EAS_PROJECT_ID absent — push natif indisponible');

const googleWeb = env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
const googleIos = env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
const googleAndroid = env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim();
if (googleWeb) ok('Google OAuth — Web client ID');
else warn('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID absent — connexion Google indisponible');
if (googleIos || googleAndroid || googleWeb) {
  if (!googleWeb) warn('Google OAuth — Web client ID recommandé même avec clients natifs');
} else {
  warn('Aucun client Google OAuth configuré');
}

if (env.EXPO_PUBLIC_V3_SHELL === '1') ok('V3 shell activé (.env)');
else warn('EXPO_PUBLIC_V3_SHELL absent — activer pour la bêta (profil EAS preview le force)');

if (env.EXPO_PUBLIC_APP_ENV === 'production') ok('APP_ENV=production');
else warn(`APP_ENV=${env.EXPO_PUBLIC_APP_ENV ?? 'non défini'} (mettre production pour les stores)`);

const sa = resolve(root, 'firebase/service-account.json');
if (existsSync(sa)) ok('Service account Firebase (scripts admin)');
else warn('firebase/service-account.json absent — scripts seed/admin limités');

console.log('\n📄 Pages légales (code)\n');

const legalFiles = [
  ['website/src/app/confidentialite/page.tsx', '/confidentialite'],
  ['website/src/app/cgu/page.tsx', '/cgu'],
  ['website/src/content/legal.ts', 'contenu légal'],
];
for (const [rel] of legalFiles) {
  if (existsSync(resolve(root, rel))) ok(rel);
  else fail(`Manquant : ${rel}`);
}

console.log('\n🧪 Architecture bêta (code)\n');

const betaFiles = [
  ['website/src/app/beta/inscription/page.tsx', '/beta/inscription — inscription publique'],
  ['website/src/app/beta/(site)/page.tsx', '/beta — hub beta-testeurs'],
  ['website/src/app/beta/(site)/programme/page.tsx', '/beta/programme'],
  ['website/src/app/beta/(site)/installer/page.tsx', '/beta/installer'],
  ['website/src/app/beta/(site)/aide/page.tsx', '/beta/aide'],
  ['website/src/app/api/beta/route.ts', 'POST /api/beta'],
  ['website/src/app/api/beta/access/route.ts', 'GET /api/beta/access'],
  ['website/src/lib/rateLimit.ts', 'rate limit API bêta'],
  ['docs/BETA_GUIDE.md', 'guide opérateur'],
  ['docs/emailjs/beta-welcome.html', 'template email'],
];
for (const [rel, label] of betaFiles) {
  if (existsSync(resolve(root, rel))) ok(label);
  else fail(`Manquant : ${rel} (${label})`);
}

const eas = resolve(root, 'eas.json');
if (existsSync(eas)) {
  const easRaw = readFileSync(eas, 'utf8');
  if (easRaw.includes('EXPO_PUBLIC_V3_SHELL')) ok('EAS preview — V3_SHELL dans eas.json');
  else warn('eas.json — ajouter EXPO_PUBLIC_V3_SHELL au profil preview');
  if (easRaw.includes('REPLACE_WITH_APPLE_ID')) {
    warn('eas.json — renseigner appleId / ascAppId avant soumission stores');
  }
} else {
  fail('eas.json introuvable');
}

console.log('\n🧪 Tests automatisés\n');

const testSuites = [
  ['npm', ['run', 'typecheck'], 'TypeScript'],
  ['npm', ['test', '--', '--passWithNoTests'], 'Jest'],
  ['npm', ['run', 'firebase:rules:test'], 'Firestore rules'],
];

for (const [cmd, args, label] of testSuites) {
  const r = spawnSync(cmd, args, { cwd: root, stdio: 'pipe', encoding: 'utf8' });
  if (r.status === 0) ok(label);
  else {
    fail(label);
    if (r.stdout) console.log(r.stdout.slice(-800));
    if (r.stderr) console.log(r.stderr.slice(-800));
  }
}

console.log('\n🌐 Site production (optionnel)\n');

/** Node fetch peut échouer derrière certains proxies ; curl est le secours. */
function curlStatus(url, method = 'GET') {
  const r = spawnSync(
    'curl',
    ['-sS', '-o', '/dev/null', '-w', '%{http_code}', '-X', method, '--max-time', '20', '-L', url],
    { encoding: 'utf8' },
  );
  if (r.error || r.status !== 0) return null;
  const code = Number.parseInt(String(r.stdout).trim(), 10);
  return Number.isFinite(code) ? code : null;
}

async function httpStatus(url, method = 'GET') {
  try {
    const res = await fetch(url, { method, redirect: 'follow' });
    return res.status;
  } catch {
    return curlStatus(url, method);
  }
}

async function checkSite() {
  const paths = [
    '/confidentialite',
    '/cgu',
    '/beta/inscription',
    '/beta',
    '/beta/programme',
    '/beta/installer',
    '/beta/aide',
  ];
  for (const path of paths) {
    const status = await httpStatus(`${siteUrl}${path}`);
    if (status != null && status >= 200 && status < 400) ok(`${siteUrl}${path} → ${status}`);
    else if (status != null) fail(`${siteUrl}${path} → ${status}`);
    else warn(`${siteUrl}${path} — inaccessible (fetch failed)`);
  }

  const apiStatus = await httpStatus(`${siteUrl}/api/beta`, 'OPTIONS');
  if (apiStatus === 204 || apiStatus === 405) ok(`API bêta — endpoint présent (${siteUrl})`);
  else if (apiStatus != null) warn(`API bêta — ${apiStatus} (attendu OPTIONS 204 ou 405)`);
  else warn(`API bêta — inaccessible (fetch failed)`);
}

await checkSite();

console.log('\n📋 Étapes manuelles restantes\n');
console.log('   cd website && npm run netlify:deploy');
console.log('   npm run eas:build:testflight');
console.log('   npm run eas:submit:testflight');
console.log('   npm run eas:build:preview -- --platform android');
console.log('   docs/STORE_RELEASE.md + docs/BETA_GUIDE.md\n');

if (failed > 0) {
  console.log(`❌ ${failed} contrôle(s) en échec, ${warned} avertissement(s).\n`);
  process.exit(1);
}

console.log(`✅ Prêt pour la bêta fermée (${warned} avertissement(s) — voir ci-dessus).\n`);
