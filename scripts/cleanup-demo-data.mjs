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

const DEMO_AUTH_UIDS = [
  'seed_player_1',
  'seed_coach_1',
  'seed_agent_1',
  'proday_demo_club_owner',
  'proday_demo_coach',
  'proday_demo_player_login',
  'proday_demo_parent_login',
];
const DEMO_AUTH_EMAILS = [
  'lucas.demo@proday.app',
  'marc.demo@proday.app',
  'karim.demo@proday.app',
  'club.demo@proday.app',
  'coach.demo@proday.app',
  'player.demo@proday.app',
  'parent.demo@proday.app',
];

const SEED_DOC_PREFIXES = [
  { collection: 'users', ids: DEMO_AUTH_UIDS },
  { collection: 'clubs', ids: ['seed_club_1', 'seed_club_2', 'proday_demo_club'] },
  { collection: 'teams', ids: ['proday_demo_team_seniors', 'proday_demo_team_u17'] },
  { collection: 'recruitment_posts', ids: ['seed_post_1'] },
  { collection: 'tournaments', ids: ['seed_tournament_1', 'seed_tournament_2'] },
  { collection: 'friendly_matches', ids: ['seed_match_1', 'seed_match_2'] },
  { collection: 'sponsor_offers', ids: ['seed_offer_1'] },
  { collection: 'club_funding_goals', ids: ['seed_goal_1'] },
  { collection: 'message_threads', ids: ['seed_thread_1'] },
  { collection: 'team_events', ids: ['proday_demo_event_training_today'] },
  { collection: 'memberships', ids: ['proday_demo_mem_player_login'] },
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

async function deleteSyntheticUsers() {
  console.log('\nRecherche des profils synthétiques (scale / démo)…');
  const snap = await db.collection('users').get();
  let removed = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const uid = doc.id;
    const email = String(data.email ?? '').toLowerCase();
    const displayName = String(data.display_name ?? '');

    const synthetic =
      uid.startsWith('seed_') ||
      uid.startsWith('scale-u') ||
      uid.startsWith('proday_seed') ||
      uid.startsWith('proday_demo') ||
      email.endsWith('@scale.test') ||
      email.includes('.demo@') ||
      email.includes('@demo.proday.app') ||
      Boolean(data.is_demo) ||
      /^Joueur \d+$/.test(displayName.trim());

    if (!synthetic) continue;

    await doc.ref.delete();
    removed += 1;
    console.log(`  users/${uid}`);
    await deleteAuthUser(uid);
    if (email) await deleteAuthByEmail(email);
  }

  console.log(removed > 0 ? `  → ${removed} profil(s) synthétique(s) supprimé(s)` : '  → aucun profil synthétique trouvé');
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

  // Memberships + annonces club démo
  for (const col of ['memberships', 'club_announcements']) {
    const snap = await db.collection(col).get();
    for (const doc of snap.docs) {
      const data = doc.data();
      if (
        doc.id.startsWith('proday_demo_') ||
        data.club_id === 'proday_demo_club' ||
        data.is_demo
      ) {
        await doc.ref.delete();
        console.log(`  ${col}/${doc.id}`);
      }
    }
  }

  await deleteSyntheticUsers();

  console.log(
    '\n✔ Données démo supprimées. L’app utilise uniquement les comptes créés via Inscription.'
  );
}

cleanup().catch((err) => {
  console.error('\n✖ Échec :', err.message);
  process.exit(1);
});
