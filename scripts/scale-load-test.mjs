/**
 * Benchmark charge ProDay — échelles 1k / 10k / 20k / 50k utilisateurs.
 *
 *   npm run test:scale              # logique client (Jest)
 *   npm run test:scale:firestore    # + requêtes Firestore (émulateur)
 */
import { performance } from 'node:perf_hooks';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import {
  makeFirestoreUserDoc,
  makeAppUser,
  makeFeedPosts,
  simulateListByRole,
  simulateListMembersByClubId,
  formatMs,
  verdict,
} from './lib/scaleFixtures.mjs';

const SCALES = [1000, 10_000, 20_000, 50_000];
const withFirestore = process.argv.includes('--firestore');
const BATCH = 500;

function budgetMs(scale, per1k, floor = 50) {
  return Math.max(floor, (scale / 1000) * per1k);
}

function runClientBenchmarks() {
  console.log('\n📱 Phase 1 — Chemins client (mémoire)\n');
  console.log(
    '| Utilisateurs | Sanitize×500 | listByRole | Suggestions | Fil×60 | Membres club |',
  );
  console.log(
    '|-------------|--------------|------------|-------------|--------|--------------|',
  );

  const rows = [];

  for (const scale of SCALES) {
    const users = Array.from({ length: scale }, (_, i) => makeAppUser(i));
    const posts = makeFeedPosts(60);
    const viewer = { ...users[0], role: 'player', city: 'Paris' };

    const tSan0 = performance.now();
    const sample = users.slice(0, 500);
    for (const u of sample) {
      const next = { ...u };
      delete next.email;
      delete next.phone;
      delete next.parental_settings;
    }
    const sanitizeMs = performance.now() - tSan0;

    const tList0 = performance.now();
    simulateListByRole(users, 'player', 'Paris');
    const listRoleMs = performance.now() - tList0;

    const tSug0 = performance.now();
    const roles = ['coach', 'physio', 'player'];
    const scores = [];
    for (const role of roles) {
      for (const c of simulateListByRole(users, role)) {
        let score = 55;
        if (c.city === viewer.city) score += 22;
        if (c.is_verified) score += 5;
        scores.push(score);
      }
    }
    scores.sort((a, b) => b - a);
    const suggestionsMs = performance.now() - tSug0;

    const tFeed0 = performance.now();
    const city = viewer.city?.toLowerCase() ?? '';
    [...posts]
      .map((post) => {
        let raw = 0.38;
        if (city && post.title.toLowerCase().includes(city)) raw += 0.22;
        return { post, raw };
      })
      .sort((a, b) => b.raw - a.raw);
    const feedMs = performance.now() - tFeed0;

    const tClub0 = performance.now();
    const visible = simulateListMembersByClubId(users, 'club-0');
    const total = users.filter((u) => u.profile?.club_id === 'club-0').length;
    const clubMs = performance.now() - tClub0;

    const checks = {
      sanitize: verdict(sanitizeMs, budgetMs(500, 10, 40)),
      listRole: verdict(listRoleMs, budgetMs(scale, 0.5, 20)),
      suggestions: verdict(suggestionsMs, budgetMs(scale, 1, 25)),
      feed: verdict(feedMs, 30),
      club: verdict(clubMs, budgetMs(scale, 0.6, 20)),
    };

    const allOk = Object.values(checks).every((v) => v === 'OK');

    console.log(
      `| ${String(scale).padStart(11)} | ${formatMs(sanitizeMs).padStart(12)} ${checks.sanitize} | ${formatMs(listRoleMs).padStart(10)} ${checks.listRole} | ${formatMs(suggestionsMs).padStart(11)} ${checks.suggestions} | ${formatMs(feedMs).padStart(6)} ${checks.feed} | ${visible.length}/${total} ${checks.club} |`,
    );

    rows.push({ scale, allOk, clubGap: total - visible.length, suggestionCount: scores.length });
  }

  console.log('\n⚠️  listMembersByClubId ne charge que 50 profils/rôle : membres manquants si club dense.');
  for (const r of rows) {
    if (r.clubGap > 0) {
      console.log(
        `   → ${r.scale.toLocaleString('fr-FR')} users : jusqu’à ${r.clubGap} membres du club-0 non listés`,
      );
    }
  }

  return rows.every((r) => r.allOk);
}

async function seedUsers(db, from, to) {
  for (let start = from; start < to; start += BATCH) {
    const batch = db.batch();
    const end = Math.min(start + BATCH, to);
    for (let i = start; i < end; i++) {
      batch.set(db.collection('users').doc(`scale-u${i}`), {
        ...makeFirestoreUserDoc(i),
        created_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
    if ((end - from) % 5000 === 0 || end === to) {
      process.stdout.write(`   … ${end} / ${to} docs\r`);
    }
  }
  if (to > from) console.log(`   ✓ ${to - from} utilisateurs seedés (total cible ${to})`);
}

async function runFirestoreBenchmarks() {
  console.log('\n🔥 Phase 2 — Firestore (émulateur)\n');

  if (getApps().length === 0) {
    initializeApp({ projectId: 'proday-scale-test' });
  }
  const db = getFirestore();
  db.settings({ ignoreUndefinedProperties: true });

  console.log(
    '| Utilisateurs | Seed (delta) | Query indexée (50) | Scan collection |',
  );
  console.log(
    '|-------------|--------------|--------------------|-----------------|',
  );

  let prev = 0;
  let allOk = true;

  for (const scale of SCALES) {
    const tSeed0 = performance.now();
    if (scale > prev) {
      await seedUsers(db, prev, scale);
    }
    const seedMs = performance.now() - tSeed0;

    const tQ0 = performance.now();
    const indexed = await db
      .collection('users')
      .where('role', '==', 'player')
      .where('is_active', '==', true)
      .orderBy('created_at', 'desc')
      .limit(50)
      .get();
    const queryMs = performance.now() - tQ0;

    const tScan0 = performance.now();
    const scan = await db.collection('users').get();
    const scanMs = performance.now() - tScan0;

    const qOk = verdict(queryMs, 800);
    const sOk = verdict(scanMs, scale * 0.2 + 300);
    if (qOk !== 'OK' || sOk !== 'OK') allOk = false;

    console.log(
      `| ${String(scale).padStart(11)} | ${formatMs(seedMs).padStart(12)} | ${formatMs(queryMs).padStart(18)} ${qOk} (${indexed.size}) | ${formatMs(scanMs).padStart(15)} ${sOk} (${scan.size}) |`,
    );

    prev = scale;
  }

  console.log(
    '\n💡 La requête indexée reste ~constant (limit 50). Le scan complet dégrade fortement à grande échelle.',
  );

  return allOk;
}

async function main() {
  console.log('🏟️  ProDay — test de charge multi-échelle\n');

  const clientOk = runClientBenchmarks();

  let firestoreOk = true;
  if (withFirestore) {
    firestoreOk = await runFirestoreBenchmarks();
  } else {
    console.log('\n💡 Lancez npm run test:scale:firestore pour inclure l’émulateur Firestore.');
  }

  console.log('\n── Résumé ──');
  console.log(clientOk ? '✅ Client : performances acceptables' : '❌ Client : seuils dépassés');
  if (withFirestore) {
    console.log(
      firestoreOk ? '✅ Firestore : requêtes dans les budgets' : '❌ Firestore : lenteurs détectées',
    );
  }

  if (!clientOk || (withFirestore && !firestoreOk)) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
