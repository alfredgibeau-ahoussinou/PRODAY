/**
 * Compte supporter démo — shell Accueil · Matchs · Compétitions · Mes clubs · Vidéos · Profil.
 *
 *   npm run seed:demo-supporter
 *
 * Connexion :
 *   Email : supporter.demo@proday.app
 *   MDP   : même cascade que les autres démos (ProDayDemo2026!)
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const SUPPORTER_EMAIL = 'supporter.demo@proday.app';
const SUPPORTER_AUTH_UID = 'proday_demo_supporter_login';

function loadEnv() {
  const path = resolve(root, '.env');
  if (!existsSync(path)) return {};
  const env = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

function findServiceAccount() {
  const fixed = resolve(root, 'firebase/service-account.json');
  if (existsSync(fixed)) return fixed;
  const firebaseDir = resolve(root, 'firebase');
  const found = readdirSync(firebaseDir).find(
    (f) => f.includes('adminsdk') && f.endsWith('.json'),
  );
  if (found) return resolve(firebaseDir, found);
  return fixed;
}

const env = loadEnv();
const projectId = env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'proday-155b0';
const PASSWORD =
  process.env.DEMO_SUPPORTER_PASSWORD ||
  env.DEMO_SUPPORTER_PASSWORD ||
  process.env.DEMO_PLAYER_PASSWORD ||
  env.DEMO_PLAYER_PASSWORD ||
  'ProDayDemo2026!';

if (getApps().length === 0) {
  const saPath = findServiceAccount();
  if (!existsSync(saPath)) {
    console.error('Service account requis : firebase/*adminsdk*.json');
    process.exit(1);
  }
  initializeApp({
    credential: cert(JSON.parse(readFileSync(saPath, 'utf8'))),
    projectId,
  });
}

const db = getFirestore();
const auth = getAuth();

async function ensureAuthUser({ uid, email, displayName, password }) {
  try {
    const byEmail = await auth.getUserByEmail(email);
    await auth.updateUser(byEmail.uid, {
      password,
      emailVerified: true,
      displayName,
      disabled: false,
    });
    console.log(`  ✓ auth ${email} (existant ${byEmail.uid})`);
    return byEmail.uid;
  } catch (e) {
    if (e?.code !== 'auth/user-not-found') throw e;
  }

  try {
    await auth.getUser(uid);
    await auth.updateUser(uid, {
      email,
      password,
      emailVerified: true,
      displayName,
      disabled: false,
    });
    console.log(`  ✓ auth uid ${uid} mis à jour → ${email}`);
    return uid;
  } catch (e) {
    if (e?.code !== 'auth/user-not-found') throw e;
  }

  const created = await auth.createUser({
    uid,
    email,
    password,
    emailVerified: true,
    displayName,
    disabled: false,
  });
  console.log(`  ✓ auth créé ${email} (${created.uid})`);
  return created.uid;
}

async function main() {
  console.log(`\n📣 Seed supporter démo — ${projectId}\n`);

  const supporterUid = await ensureAuthUser({
    uid: SUPPORTER_AUTH_UID,
    email: SUPPORTER_EMAIL,
    displayName: 'Alex Supporter Démo',
    password: PASSWORD,
  });

  await db.doc(`users/${supporterUid}`).set(
    {
      display_name: 'Alex Supporter Démo',
      email: SUPPORTER_EMAIL,
      role: 'supporter',
      product_line: 'supporter',
      is_verified: true,
      verification_status: 'NOT_REQUIRED',
      is_active: true,
      is_demo: true,
      email_verified: true,
      onboarding_documents_submitted: true,
      city: 'Paris',
      department: '75',
      profile: {
        job_title: 'Supporter',
        bio: 'Compte démo tribune ProDay — matchs, clubs favoris et fil communautaire.',
      },
      updated_at: FieldValue.serverTimestamp(),
      created_at: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  console.log(`  ✓ users/${supporterUid}`);
  console.log('\n✔ Supporter démo prêt');
  console.log('\nConnexion supporter :');
  console.log(`  Email : ${SUPPORTER_EMAIL}`);
  console.log(`  MDP   : ${PASSWORD}`);
  console.log('\n→ Dock : Accueil · Matchs · Compétitions · Mes clubs · Vidéos · Profil\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
