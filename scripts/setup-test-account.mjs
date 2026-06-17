/**
 * Synchronise un compte joueur actif (Auth + profil Firestore).
 * Ne commitez jamais le mot de passe.
 *
 *   TEST_ACCOUNT_EMAIL=alfredgibeauahoussinou@gmail.com \
 *   TEST_ACCOUNT_PASSWORD='***' \
 *   npm run test-account:setup
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const EMAIL = (process.env.TEST_ACCOUNT_EMAIL || 'alfredgibeauahoussinou@gmail.com')
  .trim()
  .toLowerCase();
const PASSWORD = process.env.TEST_ACCOUNT_PASSWORD;

function findServiceAccount() {
  const firebaseDir = resolve(root, 'firebase');
  if (existsSync(firebaseDir)) {
    const found = readdirSync(firebaseDir).find(
      (f) => f.includes('adminsdk') && f.endsWith('.json')
    );
    if (found) return resolve(firebaseDir, found);
  }
  return resolve(firebaseDir, 'service-account.json');
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

if (!PASSWORD || PASSWORD.length < 8) {
  console.error('Définissez TEST_ACCOUNT_PASSWORD (8+ caractères).');
  process.exit(1);
}

const env = loadEnv();
const projectId = env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'proday-155b0';
const saPath = findServiceAccount();

if (!existsSync(saPath)) {
  console.error(`Service account introuvable : ${saPath}`);
  process.exit(1);
}

if (getApps().length === 0) {
  initializeApp({
    credential: cert(JSON.parse(readFileSync(saPath, 'utf8'))),
    projectId,
  });
}

const auth = getAuth();
const db = getFirestore();

const user = await auth.getUserByEmail(EMAIL);
await auth.updateUser(user.uid, { password: PASSWORD, emailVerified: true });

await db.doc(`users/${user.uid}`).set(
  {
    display_name: 'Alfred Ahoussinou',
    email: EMAIL,
    role: 'player',
    product_line: 'homme',
    app_space: 'men',
    is_verified: true,
    verification_status: 'VERIFIED',
    is_active: true,
    is_universal_test_account: FieldValue.delete(),
    email_verified: true,
    onboarding_documents_submitted: true,
    city: 'Paris',
    department: '75',
    profile: {
      position: 'Milieu',
      category: 'Seniors',
      level: 'Régional',
      strong_foot: 'right',
      availability: 'available',
      bio: 'Joueur ProDay — foot amateur et semi-pro, disponible pour convocations et détections.',
      cv_headline: 'Milieu relayeur — vision du jeu et volume physique.',
      cv_objectives: 'Évoluer en R2 / N3 et intégrer un projet club structuré.',
      season_stats: { matches: 18, goals: 4, assists: 6 },
    },
    player_verification: {
      identity: { status: 'verified' },
      club_license: { status: 'verified' },
    },
    last_active_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
  },
  { merge: true }
);

const doc = await db.doc(`users/${user.uid}`).get();
const data = doc.data() || {};

console.log('✔ Compte joueur actif synchronisé');
console.log(`  Email : ${EMAIL}`);
console.log(`  UID   : ${user.uid}`);
console.log(`  Rôle  : ${data.role ?? '—'}`);
console.log(`  Pôle  : ${data.product_line ?? 'homme'} (Pro Day Man)`);
console.log(`  Nom   : ${data.display_name ?? user.displayName ?? '—'}`);
console.log('\n→ Compte standard joueur — plus de bypass multi-univers ni rôle kiné simulé.');
