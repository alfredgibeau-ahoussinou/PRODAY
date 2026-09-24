/**
 * Sonde : pourquoi le pôle Joueur rend un shell vide en 1920 × 1080 ?
 * Teste 4 variantes (reload après login mobile, nudge de viewport, login direct
 * en desktop, redimensionnement manuel) et journalise textes + clés localStorage.
 */
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import { login, bodyText, sleep, dismissOverlays } from './lib.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = 'http://localhost:8081/';
const CFG = {
  email: 'player.demo@proday.app',
  password: 'ProDayDemo2026!',
  pole: 'Joueur',
  poleCta: 'Joueur',
  shellReadyPattern: 'Carrière|Passeport|Bonjour,|Se déconnecter|Se deconnecter',
  postLoginSettleMs: 7000,
};

const out = '/tmp/player-desktop-probe';
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'],
  defaultViewport: null,
});
const page = await browser.newPage();

const report = async (label) => {
  const text = await bodyText(page).catch(() => '');
  const info = await page
    .evaluate(() => {
      const keys = [];
      try {
        for (let i = 0; i < localStorage.length; i += 1) keys.push(localStorage.key(i));
      } catch {
        /* ignore */
      }
      const root = document.getElementById('root');
      const rect = root ? root.getBoundingClientRect() : null;
      return {
        w: window.innerWidth,
        h: window.innerHeight,
        rootH: rect ? Math.round(rect.height) : null,
        mainCount: document.querySelectorAll('div[role="main"], main').length,
        canvases: document.querySelectorAll('canvas').length,
        localKeys: keys.filter((k) => /shell|view|mode|layout|platform|mobile/i.test(k)).slice(0, 20),
      };
    })
    .catch(() => ({}));
  console.log(`\n[${label}]`, JSON.stringify(info));
  console.log(`[${label}] texte (${text.length} car.) :`, JSON.stringify(text.slice(0, 220)));
  await page.screenshot({ path: `${out}/${label}.png` });
};

// ---------- A. login mobile puis reload en 1920 ----------
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
await sleep(6000);
await login(page, { ...CFG });
await dismissOverlays(page);
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: false, hasTouch: false });
await sleep(1500);
await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
await sleep(12000);
await dismissOverlays(page);
await report('A-reload-1920');

// ---------- B. nudge de viewport (re-render) ----------
await page.setViewport({ width: 1919, height: 1079, deviceScaleFactor: 1, isMobile: false, hasTouch: false });
await sleep(1200);
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: false, hasTouch: false });
await sleep(6000);
await report('B-nudge-1920');

// ---------- C. login direct en 1920 (nouvelle page, session partagée) ----------
const page2 = await browser.newPage();
await page2.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: false, hasTouch: false });
await page2.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
await sleep(9000);
const state2 = await page2.evaluate(() => document.body.innerText.slice(0, 200)).catch(() => '');
console.log('\n[C] après goto desktop :', JSON.stringify(state2));
await page2.screenshot({ path: `${out}/C-entry-1920.png` });
await sleep(4000);
const state2b = await page2.evaluate(() => document.body.innerText.slice(0, 300)).catch(() => '');
console.log('[C] après 13 s :', JSON.stringify(state2b));
if (/Carrière|Bonjour|Passeport|Joueur/.test(state2b)) {
  await pause(page2);
} else {
  await login(page2, { ...CFG }).catch((e) => console.log('[C] login KO', String(e).slice(0, 120)));
}
await sleep(6000);
await dismissOverlays(page2);
const text2 = await bodyText(page2).catch(() => '');
console.log(`[C] texte (${text2.length}) :`, JSON.stringify(text2.slice(0, 220)));
await page2.screenshot({ path: `${out}/C-after-login.png` });

// ---------- D. clés localStorage complètes ----------
const keys = await page2
  .evaluate(() => {
    const all = [];
    for (let i = 0; i < localStorage.length; i += 1) all.push(localStorage.key(i));
    return all;
  })
  .catch(() => []);
console.log('\n[D] localStorage :', JSON.stringify(keys));

async function pause() {
  /* no-op : garde la fonction pour lisibilité */
}

await browser.close();
console.log('\nDONE');
