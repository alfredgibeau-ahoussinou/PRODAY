/**
 * tap-lab — trouve l'interaction qui fait réellement naviguer l'app web (RN Web).
 *
 *   node tap-lab.mjs <Pôle> <desktop|mobile> "<libellé cible>"
 *
 * Essaie, dans l'ordre : événements sur la feuille de texte, sur l'ancêtre
 * pressable, clic souris CDP aux coordonnées, tap tactile CDP, el.click() DOM.
 * Après chaque essai on recharge pour repartir d'un état propre.
 */
import puppeteer from 'puppeteer-core';
import { sleep, login, dismissOverlays, bodyText, clickText } from './lib.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const APP_URL = 'http://localhost:8081/';
const ACC = {
  Club: { email: 'club.demo@proday.app', cta: 'Club', pattern: 'MON CLUB|Pilotage|Équipes rattachées|Prochain|FC ProDay' },
  Coach: { email: 'coach.demo@proday.app', cta: 'Coach', pattern: 'Cockpit|Briefing|priorit|Prochaines|BANC|FC ProDay' },
  Joueur: { email: 'player.demo@proday.app', cta: 'Joueur', pattern: 'Quêtes|Ma Saison|Progression|Objectifs|FC ProDay' },
  Parent: { email: 'parent.demo@proday.app', cta: 'Parent', pattern: 'Enfant|Alertes|Invitations|Famille|FC ProDay' },
};
const PASSWORD = 'ProDayDemo2026!';

const pole = process.argv[2] ?? 'Club';
const format = process.argv[3] ?? 'mobile';
const target = process.argv[4] ?? 'Matchs';
const acc = ACC[pole];

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

const page = await browser.newPage();
page.setDefaultTimeout(90000);
const cdp = await page.createCDPSession();

const frameFor = async () => {
  const { frameTree } = await cdp.send('Page.getFrameTree');
  const ids = [];
  const walk = (n) => {
    ids.push(n.frame.id);
    (n.childFrames ?? []).forEach(walk);
  };
  walk(frameTree);
  return ids[ids.length - 1];
};
const targetTab = await frameFor();

async function openMenuIfNeeded() {
  const t = await bodyText(page);
  if (/Tout ProDay/.test(t)) return;
  await clickText(page, 'Menu');
  await sleep(1600);
}

async function state() {
  const t = await bodyText(page);
  return {
    onMenu: /Tout ProDay/.test(t),
    head: t.split(' | ').slice(0, 5).join(' | '),
  };
}

const rectOf = (label) =>
  page.evaluate((label) => {
    const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
    const leaves = [...document.querySelectorAll('div,span,text')].filter(
      (e) => e.children.length === 0 && norm(e.textContent) === label,
    );
    const el = leaves[0];
    if (!el) return null;
    el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect();
    const pressable = el.closest('[role="button"],[role="tab"]') ?? el.parentElement ?? el;
    const pr = pressable.getBoundingClientRect();
    return {
      leaf: { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height },
      pressable: { x: pr.x + pr.width / 2, y: pr.y + pr.height / 2, w: pr.width, h: pr.height },
      hasPressable: Boolean(el.closest('[role="button"],[role="tab"]')),
      tag: el.tagName,
      role: el.getAttribute('role') || '',
      parentRole: el.parentElement?.getAttribute('role') || '',
      grandRole: el.parentElement?.parentElement?.getAttribute('role') || '',
    };
  }, label);

try {
  await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => document.body.innerText.length > 40, { timeout: 240000, polling: 1000 });
  await sleep(4000);
  await login(page, { email: acc.email, password: PASSWORD, pole, poleCta: acc.cta, shellReadyPattern: acc.pattern, postLoginSettleMs: 5000 });
  await dismissOverlays(page);
  await openMenuIfNeeded();
  const geo = await rectOf(target);
  console.log('géométrie:', JSON.stringify(geo));
  if (!geo) throw new Error(`Cible « ${target} » introuvable`);

  const attempt = async (name, fn) => {
    const before = await state();
    await fn();
    await sleep(3200);
    const after = await state();
    const ok = before.onMenu && !after.onMenu;
    console.log(`${ok ? '✅' : '❌'} ${name} → ${after.head.slice(0, 80)}`);
    return ok;
  };

  const results = {};
  // 1. Événements synthétiques sur la feuille de texte
  results.leafEvents = await attempt('événements sur la feuille', async () => {
    await page.evaluate((label) => {
      const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
      const el = [...document.querySelectorAll('div,span,text')].find((e) => e.children.length === 0 && norm(e.textContent) === label);
      const o = { bubbles: true, cancelable: true, view: window };
      for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']) {
        const Ctor = type.startsWith('pointer') ? PointerEvent : MouseEvent;
        el.dispatchEvent(new Ctor(type, o));
      }
    }, target);
  });
  await page.goto(APP_URL, { waitUntil: 'domcontentloaded' }); await sleep(3500); await openMenuIfNeeded();

  // 2. Événements sur l'ancêtre pressable
  results.pressableEvents = await attempt('événements sur l’ancêtre pressable', async () => {
    await page.evaluate((label) => {
      const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
      const el = [...document.querySelectorAll('div,span,text')].find((e) => e.children.length === 0 && norm(e.textContent) === label);
      const target = el.closest('[role="button"],[role="tab"]') ?? el.parentElement;
      const r = target.getBoundingClientRect();
      const o = { bubbles: true, cancelable: true, clientX: r.x + 5, clientY: r.y + 5, view: window };
      for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']) {
        const Ctor = type.startsWith('pointer') ? PointerEvent : MouseEvent;
        target.dispatchEvent(new Ctor(type, o));
      }
    }, target);
  });
  await page.goto(APP_URL, { waitUntil: 'domcontentloaded' }); await sleep(3500); await openMenuIfNeeded();

  // 3. Clic souris CDP aux coordonnées de la feuille
  results.mouseClick = await attempt('clic souris CDP (coordonnées)', async () => {
    const g = await rectOf(target);
    await page.mouse.click(g.leaf.x, g.leaf.y);
  });
  await page.goto(APP_URL, { waitUntil: 'domcontentloaded' }); await sleep(3500); await openMenuIfNeeded();

  // 4. Tap tactile CDP
  results.touchTap = await attempt('tap tactile CDP', async () => {
    const g = await rectOf(target);
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: g.leaf.x, y: g.leaf.y, id: 1 }],
    });
    await sleep(80);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  });
  await page.goto(APP_URL, { waitUntil: 'domcontentloaded' }); await sleep(3500); await openMenuIfNeeded();

  // 5. el.click() DOM
  results.domClick = await attempt('el.click() DOM', async () => {
    await page.evaluate((label) => {
      const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
      const el = [...document.querySelectorAll('div,span,text')].find((e) => e.children.length === 0 && norm(e.textContent) === label);
      el.click();
      el.parentElement?.click();
      el.closest('[role="button"]')?.click();
    }, target);
  });

  console.log('RÉSULTATS:', JSON.stringify(results));
  console.log('frame cible:', targetTab);
} finally {
  await browser.close();
}
