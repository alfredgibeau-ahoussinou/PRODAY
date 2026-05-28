/**
 * Crée ou met à jour le compte admin ProDay (Auth + claim admin + profil Firestore).
 *
 *   ADMIN_SETUP_EMAIL=proday.admin@gmail.com \
 *   ADMIN_SETUP_PASSWORD='votre-mot-de-passe' \
 *   npm run admin:setup
 *
 * Ne commitez jamais le mot de passe. Placez-le uniquement dans .env (gitignored).
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const EMAIL = (process.env.ADMIN_SETUP_EMAIL || 'proday.admin@gmail.com').trim().toLowerCase();
const PASSWORD = process.env.ADMIN_SETUP_PASSWORD;
const DISPLAY_NAME = process.env.ADMIN_SETUP_NAME || 'Admin ProDay';

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
const projectId = env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'proday-155b0';
const serviceAccountPath = findServiceAccount();

if (!PASSWORD || PASSWORD.length < 8) {
  console.error(
    'Définissez ADMIN_SETUP_PASSWORD (8+ caractères), ex. dans .env :\n  ADMIN_SETUP_PASSWORD=***'
  );
  process.exit(1);
}

if (getApps().length === 0) {
  if (!existsSync(serviceAccountPath)) {
    console.error(
      'Service account requis : téléchargez-le depuis Firebase Console →\n' +
        'Paramètres projet → Comptes de service → Générer une nouvelle clé privée\n' +
        `→ enregistrez sous firebase/service-account.json`
    );
    process.exit(1);
  }
  const sa = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  initializeApp({ credential: cert(sa), projectId });
}

const db = getFirestore();
const auth = getAuth();

async function setup() {
  console.log(`Projet : ${projectId}`);
  console.log(`Admin : ${EMAIL}\n`);

  let uid;
  try {
    const existing = await auth.getUserByEmail(EMAIL);
    uid = existing.uid;
    await auth.updateUser(uid, { password: PASSWORD, displayName: DISPLAY_NAME });
    console.log('✔ Compte Auth existant — mot de passe et nom mis à jour.');
  } catch (e) {
    if (e.code === 'auth/user-not-found') {
      const created = await auth.createUser({
        email: EMAIL,
        password: PASSWORD,
        displayName: DISPLAY_NAME,
        emailVerified: true,
      });
      uid = created.uid;
      console.log('✔ Compte Auth créé.');
    } else {
      throw e;
    }
  }

  await auth.setCustomUserClaims(uid, { admin: true });
  console.log('✔ Custom claim admin:true appliqué.');

  await db.doc(`users/${uid}`).set(
    {
      display_name: DISPLAY_NAME,
      email: EMAIL,
      role: 'organizer',
      is_verified: true,
      verification_status: 'NOT_REQUIRED',
      is_active: true,
      is_platform_admin: true,
      profile: { bio: 'Compte administrateur ProDay', job_title: 'Administrateur plateforme' },
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  console.log('✔ Profil Firestore users/' + uid);

  console.log(
    '\n→ Connectez-vous dans l’app avec cet email, puis déconnectez-vous / reconnectez-vous\n' +
      '  pour charger le token admin. Onglet Profil → Console Admin.\n' +
      '→ Déployez les Functions pour créer/supprimer des comptes Auth depuis la console :\n' +
      '  firebase deploy --only functions\n'
  );
}

setup().catch((err) => {
  console.error('\n✖ Échec :', err.message);
  process.exit(1);
});
