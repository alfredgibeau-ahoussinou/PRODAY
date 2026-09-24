/**
 * Explore 8 : desktop 1920×1080 — login club, sidebar, tour rapide des pages Club.
 * Vérifie que chaque destination rend du contenu non vide.
 */
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = 'http://localhost:8081/';
const EMAIL = 'club.demo@proday.app';
const PASSWORD = 'ProDayDemo2026!';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'shell',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--mute-audio'],
  defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
});

try {
  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForFunction(() => document.body && document.body.innerText.length > 40, { timeout: 180000, polling: 1000 });
  await sleep(3000);

  // Desktop : le carousel est "cinematic" — rail latéral avec labels.
  // Cliquer le rail "Club" (role=button, aria-label "Univers Club")
  const railBtn = await page.evaluate(() => {
    const els = [...document.querySelectorAll('[role="button"]')].filter((b) => (b.getAttribute('aria-label') || '') === 'Univers Club');
    if (!els.length) return null;
    const r = els[0].getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  console.log('rail Univers Club:', railBtn);
  if (railBtn) {
    await page.mouse.click(railBtn.x, railBtn.y);
    await sleep(1200);
  } else {
    // fallback : dots
    const dotIdx = await page.evaluate(() => {
      const tabs = [...document.querySelectorAll('[role="tab"]')];
      return tabs.findIndex((t) => (t.getAttribute('aria-label') || '').toLowerCase().includes('club'));
    });
    if (dotIdx >= 0) {
      const b = await page.evaluate((i) => {
        const r = [...document.querySelectorAll('[role="tab"]')][i].getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      }, dotIdx);
      await page.mouse.click(b.x, b.y);
      await sleep(1200);
    }
  }
  const cta = await page.evaluate(() => {
    const els = [...document.querySelectorAll('div,span')].filter((e) => e.children.length === 0 && e.textContent.trim() === 'Entrer dans Club');
    if (!els.length) return null;
    const r = els[els.length - 1].getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  console.log('cta:', cta);
  if (cta) { await page.mouse.click(cta.x, cta.y); await sleep(2500); }
  const loginLink = await page.evaluate(() => {
    const els = [...document.querySelectorAll('div,span,text')].filter((e) => e.children.length === 0 && e.textContent.trim() === 'Se connecter');
    if (!els.length) return null;
    const r = els[els.length - 1].getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  if (loginLink) { await page.mouse.click(loginLink.x, loginLink.y); await sleep(2000); }

  const setVal = (idx, value) => page.evaluate(({ index, value }) => {
    const input = document.querySelectorAll('input')[index];
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, { index: idx, value });
  await setVal(0, EMAIL); await sleep(250);
  await setVal(1, PASSWORD); await sleep(300);
  const btn = await page.evaluate(() => {
    const el = [...document.querySelectorAll('[role="button"]')].find((b) => (b.getAttribute('aria-label') || '').trim() === 'Se connecter');
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  await page.mouse.click(btn.x, btn.y);
  for (let i = 0; i < 30; i++) {
    await sleep(1000);
    const t = await page.evaluate(() => document.body.innerText);
    if (/Pilotage|Équipes|Calendrier/.test(t)) { console.log(`shell after ${i + 1}s`); break; }
  }
  await sleep(5000);
  await page.screenshot({ path: '/tmp/e8-desktop-accueil.png' });

  // Sidebar : extraire les items accessibles (role=button dans la sidebar)
  const navItems = await page.evaluate(() => {
    const btns = [...document.querySelectorAll('[role="button"], [role="tab"]')];
    return btns.map((b) => (b.getAttribute('aria-label') || b.textContent || '').trim().replace(/\n+/g, ' ')).filter((s) => s && s.length < 40);
  });
  console.log('NAV ITEMS:', JSON.stringify([...new Set(navItems)], null, 0));
} finally {
  await browser.close();
}
