/**
 * Crée un compte joueur démo (Auth + profil + membership FC ProDay Démo).
 *
 *   npm run seed:demo-player
 *   npm run seed:demo-player -- --force
 *
 * Mot de passe :
 *   DEMO_PLAYER_PASSWORD=...   (sinon DEMO_CLUB_PASSWORD, sinon ProDayDemo2026!)
 *
 * Connexion : lancer **Pro Day Joueur** (Amateur ou Pro Joueur) au carousel.
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const force = process.argv.includes('--force');

const CLUB_ID = 'proday_demo_club';
const TEAM_SENIORS_ID = 'proday_demo_team_seniors';
const PLAYER_EMAIL = 'player.demo@proday.app';
const PLAYER_AUTH_UID = 'proday_demo_player_login';
const MEMBERSHIP_ID = 'proday_demo_mem_player_login';

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
  process.env.DEMO_PLAYER_PASSWORD ||
  env.DEMO_PLAYER_PASSWORD ||
  process.env.DEMO_CLUB_PASSWORD ||
  env.DEMO_CLUB_PASSWORD ||
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

async function upsertDoc(path, data) {
  const ref = db.doc(path);
  if (!force) {
    const existing = await ref.get();
    if (existing.exists) {
      console.log(`  skip ${path}`);
      return false;
    }
  }
  await ref.set(data, { merge: true });
  console.log(`  ✓ ${path}`);
  return true;
}

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
  console.log(`\n⚽ Seed joueur démo — ${projectId}${force ? ' (--force)' : ''}\n`);

  const playerUid = await ensureAuthUser({
    uid: PLAYER_AUTH_UID,
    email: PLAYER_EMAIL,
    displayName: 'Lucas Démo',
    password: PASSWORD,
  });

  await upsertDoc(`users/${playerUid}`, {
    display_name: 'Lucas Démo',
    email: PLAYER_EMAIL,
    role: 'player',
    /** Pôle Joueur — UX jeu vidéo (Amateur + Pro Joueur). */
    product_line: 'pro_player',
    app_space: 'men',
    is_verified: true,
    verification_status: 'VERIFIED',
    is_active: true,
    is_demo: true,
    email_verified: true,
    onboarding_documents_submitted: true,
    city: 'Lyon',
    department: '69',
    subscription_tier: 'pro',
    subscription_plan_id: 'player_pro',
    subscription_status: 'active',
    profile: {
      club_id: CLUB_ID,
      club_name: 'FC ProDay Démo',
      position: 'Milieu',
      jersey_number: 8,
      category: 'Seniors',
      level: 'Régional',
      strong_foot: 'right',
      gender: 'men',
      /** Univers adult — évolue à l’anniversaire. */
      birth_date: '2002-05-15',
      age: 24,
      availability: 'available',
      bio: 'Milieu relayeur — compte démo ProDay (univers jeu vidéo 18+).',
      cv_headline: 'Milieu — vision et volume.',
      season_stats: { matches: 12, goals: 3, assists: 5 },
    },
    player_verification: {
      identity: { status: 'verified' },
      club_license: { status: 'verified' },
    },
    updated_at: FieldValue.serverTimestamp(),
    created_at: FieldValue.serverTimestamp(),
  });

  const clubSnap = await db.doc(`clubs/${CLUB_ID}`).get();
  if (!clubSnap.exists) {
    console.warn(
      `  ⚠ Club ${CLUB_ID} absent — lance d’abord : npm run seed:demo-club -- --force`,
    );
  }

  await upsertDoc(`memberships/${MEMBERSHIP_ID}`, {
    club_id: CLUB_ID,
    team_id: TEAM_SENIORS_ID,
    player_uid: playerUid,
    player_name: 'Lucas Démo',
    status: 'active',
    license_number: 'DEMO-PLAYER-8',
    requested_at: FieldValue.serverTimestamp(),
    validated_at: FieldValue.serverTimestamp(),
    validated_by_uid: 'proday_demo_club_owner',
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
  });

  console.log('\n✔ Joueur démo prêt (univers jeu · genre men · birth_date)');
  console.log(`  UID  : ${playerUid}`);
  console.log(`  Club : ${CLUB_ID} · Seniors A (#8 Milieu)`);
  console.log('\nConnexion :');
  console.log(`  Email : ${PLAYER_EMAIL}`);
  console.log(`  MDP   : ${PASSWORD}`);
  console.log('\n→ Au lancement, choisis « Pro Day Joueur ». Relance Metro si le HUD noir n’apparaît pas.');
  console.log('  Parent lié : npm run seed:demo-parent -- --force');
  console.log('  Relancer le seed : npm run seed:demo-player -- --force\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
