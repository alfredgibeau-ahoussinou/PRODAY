/**
 * Diagnostic Firebase ProDay (Firestore, Auth, Storage, stats).
 *
 *   npm run firebase:health
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

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

function findServiceAccount() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return process.env.GOOGLE_APPLICATION_CREDENTIALS;
  }
  const fixed = resolve(root, 'firebase/service-account.json');
  if (existsSync(fixed)) return fixed;
  const firebaseDir = resolve(root, 'firebase');
  if (existsSync(firebaseDir)) {
    const found = readdirSync(firebaseDir).find(
      (f) => f.includes('adminsdk') && f.endsWith('.json')
    );
    if (found) return resolve(firebaseDir, found);
  }
  return fixed;
}

async function countCollection(db, name, filter) {
  let q = db.collection(name);
  if (filter) q = q.where(filter.field, filter.op, filter.value);
  const snap = await q.count().get();
  return snap.data().count;
}

const env = loadEnv();
const projectId = env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'proday-155b0';
const storageBucket =
  env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`;
const saPath = findServiceAccount();

if (!existsSync(saPath)) {
  console.error('❌ Service account manquant : firebase/*adminsdk*.json');
  process.exit(1);
}

if (getApps().length === 0) {
  initializeApp({
    credential: cert(JSON.parse(readFileSync(saPath, 'utf8'))),
    projectId,
    storageBucket,
  });
}

const db = getFirestore();
const auth = getAuth();

console.log(`\n🔥 Firebase Health — ${projectId}\n`);

const envOk = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
].every((k) => Boolean(env[k]?.trim()));

console.log(envOk ? '✅ .env — clés Expo présentes' : '⚠️  .env — clés manquantes');

try {
  const users = await auth.listUsers(10);
  console.log(`✅ Auth — ${users.users.length}+ compte(s) (aperçu ${users.users.length})`);
} catch (e) {
  console.log('❌ Auth —', e.message);
}

const collections = [
  'users',
  'clubs',
  'recruitment_posts',
  'tournaments',
  'friendly_matches',
  'team_events',
  'team_payment_requests',
  'sponsor_offers',
  'club_funding_goals',
  'platform_stats',
];

console.log('\n📊 Firestore');
for (const name of collections) {
  try {
    const n = await countCollection(db, name);
    console.log(`   ${name}: ${n}`);
  } catch (e) {
    console.log(`   ${name}: erreur (${e.message})`);
  }
}

try {
  const statsSnap = await db.collection('platform_stats').doc('recruitment').get();
  if (statsSnap.exists) {
    console.log('\n✅ platform_stats/recruitment — OK');
  } else {
    console.log('\n⚠️  platform_stats/recruitment — absent (lancer npm run stats:refresh)');
  }
} catch (e) {
  console.log('\n❌ platform_stats —', e.message);
}

console.log('\n📦 Storage');
try {
  const bucket = getStorage().bucket(storageBucket);
  const [exists] = await bucket.exists();
  if (exists) {
    console.log(`✅ Bucket actif : ${storageBucket}`);
    console.log('   → npm run firebase:deploy:storage (règles)');
  } else {
    console.log(`❌ Bucket introuvable : ${storageBucket}`);
    console.log(
      '   → Console : https://console.firebase.google.com/project/' +
        projectId +
        '/storage → Commencer'
    );
  }
} catch (e) {
  console.log('❌ Storage —', e.message);
  console.log(
    '   → Activer Storage : https://console.firebase.google.com/project/' +
      projectId +
      '/storage'
  );
}

console.log('\n☁️  Cloud Functions');
console.log('   Plan Blaze requis pour deploy functions');
console.log(
  '   → https://console.firebase.google.com/project/' + projectId + '/usage/details'
);

console.log('\n📋 Commandes utiles');
console.log('   npm run firebase:deploy     # règles Firestore + index + stats');
console.log('   docs/FIRESTORE_DEPLOY.md    # checklist post-déploiement');
console.log('   npm run firebase:seed       # données de démo Firestore');
console.log('   npm run stats:refresh       # compteurs page Discover');
console.log('   npx expo start --clear      # recharger .env\n');
