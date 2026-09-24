/**
 * probe-dpr — valide le gain de netteté du suréchantillonnage.
 *
 *   node probe-dpr.mjs <config.json>
 *
 * Se connecte, affiche l'accueil, puis capture le MÊME écran deux fois :
 *   A) 1920×1080 en densité 1  (l'ancienne chaîne : 1:1, JPEG q80)
 *   B) 1920×1080 en densité 2  (3840×2160 capturés, puis réduits en Lanczos, JPEG q95)
 * Les deux images sont ensuite réduites à la même taille pour comparaison visuelle
 * et le gain est chiffré (variance du Laplacien = netteté, SSIM A→B).
 */
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import puppeteer from 'puppeteer-core';
import { sleep, login, dismissOverlays } from './lib.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const APP_URL = process.env.PRODAY_URL ?? 'http://localhost:8081/';
const cfg = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const OUT = process.env.OUT_DIR ?? '/tmp/proday-dpr-probe';
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--force-device-scale-factor=1', '--hide-scrollbars'],
  defaultViewport: null,
});
const page = await browser.newPage();

const shoot = async (dpr, tag) => {
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: dpr, isMobile: false, hasTouch: false });
  await sleep(1200);
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 }).catch(() => {});
  await page.waitForFunction(() => document.body && document.body.innerText.length > 60, { timeout: 120000, polling: 1000 }).catch(() => {});
  await sleep(7000);
  await dismissOverlays(page).catch(() => {});
  await sleep(1500);
  const raw = path.join(OUT, `${tag}-raw.png`);
  await page.screenshot({ path: raw, type: 'png' });
  const size = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio, t: document.body.innerText.slice(0, 80).replace(/\n/g, ' | ') }));
  console.log(`[${tag}] DPR ${size.dpr} · ${size.w}×${size.h} css · « ${size.t} »`);
  return { raw, ...size };
};

// Connexion dans la disposition mobile (le carrousel d'univers n'existe qu'ainsi),
// puis bascule sur le format filmé — même démarche que l'enregistreur.
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForFunction(() => document.body && document.body.innerText.length > 40, { timeout: 240000, polling: 1000 });
await sleep(4000);
await login(page, {
  email: cfg.email,
  password: cfg.password,
  pole: cfg.pole,
  poleCta: cfg.poleCta,
  shellReadyPattern: cfg.shellReadyPattern,
  postLoginSettleMs: cfg.postLoginSettleMs ?? 6000,
});
await dismissOverlays(page).catch(() => {});

const a = await shoot(1, 'A-dpr1');
const b = await shoot(2, 'B-dpr2');
await browser.close();

// Rendu de la chaîne complète : A = 1:1 JPEG q80 ; B = réduction Lanczos + JPEG q95.
const ff = (args) => execFileSync('ffmpeg', ['-y', '-v', 'error', ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
ff(['-i', a.raw, '-q:v', '6', '-vf', 'scale=1920:1080:flags=lanczos', path.join(OUT, 'A-ancienne-chaine.jpg')]);
ff(['-i', b.raw, '-q:v', '3', '-vf', 'scale=1920:1080:flags=lanczos', path.join(OUT, 'B-nouvelle-chaine.jpg')]);

// Netteté objective : énergie des hautes fréquences = écart entre l'image et sa
// version floutée. Plus haut = plus de détail fin (bords de texte).
const acutance = (img) => {
  const r = execFileSync(
    'ffmpeg',
    ['-hide_banner', '-i', img, '-filter_complex',
     '[0:v]split[a][b];[b]gblur=sigma=1.5[blur];[a][blur]blend=all_mode=difference,signalstats',
     '-f', 'null', '-'],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );
  const m = (r.stdout?.toString('utf8') ?? '') + (r.stderr?.toString('utf8') ?? '');
  const yavg = m.match(/YAVG:([\d.]+)/);
  return yavg ? Number(yavg[1]) : NaN;
};

const rows = [
  ['A  ancienne chaîne (DPR1 → 1080p, JPEG q80)', path.join(OUT, 'A-ancienne-chaine.jpg')],
  ['B  nouvelle chaîne (DPR2 → 1080p, JPEG q95)', path.join(OUT, 'B-nouvelle-chaine.jpg')],
];
console.log('\n# source                                   | poids | acutance (HF)');
for (const [tag, file] of rows) {
  const bytes = fs.statSync(file).size;
  console.log(`${tag.padEnd(42)} | ${String(Math.round(bytes / 1024)).padStart(4)} Ko | ${acutance(file).toFixed(3)}`);
}
console.log(`\n[ok] comparaison visuelle dans ${OUT}`);
