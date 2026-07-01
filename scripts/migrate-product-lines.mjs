#!/usr/bin/env node
/**
 * Migration batch Firestore — pôles carousel (§14 doc architecture).
 *
 * - `pro` → pro_player | pro_club | pro_staff (selon rôle)
 * - `homme`/`woman`/`standard` + player → pro_player (+ profile.gender)
 * - `homme`/`woman`/`standard` + autre rôle → amateur
 * - product_line absent → canonicalizeUserProductLine (rôle / legacy)
 *
 * Usage:
 *   npm run migrate:product-lines -- --dry-run
 *   npm run migrate:product-lines -- --confirm
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import {
  canonicalizeUserProductLine,
  isMissingProductLine,
  splitLegacyProByRole,
} from './lib/productLineResolution.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const dryRun = process.argv.includes('--dry-run');
const confirm = process.argv.includes('--confirm');

function genderForLegacyLine(line) {
  if (line === 'woman') return 'women';
  return 'men';
}

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
    console.error(
      'Placez la clé Admin SDK dans firebase/*-adminsdk-*.json ou définissez GOOGLE_APPLICATION_CREDENTIALS.',
    );
    process.exit(1);
  }
  const serviceAccount = JSON.parse(readFileSync(credPath, 'utf8'));
  initializeApp({ credential: cert(serviceAccount) });
  return getFirestore();
}

async function migrateLegacyPro(db) {
  const snap = await db.collection('users').where('product_line', '==', 'pro').get();
  console.log(`\nComptes legacy pro: ${snap.size}`);
  let updated = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    const role = data.role ?? 'player';
    const target = splitLegacyProByRole(role);
    console.log(`${dryRun ? '[dry-run] ' : ''}${doc.id} (pro/${role}) -> ${target}`);
    if (!dryRun) {
      await doc.ref.update({ product_line: target, updated_at: FieldValue.serverTimestamp() });
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
    console.log(`\nJoueurs ${line}: ${snap.size}`);
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
          updated_at: FieldValue.serverTimestamp(),
        });
      }
      updated += 1;
    }
  }
  return updated;
}

async function migrateHommeWomanStaff(db) {
  const lines = ['homme', 'woman', 'standard'];
  let updated = 0;
  for (const line of lines) {
    const snap = await db.collection('users').where('product_line', '==', line).get();
    const staff = snap.docs.filter((doc) => (doc.data().role ?? 'player') !== 'player');
    console.log(`\nStaff ${line} (hors joueur): ${staff.length}`);
    for (const doc of staff) {
      const data = doc.data();
      const role = data.role ?? 'coach';
      console.log(`${dryRun ? '[dry-run] ' : ''}${doc.id} (${line}/${role}) -> amateur`);
      if (!dryRun) {
        await doc.ref.update({
          product_line: 'amateur',
          updated_at: FieldValue.serverTimestamp(),
        });
      }
      updated += 1;
    }
  }
  return updated;
}

async function backfillMissingProductLine(db) {
  const snap = await db.collection('users').get();
  const missing = snap.docs.filter((doc) => isMissingProductLine(doc.data().product_line));
  console.log(`\nComptes sans product_line: ${missing.length} (${snap.size} utilisateurs scannés)`);
  let updated = 0;
  for (const doc of missing) {
    const data = doc.data();
    const role = data.role ?? 'player';
    const target = canonicalizeUserProductLine(data.product_line, role);
    console.log(
      `${dryRun ? '[dry-run] ' : ''}${doc.id} (absent/${role}) -> ${target}`,
    );
    if (!dryRun) {
      await doc.ref.update({
        product_line: target,
        updated_at: FieldValue.serverTimestamp(),
      });
    }
    updated += 1;
  }
  return updated;
}

async function main() {
  if (!dryRun && !confirm) {
    console.error('Migration refusée : ajoutez --dry-run (simulation) ou --confirm (écriture).');
    process.exit(1);
  }

  const db = initAdmin();
  const credPath = findServiceAccount();
  console.log(`Projet Admin SDK: ${JSON.parse(readFileSync(credPath, 'utf8')).project_id}`);
  console.log(`Mode: ${dryRun ? 'dry-run (aucune écriture)' : 'CONFIRM — écriture Firestore'}`);

  const proCount = await migrateLegacyPro(db);
  const playerCount = await migrateHommeWomanPlayers(db);
  const staffCount = await migrateHommeWomanStaff(db);
  const backfillCount = await backfillMissingProductLine(db);
  const total = proCount + playerCount + staffCount + backfillCount;

  console.log(
    `\nTerminé — ${total} document(s) ${dryRun ? 'à migrer' : 'migrés'} ` +
      `(pro=${proCount}, joueurs=${playerCount}, staff=${staffCount}, backfill=${backfillCount}).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
