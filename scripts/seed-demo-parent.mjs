/**
 * Crée un compte parent démo lié à un enfant U17 dédié (sans toucher player.demo@).
 *
 *   npm run seed:demo-parent
 *   npm run seed:demo-parent -- --force
 *
 * Prérequis : idéalement npm run seed:demo-club (équipe U17 + coach)
 *
 * Connexion : lancer l’app → pôle Parent / Famille
 *   Email : parent.demo@proday.app
 *   MDP   : même cascade que les autres démos (ProDayDemo2026!)
 *
 * Enfant supervisé (optionnel pour tester le shell joueur ado) :
 *   Email : child.demo@proday.app
 *   MDP   : même mot de passe
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
/** Enfant U17 dédié — ne pas réutiliser player.demo (compte review Apple adulte). */
const CHILD_EMAIL = 'child.demo@proday.app';
const CHILD_AUTH_UID = 'proday_demo_child_u17';
const CHILD_MEMBERSHIP_ID = 'proday_demo_mem_child_u17';
const PARENT_EMAIL = 'parent.demo@proday.app';
const PARENT_AUTH_UID = 'proday_demo_parent_login';
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

async function main() {
  console.log(`\n👨‍👩‍👧 Seed parent démo — ${projectId}${force ? ' (--force)' : ''}\n`);

  const clubSnap = await db.doc(`clubs/${CLUB_ID}`).get();
  if (!clubSnap.exists) {
    console.warn(
      `  ⚠ Club ${CLUB_ID} absent — lance d’abord : npm run seed:demo-club -- --force`,
    );
  }

  const parentUid = await ensureAuthUser({
    uid: PARENT_AUTH_UID,
    email: PARENT_EMAIL,
    displayName: 'Sophie Parent Démo',
    password: PASSWORD,
  });

  const childUid = await ensureAuthUser({
    uid: CHILD_AUTH_UID,
    email: CHILD_EMAIL,
    displayName: 'Léo U17 Démo',
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

  await db.doc(`users/${childUid}`).set(
    {
      display_name: 'Léo U17 Démo',
      email: CHILD_EMAIL,
      role: 'player',
      app_space: 'boys',
      product_line: 'amateur',
      is_verified: true,
      verification_status: 'VERIFIED',
      is_active: true,
      is_demo: true,
      email_verified: true,
      onboarding_documents_submitted: true,
      city: 'Lyon',
      department: '69',
      parental_settings: parentalSettings,
      parental_runtime: {
        date: new Date().toISOString().slice(0, 10),
        minutes_used: 22,
      },
      profile: {
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
        bio: 'Milieu U17 — compte démo supervisé (App Review · pôle Parent).',
        cv_headline: 'Milieu U17 — vision et volume.',
      },
      player_verification: {
        identity: { status: 'verified' },
        club_license: { status: 'verified' },
      },
      updated_at: FieldValue.serverTimestamp(),
      created_at: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  console.log(`  ✓ users/${childUid} (enfant U17 supervisé)`);

  await db.doc(`memberships/${CHILD_MEMBERSHIP_ID}`).set(
    {
      club_id: CLUB_ID,
      team_id: TEAM_U17_ID,
      player_uid: childUid,
      player_name: 'Léo U17 Démo',
      status: 'active',
      license_number: 'DEMO-CHILD-U17-8',
      requested_at: FieldValue.serverTimestamp(),
      validated_at: FieldValue.serverTimestamp(),
      validated_by_uid: 'proday_demo_club_owner',
      created_at: FieldValue.serverTimestamp(),
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
    onboarding_documents_submitted: true,
    city: 'Lyon',
    department: '69',
    parent_of: [childUid],
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
          parent_of: FieldValue.arrayUnion(childUid),
          role: 'parent',
          product_line: 'parent',
          is_demo: true,
          email_verified: true,
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
        [childUid]: 'yes',
      },
      rsvp_notes: {},
      is_demo: true,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  console.log(`  ✓ team_events/${DEMO_EVENT_ID}`);

  console.log('\n✔ Parent démo prêt · enfant U17 dédié (player.demo inchangé)');
  console.log(`  Parent UID : ${parentUid}`);
  console.log(`  Enfant UID : ${childUid} (Léo · U17 · supervisé)`);
  console.log('\nConnexion parent :');
  console.log(`  Email : ${PARENT_EMAIL}`);
  console.log(`  MDP   : ${PASSWORD}`);
  console.log('\n→ Au lancement, choisis le pôle Parent / Famille.');
  console.log('  Agenda : boutons « Enfant en retard » et « Retard récupération ».');
  console.log(`  Enfant (optionnel) : ${CHILD_EMAIL} / même MDP · pôle Joueur\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
