/**
 * Crée un compte parent démo lié à Lucas Démo (player.demo@proday.app).
 *
 *   npm run seed:demo-parent
 *   npm run seed:demo-parent -- --force
 *
 * Prérequis : npm run seed:demo-player (et idéalement seed:demo-club)
 *
 * Connexion : lancer l’app → rôle Parent / Pro Day Famille
 *   Email : parent.demo@proday.app
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
const force = process.argv.includes('--force');

const CLUB_ID = 'proday_demo_club';
const TEAM_U17_ID = 'proday_demo_team_u17';
const COACH_UID = 'proday_demo_coach';
const PLAYER_EMAIL = 'player.demo@proday.app';
const PLAYER_AUTH_UID = 'proday_demo_player_login';
const PARENT_EMAIL = 'parent.demo@proday.app';
const PARENT_AUTH_UID = 'proday_demo_parent_login';
const MEMBERSHIP_ID = 'proday_demo_mem_player_login';
const DEMO_EVENT_ID = 'proday_demo_event_training_today';

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
  process.env.DEMO_PARENT_PASSWORD ||
  env.DEMO_PARENT_PASSWORD ||
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

async function resolvePlayerUid() {
  try {
    const byEmail = await auth.getUserByEmail(PLAYER_EMAIL);
    return byEmail.uid;
  } catch {
    try {
      await auth.getUser(PLAYER_AUTH_UID);
      return PLAYER_AUTH_UID;
    } catch {
      return null;
    }
  }
}

async function main() {
  console.log(`\n👨‍👩‍👧 Seed parent démo — ${projectId}${force ? ' (--force)' : ''}\n`);

  const playerUid = await resolvePlayerUid();
  if (!playerUid) {
    console.error(
      `Joueur Lucas introuvable (${PLAYER_EMAIL}). Lance d’abord :\n  npm run seed:demo-player -- --force\n`,
    );
    process.exit(1);
  }

  const playerRef = db.doc(`users/${playerUid}`);
  const playerSnap = await playerRef.get();
  if (!playerSnap.exists) {
    console.error(`Profil Firestore users/${playerUid} absent. Relance seed:demo-player.`);
    process.exit(1);
  }

  const parentUid = await ensureAuthUser({
    uid: PARENT_AUTH_UID,
    email: PARENT_EMAIL,
    displayName: 'Sophie Parent Démo',
    password: PASSWORD,
  });

  const parentalSettings = {
    is_minor: true,
    guardian_name: 'Sophie Parent Démo',
    guardian_email: PARENT_EMAIL,
    parent_uid: parentUid,
    guardian_consent: true,
    supervision_enabled: true,
    contacts_filter_enabled: true,
    messaging_restricted: true,
    screen_time_enabled: true,
    daily_limit_minutes: 90,
    active_days: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
    approved_contacts: [
      {
        uid: COACH_UID,
        name: 'Marc Coach Démo',
        role: 'coach',
        approved: true,
      },
    ],
    emergency_contacts: [
      {
        id: 'demo_em_1',
        name: 'Sophie Parent Démo',
        phone: '06 12 34 56 78',
        relation: 'Mère',
      },
    ],
    privacy: {
      share_live_carpool: true,
      parent_can_read_messages: true,
      parent_can_access_medical: false,
    },
    unlock_request: {
      status: 'pending',
      minutes: 15,
      requested_at: new Date().toISOString(),
    },
  };

  // Lie Lucas au parent + passe en profil adolescent supervisé (portail parent).
  await playerRef.set(
    {
      app_space: 'boys',
      product_line: 'amateur',
      parental_settings: parentalSettings,
      parental_runtime: {
        date: new Date().toISOString().slice(0, 10),
        minutes_used: 22,
      },
      profile: {
        ...(playerSnap.data()?.profile ?? {}),
        club_id: CLUB_ID,
        club_name: 'FC ProDay Démo',
        position: 'Milieu',
        jersey_number: 8,
        category: 'U17',
        level: 'Régional',
        strong_foot: 'right',
        gender: 'men',
        birth_date: '2010-08-15',
        age: 15,
        availability: 'available',
        bio: 'Milieu U17 — compte démo ProDay (univers ado + supervision parent).',
        cv_headline: 'Milieu U17 — vision et volume.',
      },
      updated_at: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  console.log(`  ✓ users/${playerUid} lié (is_minor + parent_uid)`);

  await db.doc(`memberships/${MEMBERSHIP_ID}`).set(
    {
      club_id: CLUB_ID,
      team_id: TEAM_U17_ID,
      player_uid: playerUid,
      player_name: 'Lucas Démo',
      status: 'active',
      license_number: 'DEMO-PLAYER-8',
      updated_at: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  console.log(`  ✓ membership → ${TEAM_U17_ID}`);

  const parentPayload = {
    display_name: 'Sophie Parent Démo',
    email: PARENT_EMAIL,
    role: 'parent',
    product_line: 'parent',
    is_verified: true,
    verification_status: 'NOT_REQUIRED',
    is_active: true,
    is_demo: true,
    email_verified: true,
    city: 'Lyon',
    department: '69',
    parent_of: [playerUid],
    profile: {
      job_title: 'Parent',
    },
    updated_at: FieldValue.serverTimestamp(),
    created_at: FieldValue.serverTimestamp(),
  };

  const parentRef = db.doc(`users/${parentUid}`);
  if (!force) {
    const existing = await parentRef.get();
    if (existing.exists) {
      await parentRef.set(
        {
          parent_of: FieldValue.arrayUnion(playerUid),
          role: 'parent',
          product_line: 'parent',
          is_demo: true,
          updated_at: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      console.log(`  ✓ users/${parentUid} (merge parent_of)`);
    } else {
      await parentRef.set(parentPayload);
      console.log(`  ✓ users/${parentUid}`);
    }
  } else {
    await parentRef.set(parentPayload, { merge: true });
    console.log(`  ✓ users/${parentUid} (--force)`);
  }

  // Séance d’entraînement du jour pour tester les boutons retard.
  const starts = new Date();
  starts.setHours(18, 30, 0, 0);
  if (starts.getTime() < Date.now()) {
    starts.setDate(starts.getDate() + 1);
  }
  const ends = new Date(starts.getTime() + 90 * 60 * 1000);

  await db.doc(`team_events/${DEMO_EVENT_ID}`).set(
    {
      club_id: CLUB_ID,
      team_id: TEAM_U17_ID,
      title: 'Entraînement U17 — Démo',
      event_type: 'training',
      starts_at: starts,
      ends_at: ends,
      city: 'Lyon',
      location_label: 'Stade démo ProDay',
      organizer_uid: COACH_UID,
      status: 'scheduled',
      rsvps: {
        [playerUid]: 'yes',
      },
      rsvp_notes: {},
      is_demo: true,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  console.log(`  ✓ team_events/${DEMO_EVENT_ID}`);

  console.log('\n✔ Parent démo prêt · lié à Lucas Démo');
  console.log(`  Parent UID : ${parentUid}`);
  console.log(`  Enfant UID : ${playerUid} (Lucas · U17 · supervisé)`);
  console.log('\nConnexion parent :');
  console.log(`  Email : ${PARENT_EMAIL}`);
  console.log(`  MDP   : ${PASSWORD}`);
  console.log('\n→ Au lancement, choisis le pôle Parent / Famille.');
  console.log('  Agenda : boutons « Enfant en retard » et « Retard récupération ».\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
