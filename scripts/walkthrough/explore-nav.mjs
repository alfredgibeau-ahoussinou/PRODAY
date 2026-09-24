/**
 * explore-nav — cartographie la navigation réelle d'un pôle (avant d'écrire un scénario).
 *
 *   node explore-nav.mjs <Club|Coach|Joueur|Parent> <desktop|mobile> [--deep]
 *
 * Sortie : /tmp/proday-rec/nav-<pole>-<format>.json
 *   { primary: [{label, role}], screens: [{from, title, tabs:[], buttons:[]}], menu: [...] }
 * --deep explore aussi chaque entrée de la grille « Menu » (aller + retour).
 */
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import {
  sleep,
  login,
  dismissOverlays,
  bodyText,
  clickText,
  clickAria,
  clickTarget,
  dumpCandidates,
} from './lib.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const APP_URL = 'http://localhost:8081/';

const ACC = {
  Club: { email: 'club.demo@proday.app', cta: 'Club', pattern: 'MON CLUB|Pilotage|Équipes rattachées|Prochain' },
  Coach: { email: 'coach.demo@proday.app', cta: 'Coach', pattern: 'BANC|Cockpit|Briefing|priorit|Prochaines' },
  Joueur: { email: 'player.demo@proday.app', cta: 'Joueur', pattern: 'Quêtes|Ma Saison|Progression|Mon compte|Objectifs' },
  Parent: { email: 'parent.demo@proday.app', cta: 'Parent', pattern: 'Enfant|Alertes|Invitations|Temps d' },
};
const PASSWORD = 'ProDayDemo2026!';

const pole = process.argv[2] ?? 'Club';
const format = process.argv[3] ?? 'mobile';
const deep = process.argv.includes('--deep');
const acc = ACC[pole];
if (!acc) throw new Error(`Pôle inconnu : ${pole}`);

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

/** Éléments interactifs identifiés (tabs/boutons) visibles à l'écran. */
const probeNav = (page) =>
  page.evaluate(() => {
    const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
    const rows = [];
    for (const e of document.querySelectorAll('[role="tab"],[role="button"]')) {
      const label = norm(e.getAttribute('aria-label'));
      const txt = norm(e.textContent);
      const r = e.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const y = Math.round(r.y);
      rows.push({
        label: label || txt.slice(0, 40),
        role: e.getAttribute('role'),
        y,
        edge: y > window.innerHeight - 140 ? 'bas' : y < 120 ? 'haut' : 'centre',
      });
    }
    return rows;
  });

const titleOf = async (page) => (await bodyText(page)).split(' | ').slice(0, 6).join(' | ');

const out = { pole, format, primary: [], screens: [], menu: [], failed: [] };
const seen = new Set();

try {
  const page = await browser.newPage();
  page.setDefaultTimeout(90000);
  await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => document.body.innerText.length > 40, { timeout: 240000, polling: 1000 });
  await sleep(3500);
  await login(page, {
    email: acc.email,
    password: PASSWORD,
    pole,
    poleCta: acc.cta,
    shellReadyPattern: acc.pattern,
    postLoginSettleMs: 6000,
  });
  await dismissOverlays(page);
  console.log(`[shell] ${await titleOf(page)}`);

  const nav1 = await probeNav(page);
  out.primary = nav1.filter((n) => !seen.has(n.label));
  console.log('[primary]', out.primary.map((n) => `${n.label}(${n.edge})`).join(' · '));

  // Un « Menu » (mobile) ou une entrée latérale ouvre la grille des modules.
  const menuTile = nav1.find((n) => /^menu$/i.test(n.label) || /ouvrir le menu/i.test(n.label));

  const openScreen = async (label, { viaMenu = false } = {}) => {
    if (viaMenu && menuTile) {
      await clickText(page, menuTile.label);
      await sleep(1500);
    }
    const r = await clickText(page, label);
    if (!r.ok) {
      const a = await clickText(page, label.replace(/\s*\(.*\)$/, ''));
      if (!a.ok) {
        out.failed.push({ label, context: (await bodyText(page)).slice(0, 160) });
        return null;
      }
    }
    await sleep(3000);
    const state = {
      from: viaMenu ? 'menu' : 'nav',
      label,
      title: await titleOf(page),
      tabs: (await probeNav(page)).filter((n) => n.edge === 'haut' || n.edge === 'centre').map((n) => n.label).slice(0, 14),
      candidates: (await dumpCandidates(page, 26)).map((c) => `${c.t}@${c.y}`),
    };
    out.screens.push(state);
    console.log(`  → ${label} : ${state.title.slice(0, 90)}`);
    return state;
  };

  // 1. Parcours des entrées de navigation primaire (tous formats)
  for (const n of out.primary.slice(0, 12)) {
    if (/^menu$/i.test(n.label)) continue;
    await openScreen(n.label);
  }

  // 2. Grille « Menu » (mobile) — inventaire des modules, puis aller/retour par module
  const reset = async () => {
    // Retour à un état connu : rechargement (la session persiste) → shell → fermeture des modales.
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => document.body.innerText.length > 40, { timeout: 180000, polling: 1000 });
    await sleep(3000);
    await dismissOverlays(page);
  };
  const openMenu = async () => {
    for (let i = 0; i < 3; i += 1) {
      const r = await clickText(page, 'Menu');
      await sleep(1600);
      const t = await bodyText(page);
      if (/Modules du club|Tout voir/.test(t)) return true;
      if (!r.ok) await sleep(800);
    }
    return false;
  };

  if (menuTile || format === 'mobile') {
    await reset();
    await openMenu();
    const grid = (await dumpCandidates(page, 90)).filter((c) => c.y > 60);
    out.menu = grid.map((c) => c.t);
    console.log('[menu]', out.menu.join(' · '));
    if (deep) {
      out.modules = [];
      for (const label of out.menu.slice(0, 34)) {
        if (/^(Mon club|Réglages|\d+|Tout voir|Gérer)$/i.test(label)) continue;
        await reset();
        const opened = await openMenu();
        const before = await bodyText(page);
        const r = await clickText(page, label);
        await sleep(3200);
        const after = await bodyText(page);
        const changed = r.ok && after.slice(0, 120) !== before.slice(0, 120);
        const back = changed
          ? await page.evaluate(() =>
              [...document.querySelectorAll('[role="button"],[aria-label]')]
                .map((e) => (e.getAttribute('aria-label') || e.textContent || '').trim())
                .filter((t) => /retour|back|fermer|précédent|accueil/i.test(t) && t.length < 40)
                .slice(0, 6),
            )
          : [];
        let backWorks = null;
        if (back.length) {
          await clickAria(page, back[0]);
          await sleep(2000);
          const t = await bodyText(page);
          backWorks = /Modules du club|Tout voir|MON CLUB|Accueil/.test(t);
        }
        const entry = {
          label,
          clicked: r.ok,
          changed,
          title: changed ? after.split(' | ').slice(0, 5).join(' | ') : null,
          back,
          backWorks,
        };
        out.modules.push(entry);
        console.log(
          `  ${changed ? '✓' : '✗'} ${label} → ${entry.title ? entry.title.slice(0, 70) : 'inchangé'} · retour=${back.join('/') || '—'} (${backWorks})
`,
        );
      }
    }
  }

  // 3. Format desktop : inventaire de la barre latérale
  if (format === 'desktop') {
    out.sidebar = (await dumpCandidates(page, 80)).filter((c) => c.y > 60).map((c) => c.t);
    console.log('[sidebar]', out.sidebar.join(' · '));
  }

  const dest = `/tmp/proday-rec/nav-${pole.toLowerCase()}-${format}.json`;
  fs.writeFileSync(dest, JSON.stringify(out, null, 2));
  console.log(`[ok] ${dest}`);
} finally {
  await browser.close();
}
