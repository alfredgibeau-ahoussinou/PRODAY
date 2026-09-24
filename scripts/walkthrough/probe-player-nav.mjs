/**
 * Sonde : quels éléments permettent de naviguer dans le shell Joueur desktop ?
 * 1. Dump des cibles (texte + aria-label + testID) de l'accueil.
 * 2. Ouverture de « Mon Coach IA » puis dump des cibles permettant de sortir.
 */
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import { login, sleep, dismissOverlays, clickReal } from './lib.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const out = '/tmp/player-nav';
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
  shellReadyPattern: 'Carrière|Bonjour,',
  postLoginSettleMs: 7000,
});
await dismissOverlays(page);
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: false, hasTouch: false });
await sleep(1500);
await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
await sleep(12000);
await dismissOverlays(page);

const dumpTargets = () =>
  page.evaluate(() => {
    const seen = new Set();
    const rows = [];
    for (const el of document.querySelectorAll('[role="button"],[role="tab"],[aria-label],[data-testid],a,button')) {
      const r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) continue;
      if (r.y < -20 || r.y > window.innerHeight + 20) continue;
      const label = el.getAttribute('aria-label') || '';
      const tid = el.getAttribute('data-testid') || '';
      const txt = (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40);
      const key = `${label}|${tid}|${txt}|${Math.round(r.x)},${Math.round(r.y)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({ label, tid, txt, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) });
    }
    return rows;
  });

const print = (title, rows) => {
  console.log(`\n===== ${title} (${rows.length})`);
  for (const r of rows) {
    console.log(`  [${r.x},${r.y} ${r.w}x${r.h}] aria=${JSON.stringify(r.label)} testid=${JSON.stringify(r.tid)} txt=${JSON.stringify(r.txt)}`);
  }
};

print('ACCUEIL', await dumpTargets());
await page.screenshot({ path: `${out}/accueil.png` });

console.log('\n--- clic Menu (aria) :', (await clickReal(page, { kind: 'aria', value: 'Menu' })).ok);
await sleep(5000);
print('MENU HUB', await dumpTargets());
await page.screenshot({ path: `${out}/menu.png` });

console.log('\n--- clic « Mon Coach IA » (texte) :', (await clickReal(page, { kind: 'text', value: 'Mon Coach IA' })).ok);
await sleep(6000);
print('MON COACH IA (après ouverture)', await dumpTargets());
await page.screenshot({ path: `${out}/coach-ia.png` });

await browser.close();
console.log('\nDONE');
