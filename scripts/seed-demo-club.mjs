/**
 * Crée un club démo complet (compte club + coach + équipes + effectif stade).
 *
 *   npm run seed:demo-club
 *   npm run seed:demo-club -- --force
 *
 * Mot de passe (ne pas committer) :
 *   DEMO_CLUB_PASSWORD=...   (défaut ProDayDemo2026!)
 *
 * Optionnel — rattacher un compte existant comme propriétaire :
 *   DEMO_CLUB_OWNER_EMAIL=toi@exemple.com
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
const TEAM_U17_ID = 'proday_demo_team_u17';
const CLUB_EMAIL = 'club.demo@proday.app';
const COACH_EMAIL = 'coach.demo@proday.app';
const CLUB_AUTH_UID = 'proday_demo_club_owner';
const COACH_AUTH_UID = 'proday_demo_coach';

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
  process.env.DEMO_CLUB_PASSWORD ||
  env.DEMO_CLUB_PASSWORD ||
  'ProDayDemo2026!';
const OWNER_EMAIL = (
  process.env.DEMO_CLUB_OWNER_EMAIL ||
  env.DEMO_CLUB_OWNER_EMAIL ||
  ''
)
  .trim()
  .toLowerCase();

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

/** Effectif Seniors — postes pour le stade 3D. */
const SENIORS_ROSTER = [
  { id: '01', name: 'Hugo Morel', position: 'Gardien', jersey: 1 },
  { id: '02', name: 'Adam Benali', position: 'Défenseur', jersey: 2 },
  { id: '03', name: 'Enzo Martin', position: 'Défenseur', jersey: 4 },
  { id: '04', name: 'Lucas Petit', position: 'Défenseur', jersey: 5 },
  { id: '05', name: 'Yanis Diallo', position: 'Défenseur', jersey: 3 },
  { id: '06', name: 'Noah Garcia', position: 'Milieu', jersey: 6 },
  { id: '07', name: 'Theo Roux', position: 'Milieu', jersey: 8 },
  { id: '08', name: 'Sami Khelifi', position: 'Milieu', jersey: 10 },
  { id: '09', name: 'Jules Bernard', position: 'Milieu', jersey: 14 },
  { id: '10', name: 'Maxime Lefevre', position: 'Attaquant', jersey: 7 },
  { id: '11', name: 'Rayan Okito', position: 'Attaquant', jersey: 9 },
  { id: '12', name: 'Ilan Costa', position: 'Attaquant', jersey: 11 },
  { id: '13', name: 'Paul Nguyen', position: 'Milieu', jersey: 17 },
  { id: '14', name: 'Mathis Blanc', position: 'Défenseur', jersey: 15 },
  { id: '15', name: 'Tom Ferreira', position: 'Gardien', jersey: 16 },
];

const U17_ROSTER = [
  { id: '01', name: 'Léo Marchand', position: 'Gardien', jersey: 1 },
  { id: '02', name: 'Ethan Durand', position: 'Défenseur', jersey: 4 },
  { id: '03', name: 'Noah Silva', position: 'Milieu', jersey: 8 },
  { id: '04', name: 'Aaron Mbala', position: 'Attaquant', jersey: 9 },
  { id: '05', name: 'Gabriel Rossi', position: 'Milieu', jersey: 6 },
  { id: '06', name: 'Aaron Chevalier', position: 'Défenseur', jersey: 2 },
  { id: '07', name: 'Maël Torres', position: 'Attaquant', jersey: 11 },
  { id: '08', name: 'Noa Vidal', position: 'Défenseur', jersey: 5 },
];

async function main() {
  console.log(`\n🏟️  Seed club démo — ${projectId}${force ? ' (--force)' : ''}\n`);

  let clubOwnerUid = CLUB_AUTH_UID;
  if (OWNER_EMAIL) {
    const existing = await auth.getUserByEmail(OWNER_EMAIL);
    clubOwnerUid = existing.uid;
    console.log(`  → propriétaire rattaché : ${OWNER_EMAIL} (${clubOwnerUid})`);
  } else {
    clubOwnerUid = await ensureAuthUser({
      uid: CLUB_AUTH_UID,
      email: CLUB_EMAIL,
      displayName: 'FC ProDay Démo',
      password: PASSWORD,
    });
  }

  const coachUid = await ensureAuthUser({
    uid: COACH_AUTH_UID,
    email: COACH_EMAIL,
    displayName: 'Marc Coach Démo',
    password: PASSWORD,
  });

  await upsertDoc(`users/${clubOwnerUid}`, {
    display_name: 'FC ProDay Démo',
    email: OWNER_EMAIL || CLUB_EMAIL,
    role: 'club',
    product_line: 'pro_club',
    app_space: 'men',
    is_verified: true,
    verification_status: 'VERIFIED',
    is_active: true,
    email_verified: true,
    onboarding_documents_submitted: true,
    city: 'Lyon',
    department: '69',
    subscription_tier: 'pro',
    subscription_plan_id: 'club_premium',
    subscription_status: 'active',
    profile: {
      club_id: CLUB_ID,
      club_name: 'FC ProDay Démo',
      job_title: 'Président',
    },
    updated_at: FieldValue.serverTimestamp(),
    created_at: FieldValue.serverTimestamp(),
  });

  await upsertDoc(`users/${coachUid}`, {
    display_name: 'Marc Coach Démo',
    email: COACH_EMAIL,
    role: 'coach',
    product_line: 'pro_staff',
    app_space: 'men',
    is_verified: true,
    verification_status: 'VERIFIED',
    is_active: true,
    email_verified: true,
    onboarding_documents_submitted: true,
    city: 'Lyon',
    department: '69',
    subscription_tier: 'pro',
    subscription_plan_id: 'coach_pro',
    subscription_status: 'active',
    profile: {
      club_id: CLUB_ID,
      club_name: 'FC ProDay Démo',
      job_title: 'Entraîneur Seniors',
    },
    updated_at: FieldValue.serverTimestamp(),
    created_at: FieldValue.serverTimestamp(),
  });

  await upsertDoc(`clubs/${CLUB_ID}`, {
    name: 'FC ProDay Démo',
    city: 'Lyon',
    department: '69',
    level: 'R2',
    location: { latitude: 45.764, longitude: 4.8357 },
    verified: true,
    categories: ['Seniors', 'U17'],
    sponsor_ids: [],
    owner_uid: clubOwnerUid,
    is_active: true,
    is_demo: true,
    created_at: FieldValue.serverTimestamp(),
  });

  await upsertDoc(`teams/${TEAM_SENIORS_ID}`, {
    club_id: CLUB_ID,
    name: 'Seniors A',
    category: 'Seniors',
    gender_scope: 'men',
    coach_uids: [coachUid],
    is_default: true,
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
  });

  await upsertDoc(`teams/${TEAM_U17_ID}`, {
    club_id: CLUB_ID,
    name: 'U17',
    category: 'U17',
    gender_scope: 'men',
    coach_uids: [coachUid],
    is_default: false,
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
  });

  const seedRoster = async (roster, teamId, category, prefix) => {
    for (const p of roster) {
      const uid = `proday_demo_player_${prefix}${p.id}`;
      await upsertDoc(`users/${uid}`, {
        display_name: p.name,
        email: `${uid}@demo.proday.app`,
        role: 'player',
        product_line: 'amateur',
        app_space: 'men',
        is_verified: true,
        verification_status: 'VERIFIED',
        is_active: true,
        is_demo: true,
        city: 'Lyon',
        department: '69',
        profile: {
          club_id: CLUB_ID,
          position: p.position,
          jersey_number: p.jersey,
          category,
          level: 'Régional',
          strong_foot: p.jersey % 2 === 0 ? 'left' : 'right',
          availability: 'available',
        },
        updated_at: FieldValue.serverTimestamp(),
        created_at: FieldValue.serverTimestamp(),
      });

      await upsertDoc(`memberships/proday_demo_mem_${prefix}${p.id}`, {
        club_id: CLUB_ID,
        team_id: teamId,
        player_uid: uid,
        player_name: p.name,
        status: 'active',
        license_number: `DEMO-${prefix.toUpperCase()}${p.jersey}`,
        requested_at: FieldValue.serverTimestamp(),
        validated_at: FieldValue.serverTimestamp(),
        validated_by_uid: clubOwnerUid,
        created_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
      });
    }
  };

  await seedRoster(SENIORS_ROSTER, TEAM_SENIORS_ID, 'Seniors', 's');
  await seedRoster(U17_ROSTER, TEAM_U17_ID, 'U17', 'u');

  await upsertDoc('club_announcements/proday_demo_annonce_1', {
    club_id: CLUB_ID,
    author_uid: clubOwnerUid,
    author_name: 'FC ProDay Démo',
    title: 'Bienvenue sur le club démo',
    body: 'Effectif Seniors + U17 prêts pour le stade 3D, le FOC coach et les modules club.',
    created_at: FieldValue.serverTimestamp(),
  });

  console.log('\n✔ Club démo prêt');
  console.log(`  Club ID : ${CLUB_ID}`);
  console.log(`  Nom     : FC ProDay Démo (Lyon)`);
  console.log(`  Équipes : Seniors A (${SENIORS_ROSTER.length}) · U17 (${U17_ROSTER.length})`);
  console.log('\nConnexion :');
  console.log(`  Club  : ${OWNER_EMAIL || CLUB_EMAIL}`);
  console.log(`  Coach : ${COACH_EMAIL}`);
  console.log(`  MDP   : ${PASSWORD}`);
  console.log('\n→ Structure / Effectif & stade pour jouer joueur par joueur + bande-son.\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
