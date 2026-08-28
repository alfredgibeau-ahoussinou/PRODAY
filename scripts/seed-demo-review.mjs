/**
 * Orchestrateur App Store Review — recrée / synchronise tous les comptes démo.
 *
 *   npm run seed:demo-review
 *   npm run seed:demo-review -- --force
 *
 * Prérequis : firebase/*adminsdk*.json + .env (EXPO_PUBLIC_FIREBASE_PROJECT_ID)
 * Mot de passe (ne pas committer de secret prod) :
 *   DEMO_REVIEW_PASSWORD=...   sinon DEMO_CLUB_PASSWORD / cascade scripts → ProDayDemo2026!
 *
 * Doc ASC : docs/APP_REVIEW.md
 */

import { spawnSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const force = process.argv.includes('--force');
const forceArgs = force ? ['--force'] : [];

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

const envFile = loadEnv();
const PASSWORD =
  process.env.DEMO_REVIEW_PASSWORD ||
  envFile.DEMO_REVIEW_PASSWORD ||
  process.env.DEMO_CLUB_PASSWORD ||
  envFile.DEMO_CLUB_PASSWORD ||
  process.env.DEMO_PLAYER_PASSWORD ||
  envFile.DEMO_PLAYER_PASSWORD ||
  'ProDayDemo2026!';

function run(label, script, extraEnv = {}) {
  console.log(`\n── ${label} ──`);
  const result = spawnSync(process.execPath, [resolve(root, 'scripts', script), ...forceArgs], {
    cwd: root,
    env: {
      ...process.env,
      ...extraEnv,
      DEMO_CLUB_PASSWORD: PASSWORD,
      DEMO_PLAYER_PASSWORD: PASSWORD,
      DEMO_PARENT_PASSWORD: PASSWORD,
      DEMO_SUPPORTER_PASSWORD: PASSWORD,
      DEMO_REVIEW_PASSWORD: PASSWORD,
    },
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    console.error(`\n✖ Échec : ${script} (exit ${result.status})`);
    process.exit(result.status ?? 1);
  }
}

console.log(`\n🍎 Seed App Review — comptes démo permanents${force ? ' (--force)' : ''}`);
console.log(`   Mot de passe utiliséé : (défini via env / défaut documenté dans docs/APP_REVIEW.md)\n`);

run('1/5 Club + Coach + Président', 'seed-demo-club.mjs');
run('2/5 Joueur adulte (compte ASC principal)', 'seed-demo-player.mjs');
run('3/5 Parent + enfant U17 dédié', 'seed-demo-parent.mjs');
run('4/5 Supporter', 'seed-demo-supporter.mjs');
run('5/5 Sponsor / partenaire', 'setup-partner-test-account.mjs', {
  TEST_ACCOUNT_EMAIL: process.env.TEST_ACCOUNT_EMAIL || 'part@gmail.com',
  TEST_ACCOUNT_PASSWORD: PASSWORD,
});

console.log('\n✔ Jeu de comptes App Review prêt\n');
console.log('Compte principal ASC (Informations sur l’examen) :');
console.log('  Email : player.demo@proday.app');
console.log(`  MDP   : ${PASSWORD}`);
console.log('\nComptes complémentaires (Notes pour l’examen) :');
console.log('  Coach      : coach.demo@proday.app');
console.log('  Club/Prés. : club.demo@proday.app  (carousel Club OU Président)');
console.log('  Parent     : parent.demo@proday.app');
console.log('  Supporter  : supporter.demo@proday.app');
console.log('  Sponsor    : part@gmail.com');
console.log('\n→ Coller le texte de docs/APP_REVIEW.md dans App Store Connect.');
console.log('→ Tester la connexion sur la build soumise avant de renvoyer à l’examen.\n');
