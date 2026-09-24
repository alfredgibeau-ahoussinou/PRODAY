/**
 * Sonde « reprise Joueur desktop » : après avoir ouvert plusieurs modules via le
 * hub, cherche la stratégie de retour fiable (Accueil, Menu, Échap, rechargement).
 */
import puppeteer from 'puppeteer-core';
import { login, sleep, dismissOverlays, clickReal, findTargets, screenSignature } from './lib.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
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

const hubOpen = async () => (await findTargets(page, { kind: 'testid', value: 'plus-menu-progression' })).length > 0;
const openHub = async () => {
  for (let i = 0; i < 3 && !(await hubOpen()); i += 1) {
    await clickReal(page, { kind: 'aria', value: 'Menu' });
    await sleep(3500);
  }
  return hubOpen();
};

const visit = async (tid) => {
  if (!(await openHub())) return 'hub KO avant';
  const ok = (await clickReal(page, { kind: 'testid', value: tid })).ok;
  await sleep(6000);
  return ok ? 'ok' : 'clic KO';
};

console.log('hub initial :', await openHub());
for (const tid of ['plus-menu-progression', 'plus-menu-messages', 'plus-menu-settings', 'plus-menu-covoiturage']) {
  console.log(`visite ${tid} :`, await visit(tid));
  console.log(`   sig=${(await screenSignature(page)).slice(0, 70)}`);
}

console.log('\n--- stratégies de retour ---');
for (const [name, fn] of [
  ['aria Menu', async () => clickReal(page, { kind: 'aria', value: 'Menu' })],
  ['aria Accueil', async () => clickReal(page, { kind: 'aria', value: 'Accueil' })],
  ['Échap', async () => page.keyboard.press('Escape')],
  ['texte Retour', async () => clickReal(page, { kind: 'text', value: 'Retour' })],
]) {
  await fn();
  await sleep(4000);
  console.log(`   ${name} → hub=${await hubOpen()} sig=${(await screenSignature(page)).slice(0, 60)}`);
  if (await hubOpen()) break;
}

if (!(await hubOpen())) {
  console.log('\n--- rechargement de page ---');
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
  await sleep(14000);
  await dismissOverlays(page);
  console.log(`   après reload : sig=${(await screenSignature(page)).slice(0, 80)}`);
  console.log(`   hub=${await openHub()}`);
}

await browser.close();
console.log('DONE');
