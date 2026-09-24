/**
 * Diagnostic de mise en page : pourquoi la zone de contenu du pôle Joueur est
 * effondrée en 1920 × 1080 ? Dump des plus gros éléments (rect, overflow,
 * transform) et test de plusieurs largeurs de fenêtre.
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
  shellReadyPattern: 'Carrière|Passeport|Bonjour,|Se déconnecter',
  postLoginSettleMs: 7000,
};
const out = '/tmp/player-layout';
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
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
await sleep(6000);
await login(page, { ...CFG });
await dismissOverlays(page);

const dumpLayout = async (label) => {
  const data = await page.evaluate(() => {
    const pick = [...document.querySelectorAll('*')]
      .map((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return {
          tag: el.tagName.toLowerCase(),
          cls: String(el.className || '').slice(0, 60),
          x: Math.round(r.x),
          y: Math.round(r.y),
          w: Math.round(r.width),
          h: Math.round(r.height),
          area: Math.round(r.width * r.height),
          ov: cs.overflow,
          transform: cs.transform === 'none' ? '' : cs.transform.slice(0, 40),
          op: cs.opacity,
          pos: cs.position,
          txt: (el.innerText || '').slice(0, 40).replace(/\n/g, ' '),
        };
      })
      .filter((e) => e.area > 200000)
      .sort((a, b) => b.area - a.area)
      .slice(0, 18);
    return { dpr: window.devicePixelRatio, vw: window.innerWidth, vh: window.innerHeight, pick };
  });
  console.log(`\n===== ${label} (vw=${data.vw} vh=${data.vh} dpr=${data.dpr})`);
  for (const e of data.pick) {
    console.log(
      `${e.tag}.${e.cls} x=${e.x} y=${e.y} ${e.w}x${e.h} pos=${e.pos} ov=${e.ov} op=${e.op} ${e.transform} | ${JSON.stringify(e.txt)}`,
    );
  }
  const text = await bodyText(page);
  console.log(`texte=${text.length}`);
  await page.screenshot({ path: `${out}/${label}.png` });
};

await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: false, hasTouch: false });
await sleep(1500);
await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
await sleep(11000);
await dismissOverlays(page);
await dumpLayout('w1920');

for (const w of [1440, 1280, 1024, 834]) {
  const h = Math.round((w * 9) / 16 / 2) * 2;
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: false, hasTouch: false });
  await sleep(5000);
  await dumpLayout(`w${w}`);
}

await browser.close();
console.log('\nDONE');
