/**
 * Sonde « parcours Joueur desktop » (v2) — tient compte du fait que les liaisons
 * du hub restent montées mais masquées (le hit-test seul dit ce qui est cliquable).
 *
 * Pour chaque module : on ouvre le hub, on clique la carte, on consigne l'écran
 * atteint, puis on revient par la barre latérale (« Menu » puis « Accueil »).
 */
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import { login, sleep, dismissOverlays, clickReal, screenSignature, findTargets } from './lib.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const out = '/tmp/player-tour2';
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
  defaultViewport: null,
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.goto('http://localhost:8081/', { waitUntil: 'domcontentloaded', timeout: 120000 });
await sleep(6000);
await login(page, {
  email: 'player.demo@proday.app',
  password: 'ProDayDemo2026!',
  pole: 'Joueur',
  poleCta: 'Joueur',
  shellReadyPattern: 'Carrière|Bonjour,|Passeport',
  postLoginSettleMs: 7000,
});
await dismissOverlays(page);
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: false, hasTouch: false });
await sleep(1500);
await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
await sleep(12000);
await dismissOverlays(page);

/** Vrai si la carte « Tout ProDay » est réellement cliquable (hit-test). */
const hubOpen = async () => (await findTargets(page, { kind: 'testid', value: 'plus-menu-progression' })).length > 0;

const openHub = async () => {
  for (let i = 0; i < 4 && !(await hubOpen()); i += 1) {
    await clickReal(page, { kind: 'aria', value: 'Menu' });
    await sleep(3500);
  }
  return hubOpen();
};

const goHome = async () => {
  await clickReal(page, { kind: 'aria', value: 'Accueil' });
  await sleep(3500);
};

console.log('--- hub ouvrable :', await openHub());
await page.screenshot({ path: `${out}/00-hub.png` });

const CANDIDATES = [
  ['plus-menu-progression', 'Ma Saison'],
  ['plus-menu-recrutement', 'Équipe'],
  ['plus-menu-messages', 'Vestiaire / Messages'],
  ['plus-menu-covoiturage', 'Covoiturage / Trajet'],
  ['plus-menu-reels', 'Clips (Bientôt)'],
  ['plus-menu-shop', 'Boutique (Bientôt)'],
  ['plus-menu-settings', 'Mon compte'],
  ['plus-menu-coach_ia', 'Mon Coach IA'],
];

for (const [tid, name] of [...CANDIDATES, ...CANDIDATES]) {
  const ok = await openHub();
  if (!ok) {
    await goHome();
    console.log(`\n>>> ${tid} (${name}) : hub inaccessible, retour accueil`);
    continue;
  }
  const before = await screenSignature(page);
  const r = await clickReal(page, { kind: 'testid', value: tid });
  await sleep(6500);
  const after = await screenSignature(page);
  console.log(`\n>>> ${tid} (${name}) clic=${r.ok} changement=${before !== after}`);
  console.log(`    avant : ${before.slice(0, 80)}`);
  console.log(`    après : ${after.slice(0, 110)}`);
  if (before !== after) await page.screenshot({ path: `${out}/${tid}.png` });
  await goHome();
}

await browser.close();
console.log('\nDONE');
