/**
 * Migration one-shot : statut `approved` pour inscriptions bêta déjà contactées.
 * Usage : node scripts/migrate-beta-waitlist.mjs
 * Prérequis : GOOGLE_APPLICATION_CREDENTIALS ou firebase login + projet actif
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROJECT_ID = 'proday-155b0';
const CREDS_PATH = resolve(
  process.cwd(),
  'firebase/proday-155b0-firebase-adminsdk-fbsvc-0b4695657f.json',
);

function initAdmin() {
  if (getApps().length === 0) {
    const creds = JSON.parse(readFileSync(CREDS_PATH, 'utf8'));
    initializeApp({ credential: cert(creds), projectId: PROJECT_ID });
  }
  return getFirestore();
}

async function run() {
  const db = initAdmin();
  const snap = await db.collection('beta_waitlist').get();
  let updated = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.status === 'approved' || data.status === 'rejected' || data.status === 'pending') {
      continue;
    }
    if (data.welcome_email_sent === true) {
      await doc.ref.update({
        status: 'approved',
        approved_at: data.welcome_email_sent_at ?? FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
      });
      updated += 1;
      console.log(`✓ approved (legacy email) — ${data.email}`);
      continue;
    }
    await doc.ref.update({
      status: 'pending',
      updated_at: FieldValue.serverTimestamp(),
    });
    updated += 1;
    console.log(`✓ pending — ${data.email}`);
  }

  console.log(`Migration terminée : ${updated} document(s) mis à jour sur ${snap.size}.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
