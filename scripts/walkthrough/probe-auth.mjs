/**
 * probe-auth — diagnostic de l'accès au gate de connexion d'un pôle.
 * Liste les tuiles/dots d'univers visibles, clique chacune et note si un CTA
 * « Entrer dans … » ou le lien « Se connecter » apparaît ensuite.
 *
 *   node probe-auth.mjs <Club|Coach|Joueur|Parent> <desktop|mobile>
 */
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import { sleep, bodyText } from './lib.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const APP_URL = 'http://localhost:8081/';
const pole = process.argv[2] ?? 'Parent';
const format = process.argv[3] ?? 'desktop';

const viewport =
  format === 'mobile'
    ? { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
    : { width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: false, hasTouch: false };

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'shell',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--mute-audio'],
  defaultViewport: viewport,
});

const tiles = (page) =>
  page.evaluate(() => {
    const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
    const rows = [];
    for (const e of document.querySelectorAll('[role="tab"],[aria-label]')) {
      const label = norm(e.getAttribute('aria-label'));
      if (!label) continue;
      const r = e.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      rows.push({ label, role: e.getAttribute('role') || '', x: Math.round(r.x), y: Math.round(r.y) });
    }
    return rows;
  });

const ctas = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('div,span')]
      .filter((e) => e.children.length === 0 && /^(Entrer dans|Ouvrir|Se connecter|Créer un compte)/.test(e.textContent.trim()))
      .map((e) => e.textContent.trim())
      .slice(0, 8),
  );

try {
  const page = await browser.newPage();
  await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => document.body.innerText.length > 40, { timeout: 240000, polling: 1000 });
  await sleep(4000);
  const t = await tiles(page);
  console.log('tuiles:', JSON.stringify(t.filter((x) => /univers|pôle|pole/i.test(x.label)).slice(0, 12)));
  console.log('CTA initiaux:', await ctas(page));

  // On tente chaque tuile dont le libellé évoque un univers, puis on relève les CTA.
  for (const tile of t.filter((x) => /univers/i.test(x.label)).slice(0, 10)) {
    await page.evaluate((label) => {
      const el = [...document.querySelectorAll('[aria-label]')].find(
        (e) => (e.getAttribute('aria-label') || '').trim() === label,
      );
      if (!el) return;
      el.scrollIntoView({ block: 'center', inline: 'center' });
      const r = el.getBoundingClientRect();
      const o = { bubbles: true, cancelable: true, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2, view: window };
      for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']) {
        const Ctor = type.startsWith('pointer') ? PointerEvent : MouseEvent;
        el.dispatchEvent(new Ctor(type, o));
      }
    }, tile.label);
    await sleep(3000);
    console.log(`après « ${tile.label} » →`, await ctas(page));
  }
  console.log('texte fin:', (await bodyText(page)).slice(0, 300));
  await page.screenshot({ path: `/tmp/probeauth-${pole}-${format}.png` });
  fs.writeFileSync(
    `/tmp/proday-rec/probeauth-${pole}-${format}.json`,
    JSON.stringify({ pole, format, tiles: t }, null, 2),
  );
} finally {
  await browser.close();
}
