/**
 * Sonde ciblée : le bouton « Messagerie » de l'en-tête ouvre-t-il réellement le
 * module en version desktop ? (Trois essais + capture d'écran à chaque fois.)
 */
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import { login, sleep, dismissOverlays, clickReal, bodyText, screenSignature } from './lib.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const out = '/tmp/coach-mess';
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
  email: 'coach.demo@proday.app',
  password: 'ProDayDemo2026!',
  pole: 'Coach',
  poleCta: 'Coach',
  shellReadyPattern: 'Club affilié|VIGILANCE',
  postLoginSettleMs: 7000,
});
await dismissOverlays(page);
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: false, hasTouch: false });
await sleep(1500);
await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
await sleep(14000);
await dismissOverlays(page);
await page.screenshot({ path: `${out}/00-avant.png` });

for (let i = 1; i <= 3; i += 1) {
  const before = (await bodyText(page)).slice(0, 300);
  const r = await clickReal(page, { kind: 'aria', value: 'Messagerie' });
  await sleep(9000);
  const after = (await bodyText(page)).slice(0, 300);
  console.log(`essai ${i} : clic=${r.ok} changement=${before !== after}`);
  console.log(`   avant : ${before.replace(/\s+/g, ' ').slice(0, 90)}`);
  console.log(`   après : ${after.replace(/\s+/g, ' ').slice(0, 90)}`);
  console.log(`   lecture écran : ${(await screenSignature(page)).slice(0, 60)}`);
  await page.screenshot({ path: `${out}/essai-${i}.png` });
}

await browser.close();
console.log('DONE');
