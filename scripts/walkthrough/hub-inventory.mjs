/**
 * hub-inventory — inventaire des cartes du hub « Tout ProDay » (Menu mobile).
 *
 *   node hub-inventory.mjs <Pole> [--shots /tmp/dir]
 *
 * Le hub est une liste groupée : on le déroule par paliers et on relève, pour chaque
 * palier, les lignes interactives (titre + sous-titre) avec leurs coordonnées.
 */
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import { sleep, login, dismissOverlays, clickReal, bodyText } from './lib.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const APP_URL = 'http://localhost:8081/';
const ACC = {
  Club: { email: 'club.demo@proday.app', cta: 'Club' },
  Coach: { email: 'coach.demo@proday.app', cta: 'Coach' },
  Joueur: { email: 'player.demo@proday.app', cta: 'Joueur' },
  Parent: { email: 'parent.demo@proday.app', cta: 'Parent' },
};
const PASSWORD = 'ProDayDemo2026!';
const pole = process.argv[2] ?? 'Club';
const shotsIdx = process.argv.indexOf('--shots');
const shots = shotsIdx > 0 ? process.argv[shotsIdx + 1] : null;
const acc = ACC[pole];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'shell',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--mute-audio'],
  defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
});

/** Lignes interactives visibles (hors dock bas). */
const rows = (page) =>
  page.evaluate(() => {
    const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
    const out = [];
    for (const e of document.querySelectorAll('[tabindex="0"],[role="button"]')) {
      const r = e.getBoundingClientRect();
      if (r.width === 0 || r.height === 0 || r.height < 30) continue;
      if (r.y < 60 || r.y > window.innerHeight - 140) continue;
      const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      if (hit !== e && !e.contains(hit)) continue;
      const txt = norm(e.textContent).slice(0, 80);
      if (!txt) continue;
      out.push({ text: txt, y: Math.round(r.y), h: Math.round(r.height) });
    }
    return out;
  });

const scrollHub = (page, dy) =>
  page.evaluate((dy) => {
    const s = [...document.querySelectorAll('*')].filter((e) => e.scrollHeight > e.clientHeight + 40);
    const el = s[s.length - 1];
    if (el) el.scrollBy({ top: dy, behavior: 'instant' });
  }, dy);

try {
  const page = await browser.newPage();
  page.setDefaultTimeout(90000);
  await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => document.body.innerText.length > 40, { timeout: 240000, polling: 1000 });
  await sleep(4000);
  await login(page, {
    email: acc.email,
    password: PASSWORD,
    pole,
    poleCta: acc.cta,
    shellReadyPattern: 'Se déconnecter|Se deconnecter',
    postLoginSettleMs: 6000,
  });
  await dismissOverlays(page);
  const opened = await clickReal(page, { kind: 'aria', value: 'Menu' });
  await sleep(4000);
  console.log('hub ouvert:', opened.ok, '| texte:', (await bodyText(page)).slice(0, 80));

  const inventory = [];
  for (let i = 0; i < 6; i += 1) {
    const r = await rows(page);
    inventory.push(...r);
    if (shots) await page.screenshot({ path: `${shots}/hub-${i}.png` });
    console.log(`palier ${i}:`, r.map((x) => x.text.slice(0, 34)).join(' || ').slice(0, 500));
    await scrollHub(page, 520);
    await sleep(1200);
  }
  const dest = `/tmp/proday-rec/hub-${pole.toLowerCase()}-mobile.json`;
  fs.writeFileSync(dest, JSON.stringify({ pole, inventory }, null, 2));
  console.log(`[ok] ${dest} — ${inventory.length} lignes`);
} catch (e) {
  console.log('ERREUR', String(e).slice(0, 300));
} finally {
  await browser.close();
}
