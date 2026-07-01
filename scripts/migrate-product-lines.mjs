#!/usr/bin/env node
/**
 * Migration batch Firestore :
 * - `pro` → pro_player | pro_club | pro_staff
 * - `homme` + player → pro_player (+ profile.gender men)
 * - `woman` + player → pro_player (+ profile.gender women)
 *
 * Usage: node scripts/migrate-product-lines.mjs [--dry-run]
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const dryRun = process.argv.includes('--dry-run');

function splitLegacyProByRole(role) {
  if (role === 'club') return 'pro_club';
  if (role === 'player') return 'pro_player';
  return 'pro_staff';
}

function genderForLegacyLine(line) {
  if (line === 'woman') return 'women';
  return 'men';
}

function initAdmin() {
  if (getApps().length) return getFirestore();
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
    ? resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS)
    : resolve('firebase/service-account.json');
  if (!existsSync(credPath)) {
    console.error('Credentials introuvables:', credPath);
    process.exit(1);
  }
  const serviceAccount = JSON.parse(readFileSync(credPath, 'utf8'));
  initializeApp({ credential: cert(serviceAccount) });
  return getFirestore();
}

async function migrateLegacyPro(db) {
  const snap = await db.collection('users').where('product_line', '==', 'pro').get();
  console.log(`Comptes legacy pro: ${snap.size}`);
  let updated = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    const role = data.role ?? 'player';
    const target = splitLegacyProByRole(role);
    console.log(`${dryRun ? '[dry-run] ' : ''}${doc.id} (pro/${role}) -> ${target}`);
    if (!dryRun) {
      await doc.ref.update({ product_line: target, updated_at: new Date() });
    }
    updated += 1;
  }
  return updated;
}

async function migrateHommeWomanPlayers(db) {
  const lines = ['homme', 'woman', 'standard'];
  let updated = 0;
  for (const line of lines) {
    const snap = await db
      .collection('users')
      .where('product_line', '==', line)
      .where('role', '==', 'player')
      .get();
    console.log(`Joueurs ${line}: ${snap.size}`);
    for (const doc of snap.docs) {
      const data = doc.data();
      const gender = data.profile?.gender ?? genderForLegacyLine(line);
      console.log(
        `${dryRun ? '[dry-run] ' : ''}${doc.id} (${line}/player) -> pro_player, gender=${gender}`,
      );
      if (!dryRun) {
        await doc.ref.update({
          product_line: 'pro_player',
          profile: { ...(data.profile ?? {}), gender },
          updated_at: new Date(),
        });
      }
      updated += 1;
    }
  }
  return updated;
}

async function main() {
  const db = initAdmin();
  const proCount = await migrateLegacyPro(db);
  const playerCount = await migrateHommeWomanPlayers(db);
  console.log(
    `Terminé — ${proCount + playerCount} document(s) ${dryRun ? 'à migrer' : 'migrés'}.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
