/**
 * Synchronise le compte test beta (Auth + email vérifié).
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
    is_verified: true,
    verification_status: 'VERIFIED',
    is_active: true,
    is_universal_test_account: true,
    email_verified: true,
    onboarding_documents_submitted: true,
    product_line: null,
    city: 'Paris',
    department: '75',
    profile: {
      medical_specialty: 'Kinésithérapeute du sport',
      job_title: 'Kiné du sport',
      booking_enabled: true,
      consultation_duration_min: 30,
      bio: 'Compte test ProDay — Man, Woman, Pro (coach) et Santé (kiné).',
    },
    updated_at: FieldValue.serverTimestamp(),
  },
  { merge: true }
);

const doc = await db.doc(`users/${user.uid}`).get();
const data = doc.data() || {};

console.log('✔ Compte test multi-pôles synchronisé');
console.log(`  Email : ${EMAIL}`);
console.log(`  UID   : ${user.uid}`);
console.log(`  Rôle  : ${data.role ?? '—'} (player — rôles simulés par univers)`);
console.log(`  Nom   : ${data.display_name ?? user.displayName ?? '—'}`);
console.log('\n→ Man / Woman : joueur · Pro : coach · Santé : kiné (physio)');
console.log('→ Email listé dans src/config/emailVerificationBypass.ts');
