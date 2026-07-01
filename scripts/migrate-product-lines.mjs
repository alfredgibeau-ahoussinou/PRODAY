#!/usr/bin/env node
/**
 * Migration batch Firestore : product_line `pro` → pro_player | pro_club | pro_staff
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

async function main() {
  const db = initAdmin();
  const snap = await db.collection('users').where('product_line', '==', 'pro').get();
  console.log(`Comptes legacy pro: ${snap.size}`);
  let updated = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    const role = data.role ?? 'player';
    const target = splitLegacyProByRole(role);
    console.log(`${dryRun ? '[dry-run] ' : ''}${doc.id} (${role}) -> ${target}`);
    if (!dryRun) {
      await doc.ref.update({ product_line: target, updated_at: new Date() });
    }
    updated += 1;
  }
  console.log(`Terminé — ${updated} document(s) ${dryRun ? 'à migrer' : 'migrés'}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
