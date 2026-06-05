/**
 * Compte démo partenaire (Auth + Firestore sponsor).
 *
 *   TEST_ACCOUNT_EMAIL=part@gmail.com \
 *   TEST_ACCOUNT_PASSWORD='Alfred2005@' \
 *   npm run partner-account:setup
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const EMAIL = (process.env.TEST_ACCOUNT_EMAIL || 'part@gmail.com').trim().toLowerCase();
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

let user;
try {
  user = await auth.getUserByEmail(EMAIL);
} catch (e) {
  if (e.code === 'auth/user-not-found') {
    user = await auth.createUser({
      email: EMAIL,
      password: PASSWORD,
      emailVerified: true,
      displayName: 'Partenaire Démo ProDay',
    });
    console.log('✔ Compte Auth créé');
  } else {
    throw e;
  }
}

await auth.updateUser(user.uid, { password: PASSWORD, emailVerified: true });

await db.doc(`users/${user.uid}`).set(
  {
    display_name: 'Partenaire Démo ProDay',
    email: EMAIL,
    role: 'sponsor',
    is_verified: true,
    verification_status: 'VERIFIED',
    is_active: true,
    is_partner_test_account: true,
    email_verified: true,
    onboarding_documents_submitted: true,
    product_line: 'pro',
    city: 'Paris',
    department: '75',
    profile: {
      job_title: 'SportEquip Partenaires',
      bio: 'Compte démo partenaire — campagnes locales, offres clubs et visibilité marque sur Pro Day Pro.',
    },
    updated_at: FieldValue.serverTimestamp(),
  },
  { merge: true }
);

const doc = await db.doc(`users/${user.uid}`).get();
const data = doc.data() || {};

console.log('✔ Compte partenaire démo synchronisé');
console.log(`  Email : ${EMAIL}`);
console.log(`  UID   : ${user.uid}`);
console.log(`  Rôle  : ${data.role ?? '—'}`);
console.log(`  Nom   : ${data.display_name ?? user.displayName ?? '—'}`);
console.log('\n→ Connectez-vous sur Pro Day Pro uniquement');
console.log('→ Expérience partenaire : bleu + or, Campagnes, Réseau, Marque');
console.log('→ Email listé dans src/config/emailVerificationBypass.ts');
