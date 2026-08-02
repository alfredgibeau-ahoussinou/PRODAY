#!/usr/bin/env node
/**
 * Migration Pôle Joueur unifié.
 *
 * - product_line `pro_player` (joueurs) → `amateur` + player_level: professional
 * - product_line `amateur` sans player_level → player_level: amateur
 * - hommes/women legacy players déjà gérés par migrate-product-lines.mjs
 *
 * Usage:
 *   npm run migrate:joueur-pole -- --dry-run
 *   npm run migrate:joueur-pole -- --confirm
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const dryRun = process.argv.includes('--dry-run');
const confirm = process.argv.includes('--confirm');

function findServiceAccount() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  }
  const fixed = resolve(root, 'firebase/service-account.json');
  if (existsSync(fixed)) return fixed;
  const firebaseDir = resolve(root, 'firebase');
  if (existsSync(firebaseDir)) {
    const found = readdirSync(firebaseDir).find(
      (f) => f.includes('adminsdk') && f.endsWith('.json'),
    );
    if (found) return resolve(firebaseDir, found);
  }
  return fixed;
}

function initAdmin() {
  if (getApps().length) return getFirestore();
  const credPath = findServiceAccount();
  if (!existsSync(credPath)) {
    console.error('Credentials introuvables:', credPath);
    process.exit(1);
  }
  const serviceAccount = JSON.parse(readFileSync(credPath, 'utf8'));
  initializeApp({ credential: cert(serviceAccount) });
  return getFirestore();
}

async function migrateProPlayers(db) {
  const snap = await db.collection('users').where('product_line', '==', 'pro_player').get();
  console.log(`\nComptes pro_player: ${snap.size}`);
  let updated = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    const role = data.role ?? 'player';
    if (role !== 'player') {
      console.log(`${dryRun ? '[dry-run] ' : ''}${doc.id} (pro_player/${role}) — skip (non joueur)`);
      continue;
    }
    const patch = {
      product_line: 'amateur',
      player_level: data.player_level || 'professional',
      updated_at: FieldValue.serverTimestamp(),
    };
    console.log(
      `${dryRun ? '[dry-run] ' : ''}${doc.id} pro_player -> amateur + player_level=${patch.player_level}`,
    );
    if (!dryRun) await doc.ref.update(patch);
    updated += 1;
  }
  return updated;
}

async function backfillAmateurBadges(db) {
  const snap = await db.collection('users').where('product_line', '==', 'amateur').get();
  console.log(`\nComptes amateur (backfill badge): ${snap.size}`);
  let updated = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.role !== 'player') continue;
    if (data.player_level) continue;
    console.log(`${dryRun ? '[dry-run] ' : ''}${doc.id} -> player_level=amateur`);
    if (!dryRun) {
      await doc.ref.update({
        player_level: 'amateur',
        updated_at: FieldValue.serverTimestamp(),
      });
    }
    updated += 1;
  }
  return updated;
}

async function main() {
  if (!dryRun && !confirm) {
    console.log('Passez --dry-run ou --confirm.');
    process.exit(1);
  }
  const db = initAdmin();
  const a = await migrateProPlayers(db);
  const b = await backfillAmateurBadges(db);
  console.log(`\nTerminé. Mises à jour: ${a + b}${dryRun ? ' (dry-run)' : ''}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
