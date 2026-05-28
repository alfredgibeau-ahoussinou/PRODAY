/**
 * Recalcule et publie les compteurs publics (Discover invité).
 *
 *   npm run stats:refresh
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

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
  const dir = resolve(root, 'firebase');
  if (!existsSync(dir)) return null;
  const json = readdirSync(dir).find(
    (f) => f.endsWith('.json') && f.includes('firebase-adminsdk')
  );
  return json ? resolve(dir, json) : null;
}

async function countQuery(db, collectionName, ...filters) {
  let q = db.collection(collectionName);
  for (const [field, op, value] of filters) {
    q = q.where(field, op, value);
  }
  const snap = await q.count().get();
  return snap.data().count;
}

async function main() {
  const env = loadEnv();
  const saPath = findServiceAccount();
  if (!saPath) {
    console.error('Service account introuvable (firebase/service-account.json).');
    process.exit(1);
  }

  if (!getApps().length) {
    initializeApp({ credential: cert(JSON.parse(readFileSync(saPath, 'utf8'))) });
  }
  const db = getFirestore();

  const [players, coaches, agents, clubs, posts] = await Promise.all([
    countQuery(db, 'users', ['role', '==', 'player'], ['is_active', '==', true]),
    countQuery(db, 'users', ['role', '==', 'coach'], ['is_active', '==', true]),
    countQuery(db, 'users', ['role', '==', 'agent'], ['is_active', '==', true]),
    db.collection('clubs').count().get().then((s) => s.data().count),
    countQuery(db, 'recruitment_posts', ['status', '==', 'OPEN']),
  ]);

  const stats = {
    players,
    coaches,
    agents,
    clubs,
    recruitment_posts_open: posts,
    updated_at: FieldValue.serverTimestamp(),
  };

  await db.collection('platform_stats').doc('recruitment').set(stats, { merge: true });

  console.log('Stats ProDay publiées:', {
    players,
    coaches,
    agents,
    clubs,
    recruitment_posts_open: posts,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
