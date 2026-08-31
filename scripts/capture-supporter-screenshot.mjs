#!/usr/bin/env node
/**
 * Capture simulateur iOS — pôle Supporter → website/public/images/app/supporter/supporter-accueil.jpg
 *
 * Prérequis : app installée (npm run ios:sim), Maestro CLI, compte démo (npm run seed:demo-supporter).
 *
 *   npm run marketing:capture-supporter
 */
import { existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import sharp from '../website/node_modules/sharp/lib/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const outDir = resolve(repoRoot, 'website/public/images/app/supporter');
const outFile = resolve(outDir, 'supporter-accueil.jpg');
const maestroDir = resolve(repoRoot, '.maestro');

const EMAIL = process.env.MAESTRO_SUPPORTER_EMAIL || 'supporter.demo@proday.app';
const PASSWORD =
  process.env.MAESTRO_SUPPORTER_PASSWORD ||
  process.env.DEMO_SUPPORTER_PASSWORD ||
  process.env.DEMO_PLAYER_PASSWORD ||
  'ProDayDemo2026!';

function findMaestroScreenshot() {
  const candidates = [
    resolve(maestroDir, 'supporter-accueil-raw.png'),
    resolve(process.cwd(), 'supporter-accueil-raw.png'),
    resolve(process.env.HOME || '', 'supporter-accueil-raw.png'),
  ];
  for (const path of candidates) {
    if (existsSync(path)) return path;
  }
  const testsRoot = resolve(process.env.HOME || '', '.maestro/tests');
  if (existsSync(testsRoot)) {
    const runs = readdirSync(testsRoot)
      .filter((d) => d.startsWith('20'))
      .sort()
      .reverse();
    for (const run of runs) {
      const shot = resolve(
        testsRoot,
        run,
        'supporter-screenshot/takeScreenshot/supporter-accueil-raw.png',
      );
      if (existsSync(shot)) return shot;
    }
  }
  for (const dir of [maestroDir, process.cwd(), process.env.HOME || '']) {
    if (!dir || !existsSync(dir)) continue;
    const hit = readdirSync(dir).find((f) => f.startsWith('supporter-accueil-raw'));
    if (hit) return resolve(dir, hit);
  }
  return null;
}

function run(cmd, args, env = {}) {
  const res = spawnSync(cmd, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });
  if (res.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} → code ${res.status}`);
  }
}

async function main() {
  mkdirSync(outDir, { recursive: true });

  console.log('→ Seed compte supporter démo…');
  run('node', ['scripts/seed-demo-supporter.mjs']);

  console.log('→ Maestro : login + capture…');
  run(
    'maestro',
    ['test', '.maestro/supporter-screenshot.yaml'],
    {
      MAESTRO_SUPPORTER_EMAIL: EMAIL,
      MAESTRO_SUPPORTER_PASSWORD: PASSWORD,
      MAESTRO_CLI_NO_ANALYTICS: '1',
    },
  );

  const raw = findMaestroScreenshot();
  if (!raw) {
    throw new Error('Capture Maestro introuvable (supporter-accueil-raw.png)');
  }

  await sharp(raw).jpeg({ quality: 92 }).toFile(outFile);
  unlinkSync(raw);
  const meta = await sharp(outFile).metadata();
  console.log(`✓ ${outFile}  ${meta.width}×${meta.height}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
