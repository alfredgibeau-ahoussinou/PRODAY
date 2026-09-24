/**
 * Explore 5 : même login mais le CTA est trouvé par [role=button][aria-label="Se connecter"].
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
  defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
});

const bodyText = (page) => page.evaluate(() => document.body.innerText.replace(/\n+/g, ' | ').slice(0, 400));

async function findTextCenter(page, needle) {
  return page.evaluate((needle) => {
    const els = [...document.querySelectorAll('div,span,text,p,button,a')]
      .filter((e) => e.children.length === 0 && e.textContent.trim() === needle);
    if (!els.length) return null;
    const r = els[els.length - 1].getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }, needle);
}
async function clickText(page, needle) {
  const c = await findTextCenter(page, needle);
  if (!c) return false;
  await page.mouse.click(c.x, c.y);
  return true;
}

try {
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 140)));
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForFunction(() => document.body && document.body.innerText.length > 40, { timeout: 180000, polling: 1000 });
  await sleep(3000);

  const dotIdx = await page.evaluate(() => {
    const tabs = [...document.querySelectorAll('[role="tab"]')];
    return tabs.findIndex((t) => (t.getAttribute('aria-label') || '').toLowerCase().includes('club'));
  });
  if (dotIdx >= 0) {
    const box = await page.evaluate((i) => {
      const r = [...document.querySelectorAll('[role="tab"]')][i].getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    }, dotIdx);
    await page.mouse.click(box.x, box.y);
    await sleep(1000);
  }
  await clickText(page, 'Entrer dans Club');
  await sleep(2500);
  await clickText(page, 'Se connecter');
  await sleep(2000);

  const inputs = await page.$$('input');
  await inputs[0].click(); await sleep(150); await inputs[0].type(EMAIL, { delay: 10 });
  await inputs[1].click(); await sleep(150); await inputs[1].type(PASSWORD, { delay: 10 });
  await sleep(300);

  // CTA via aria-label (authRole button)
  const btnBox = await page.evaluate(() => {
    const el = [...document.querySelectorAll('[role="button"]')].find(
      (b) => (b.getAttribute('aria-label') || b.textContent || '').trim() === 'Se connecter',
    );
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width };
  });
  console.log('submit btn:', btnBox);
  if (!btnBox) throw new Error('CTA introuvable par aria-label');
  await page.mouse.click(btnBox.x, btnBox.y);

  let ok = false;
  for (let i = 0; i < 30; i++) {
    await sleep(1000);
    const t = await bodyText(page);
    if (/Équipes|Calendrier|Menu|Copilote|Adhésions|Classement|Licences|Sponsors|Pilotage/.test(t)) { ok = true; console.log(`club shell after ${i + 1}s`); break; }
  }
  await sleep(5000);
  console.log('FINAL:', await bodyText(page));
  console.log('LOGIN', ok ? 'OK ✓' : 'FAILED ✗');
  await page.screenshot({ path: '/tmp/e5-club.png' });
} finally {
  await browser.close();
}
