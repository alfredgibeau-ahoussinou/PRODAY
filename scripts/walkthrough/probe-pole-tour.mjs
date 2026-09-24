/**
 * Sonde générique d'un pôle en version desktop : liste les cibles de navigation
 * réellement cliquables (barre latérale + hub « Tout ProDay ») puis ouvre chaque
 * carte du hub pour consigner l'écran atteint.
 *
 *   node probe-pole-tour.mjs coach|parent
 *
 * Le but est d'écrire un scénario de capture fondé sur ce que l'application fait,
 * et non sur ce que le code semble promettre.
 */
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import { login, sleep, dismissOverlays, clickReal, findTargets, screenSignature } from './lib.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const POLE = process.argv[2] ?? 'coach';

const POLES = {
  coach: {
    email: 'coach.demo@proday.app',
    password: 'ProDayDemo2026!',
    label: 'Coach',
    shell: 'Seniors A|VIGILANCE|Accueil',
    ready: 'plus-menu-',
  },
  parent: {
    email: 'parent.demo@proday.app',
    password: 'ProDayDemo2026!',
    label: 'Parent',
    shell: 'Enfants liés|Sophie',
    ready: 'famille|enfant|menu',
  },
};

const cfg = POLES[POLE];
const out = `/tmp/pole-tour-${POLE}`;
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
  email: cfg.email,
  password: cfg.password,
  pole: cfg.label,
  poleCta: cfg.label,
  shellReadyPattern: cfg.shell,
  postLoginSettleMs: 7000,
});
await dismissOverlays(page);
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: false, hasTouch: false });
await sleep(1500);
await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
await sleep(14000);
await dismissOverlays(page);

const dump = () =>
  page.evaluate(() => {
    const rows = [];
    for (const el of document.querySelectorAll('[data-testid],[aria-label],[role="button"],[role="tab"],div,span')) {
      const r = el.getBoundingClientRect();
      if (r.width < 10 || r.height < 10 || r.width > 700) continue;
      if (r.y < -10 || r.y > window.innerHeight) continue;
      const tid = el.getAttribute('data-testid') || '';
      const aria = el.getAttribute('aria-label') || '';
      const txt = (el.innerText || '').replace(/\s+/g, ' ').trim();
      if (!tid && !aria && !(txt && txt.length < 40)) continue;
      if (!tid && !aria && el.children.length) continue;
      rows.push({ tid, aria, txt: txt.slice(0, 40), x: Math.round(r.x), y: Math.round(r.y) });
    }
    return rows;
  });

const seen = new Set();
console.log(`=== cibles ${POLE} desktop ===`);
for (const r of await dump()) {
  const key = `${r.tid}|${r.aria}|${r.txt}`;
  if (seen.has(key)) continue;
  seen.add(key);
  console.log(`  testid=${JSON.stringify(r.tid)} aria=${JSON.stringify(r.aria)} txt=${JSON.stringify(r.txt)} @${r.x},${r.y}`);
}
await page.screenshot({ path: `${out}/00-accueil.png` });

console.log('\n--- ouverture du hub (aria « Menu »)');
await clickReal(page, { kind: 'aria', value: 'Menu' });
await sleep(4500);
const cards = [...new Set((await dump()).map((r) => r.tid).filter((t) => t && t.startsWith('plus-menu') || t.startsWith('coach-menu') || t.startsWith('parent-menu')))];
console.log('cartes détectées :', cards.join(', ') || '(aucune)');
await page.screenshot({ path: `${out}/01-hub.png` });

for (const tid of cards) {
  const t = await findTargets(page, { kind: 'testid', value: tid });
  if (!t.length) {
    console.log(`\n>>> ${tid} : carte non cliquable (masquée) — on saute`);
    continue;
  }
  const before = await screenSignature(page);
  await clickReal(page, { kind: 'testid', value: tid });
  await sleep(6500);
  const after = await screenSignature(page);
  console.log(`\n>>> ${tid} : changement=${before !== after}`);
  console.log(`    écran = ${after.slice(0, 120)}`);
  if (before !== after) await page.screenshot({ path: `${out}/${tid}.png` });
  // Retour au hub par la barre latérale.
  for (const target of [{ kind: 'aria', value: 'Menu' }, { kind: 'text', value: 'Menu' }]) {
    await clickReal(page, target);
    await sleep(4000);
    if ((await findTargets(page, { kind: 'testid', value: cards[0] })).length) break;
  }
}

await browser.close();
console.log('\nDONE');
