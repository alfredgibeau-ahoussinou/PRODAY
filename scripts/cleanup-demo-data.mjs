/**
 * Supprime les comptes et données fictives (seed / démo) de Firebase.
 * Les utilisateurs réels (inscription dans l’app) ne sont pas touchés.
 *
 *   npm run cleanup:demo
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const DEMO_AUTH_UIDS = ['seed_player_1', 'seed_coach_1', 'seed_agent_1'];
const DEMO_AUTH_EMAILS = [
  'lucas.demo@proday.app',
  'marc.demo@proday.app',
  'karim.demo@proday.app',
];

const SEED_DOC_PREFIXES = [
  { collection: 'users', ids: DEMO_AUTH_UIDS },
  { collection: 'clubs', ids: ['seed_club_1', 'seed_club_2'] },
  { collection: 'recruitment_posts', ids: ['seed_post_1'] },
  { collection: 'tournaments', ids: ['seed_tournament_1', 'seed_tournament_2'] },
  { collection: 'friendly_matches', ids: ['seed_match_1', 'seed_match_2'] },
  { collection: 'sponsor_offers', ids: ['seed_offer_1'] },
  { collection: 'club_funding_goals', ids: ['seed_goal_1'] },
  { collection: 'message_threads', ids: ['seed_thread_1'] },
];

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

const env = loadEnv();
const projectId = env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'proday-155b0';
const serviceAccountPath = findServiceAccount();

if (getApps().length === 0) {
  if (!existsSync(serviceAccountPath)) {
    console.error('Service account requis : firebase/*adminsdk*.json');
    process.exit(1);
  }
  const sa = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  initializeApp({ credential: cert(sa), projectId });
}

const db = getFirestore();
const auth = getAuth();

async function deleteAuthUser(uid) {
  try {
    await auth.deleteUser(uid);
    console.log(`  auth supprimé : ${uid}`);
  } catch (e) {
    if (e.code !== 'auth/user-not-found') console.warn(`  auth ${uid}: ${e.message}`);
  }
}

async function deleteAuthByEmail(email) {
  try {
    const user = await auth.getUserByEmail(email);
    await auth.deleteUser(user.uid);
    console.log(`  auth supprimé : ${email}`);
  } catch (e) {
    if (e.code !== 'auth/user-not-found') console.warn(`  auth ${email}: ${e.message}`);
  }
}

async function cleanup() {
  console.log(`Projet : ${projectId}\nSuppression des données démo…\n`);

  for (const uid of DEMO_AUTH_UIDS) await deleteAuthUser(uid);
  for (const email of DEMO_AUTH_EMAILS) await deleteAuthByEmail(email);

  for (const { collection, ids } of SEED_DOC_PREFIXES) {
    for (const id of ids) {
      await db.collection(collection).doc(id).delete();
      console.log(`  ${collection}/${id}`);
    }
  }

  console.log(
    '\n✔ Données démo supprimées. L’app utilise uniquement les comptes créés via Inscription.'
  );
}

cleanup().catch((err) => {
  console.error('\n✖ Échec :', err.message);
  process.exit(1);
});
