/**
 * Probe rapide des 3 pôles restants : libellé CTA exact, gate joueur,
 * texte du shell après login. Ne capture rien.
 * Usage : node probe.mjs <Coach|Joueur|Parent>
 */
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = 'http://localhost:8081/';
const POLE = process.argv[2] ?? 'Coach';
const ACC = {
  Coach: { email: 'coach.demo@proday.app', cta: 'Entrer dans Coach', aria: 'coach' },
  Joueur: { email: 'player.demo@proday.app', cta: 'Entrer dans Joueur', aria: 'joueur' },
  Parent: { email: 'parent.demo@proday.app', cta: 'Entrer dans Parent', aria: 'parent' },
}[POLE];
const PASSWORD = 'ProDayDemo2026!';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'shell',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--mute-audio'],
  defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
});

const T = (p) => p.evaluate(() => document.body.innerText.replace(/\n+/g, ' | ').slice(0, 420));

try {
  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForFunction(() => document.body.innerText.length > 40, { timeout: 180000, polling: 1000 });
  await sleep(3000);

  // Sélection du pôle via dot
  const idx = await page.evaluate((a) => {
    const tabs = [...document.querySelectorAll('[role="tab"]')];
    return tabs.findIndex((t) => (t.getAttribute('aria-label') || '').toLowerCase().includes(a));
  }, ACC.aria);
  console.log('dot idx:', idx);
  if (idx >= 0) {
    const b = await page.evaluate((i) => {
      const r = [...document.querySelectorAll('[role="tab"]')][i].getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    }, idx);
    await page.mouse.click(b.x, b.y);
    await sleep(1100);
  }
  // CTA — on liste les libellés CTA visibles
  const ctas = await page.evaluate(() =>
    [...document.querySelectorAll('div,span')].filter((e) => e.children.length === 0 && /^Entrer dans/.test(e.textContent.trim())).map((e) => e.textContent.trim()),
  );
  console.log('CTA visibles:', ctas);
  const clicked = await page.evaluate((needle) => {
    const els = [...document.querySelectorAll('div,span')].filter((e) => e.children.length === 0 && e.textContent.trim() === needle);
    if (!els.length) return false;
    const r = els[els.length - 1].getBoundingClientRect();
    const ev = (t) => new MouseEvent(t, { bubbles: true, cancelable: true, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2, view: window });
    els[els.length - 1].dispatchEvent(ev('mousedown')); els[els.length - 1].dispatchEvent(ev('mouseup')); els[els.length - 1].dispatchEvent(ev('click'));
    return true;
  }, ACC.cta);
  console.log('clicked CTA:', clicked);
  await sleep(2600);
  console.log('GATE:', await T(page));
  const clickedLogin = await page.evaluate(() => {
    const els = [...document.querySelectorAll('div,span,text')].filter((e) => e.children.length === 0 && e.textContent.trim() === 'Se connecter');
    if (!els.length) return false;
    const r = els[els.length - 1].getBoundingClientRect();
    const ev = (t) => new MouseEvent(t, { bubbles: true, cancelable: true, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2, view: window });
    els[els.length - 1].dispatchEvent(ev('mousedown')); els[els.length - 1].dispatchEvent(ev('mouseup')); els[els.length - 1].dispatchEvent(ev('click'));
    return true;
  });
  console.log('clicked Se connecter:', clickedLogin);
  await sleep(2200);
  console.log('LOGIN FORM:', await T(page));

  const setVal = (i, v) => page.evaluate(({ i, v }) => {
    const input = document.querySelectorAll('input')[i];
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, v);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, { i, v });
  await setVal(0, ACC.email); await sleep(300);
  await setVal(1, PASSWORD); await sleep(400);
  const btn = await page.evaluate(() => {
    const el = [...document.querySelectorAll('[role="button"]')].find((b) => (b.getAttribute('aria-label') || '').trim() === 'Se connecter');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  await page.mouse.click(btn.x, btn.y);
  // Attendre 40 s et afficher l'état
  for (let i = 0; i < 40; i++) {
    await sleep(1000);
    const t = await T(page);
    if (!/Email|Mot de passe|Se connecter/.test(t.slice(0, 200))) {
      console.log(`shell après ${i + 1}s`);
      break;
    }
  }
  await sleep(6000);
  console.log('SHELL:', await T(page));
  await page.screenshot({ path: `/tmp/probe-${POLE.toLowerCase()}.png` });
} finally {
  await browser.close();
}
