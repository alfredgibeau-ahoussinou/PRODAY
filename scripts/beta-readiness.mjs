/**
 * Vérifications avant bêta / production.
 *   npm run beta:check
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

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

function ok(label) {
  console.log(`✅ ${label}`);
}

function warn(label) {
  console.log(`⚠️  ${label}`);
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

if (env.EXPO_PUBLIC_APP_ENV === 'production') ok('APP_ENV=production');
else warn(`APP_ENV=${env.EXPO_PUBLIC_APP_ENV ?? 'non défini'} (mettre production pour les stores)`);

const sa = resolve(root, 'firebase/service-account.json');
const saGlob = existsSync(resolve(root, 'firebase'))
  ? existsSync(sa)
  : false;
if (saGlob) ok('Service account Firebase (scripts admin)');
else warn('firebase/service-account.json absent — scripts seed/admin limités');

console.log('\n🧪 Tests automatisés\n');

for (const [cmd, args, label] of [
  ['npm', ['run', 'typecheck'], 'TypeScript'],
  ['npm', ['test', '--', '--passWithNoTests'], 'Jest'],
  ['npm', ['run', 'firebase:rules:test'], 'Firestore rules'],
] as const) {
  const r = spawnSync(cmd, args, { cwd: root, stdio: 'pipe', encoding: 'utf8' });
  if (r.status === 0) ok(label);
  else {
    fail(label);
    if (r.stdout) console.log(r.stdout.slice(-800));
    if (r.stderr) console.log(r.stderr.slice(-800));
  }
}

console.log('\n📋 Déploiement manuel restant\n');
console.log('   npm run firebase:deploy');
console.log('   npm run firebase:deploy:functions');
console.log('   npm run firebase:deploy:storage');
console.log('   npm run eas:build:production');
console.log('   docs/STORE_RELEASE.md\n');

if (failed > 0) {
  console.log(`❌ ${failed} contrôle(s) en échec.\n`);
  process.exit(1);
}

console.log('✅ Prêt pour la bêta (hors soumission stores).\n');
