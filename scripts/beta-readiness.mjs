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
const siteUrl = process.env.BETA_SITE_URL?.trim() || 'https://proday75.netlify.app';

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

async function checkSite() {
  const paths = ['/confidentialite', '/cgu', '/beta'];
  for (const path of paths) {
    try {
      const res = await fetch(`${siteUrl}${path}`, { method: 'GET', redirect: 'follow' });
      if (res.ok) ok(`${siteUrl}${path} → ${res.status}`);
      else fail(`${siteUrl}${path} → ${res.status}`);
    } catch (err) {
      warn(`${siteUrl}${path} — inaccessible (${err instanceof Error ? err.message : err})`);
    }
  }

  try {
    const res = await fetch(`${siteUrl}/api/beta`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `beta-check-${Date.now()}@example.com`, role: 'player' }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok && body.emailSent) ok(`API bêta — emailSent (${siteUrl})`);
    else if (res.ok) warn(`API bêta — ${res.status} mais emailSent=false`);
    else warn(`API bêta — ${res.status} (vérifier EmailJS sur Netlify)`);
  } catch (err) {
    warn(`API bêta — inaccessible (${err instanceof Error ? err.message : err})`);
  }
}

await checkSite();

console.log('\n📋 Étapes manuelles restantes\n');
console.log('   cd website && npm run netlify:deploy');
console.log('   eas build --profile preview --platform ios');
console.log('   npm run eas:build:preview -- --platform android');
console.log('   docs/BETA_LAUNCH.md\n');

if (failed > 0) {
  console.log(`❌ ${failed} contrôle(s) en échec, ${warned} avertissement(s).\n`);
  process.exit(1);
}

console.log(`✅ Prêt pour la bêta fermée (${warned} avertissement(s) — voir ci-dessus).\n`);
