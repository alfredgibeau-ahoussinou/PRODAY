/**
 * map-shell — cartographie la navigation réellement cliquable d'un pôle, format par format.
 *
 *   node map-shell.mjs <Club|Coach|Joueur|Parent> <desktop|mobile>
 *
 * Déroule : connexion → inventaire des cibles de navigation → pour chaque entrée
 * de premier niveau, clic puis nouvel inventaire (accordéons « Menu », groupes du hub,
 * sous-onglets d'écran). Sortie : /tmp/proday-rec/map-<pole>-<format>.json
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
const format = process.argv[3] ?? 'desktop';
const acc = ACC[pole];

const viewport =
  format === 'mobile'
    ? { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
    : { width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: false, hasTouch: false };

/** Titre d'écran = plus gros texte visible en haut de la zone de contenu. */
const titleSelector = () =>
  // eslint-disable-next-line no-undef
  [...document.querySelectorAll('div,span,text')]
    .filter((e) => e.children.length === 0 && (e.textContent || '').trim().length > 2 && (e.textContent || '').trim().length < 60)
    .map((e) => ({ t: e.textContent.trim(), r: e.getBoundingClientRect(), fs: parseFloat(getComputedStyle(e).fontSize) }))
    .filter((x) => x.r.width > 0 && x.r.height > 0 && x.fs >= 17 && x.r.y < window.innerHeight * 0.5)
    .sort((a, b) => b.fs - a.fs || a.r.y - b.r.y)
    .slice(0, 3)
    .map((x) => x.t)
    .join(' · ');

const screenTitle = (page) => page.evaluate(titleSelector);

const navDump = (page) =>
  page.evaluate(() => {
    const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
    const rows = [];
    for (const e of document.querySelectorAll('[role="tab"],[role="button"],[tabindex="0"],[aria-label]')) {
      const label = norm(e.getAttribute('aria-label'));
      const txt = e.children.length === 0 ? norm(e.textContent) : norm(e.textContent).slice(0, 40);
      const name = label || txt;
      if (!name || name.length > 48) continue;
      const r = e.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (getComputedStyle(e).pointerEvents === 'none') continue;
      const cx = r.x + r.width / 2;
      const cy = r.y + r.height / 2;
      if (cy > window.innerHeight) continue;
      const hit = document.elementFromPoint(cx, cy);
      if (hit !== e && !e.contains(hit)) continue;
      rows.push({
        name,
        aria: label,
        role: e.getAttribute('role') || '',
        x: Math.round(cx),
        y: Math.round(cy),
        edge: cy > window.innerHeight - 150 ? 'bas' : cy < 130 ? 'haut' : 'centre',
      });
    }
    // dédoublonnage par nom + position
    const seen = new Set();
    return rows.filter((r) => {
      const k = `${r.name}@${r.x},${r.y}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'shell',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--mute-audio'],
  defaultViewport: viewport,
});

const out = { pole, format, home: null, tree: [] };
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
  out.home = { title: await screenTitle(page), nav: await navDump(page) };
  console.log('[home]', out.home.title);
  console.log('[nav]', out.home.nav.map((n) => `${n.name}(${n.edge})`).join(' · '));

  const homeNav = out.home.nav;
  const skip = /^(Se déconnecter|Se deconnecter|Se connecter|Créer|Tout|Tout voir|Fermer|Aide|Annuaire)$/i;
  for (const entry of homeNav.filter((n) => !skip.test(n.name)).slice(0, 10)) {
    const r = await clickReal(page, { kind: entry.aria && entry.aria === entry.name ? 'aria' : 'text', value: entry.name });
    await sleep(3500);
    const title = await screenTitle(page);
    const sub = await navDump(page);
    out.tree.push({ from: entry.name, clicked: r.ok, title, sub });
    console.log(`  → ${entry.name} : ${title}`);
    console.log(`     sous-cibles : ${sub.map((s) => s.name).join(' · ').slice(0, 240)}`);
    // retour à l'accueil du pôle avant l'entrée suivante
    await clickReal(page, { kind: 'aria', value: 'Accueil' });
    await sleep(2500);
  }
} catch (e) {
  console.log('ERREUR', String(e).slice(0, 300));
} finally {
  const dest = `/tmp/proday-rec/map-${pole.toLowerCase()}-${format}.json`;
  fs.writeFileSync(dest, JSON.stringify(out, null, 2));
  console.log(`[ok] ${dest}`);
  await browser.close();
}
