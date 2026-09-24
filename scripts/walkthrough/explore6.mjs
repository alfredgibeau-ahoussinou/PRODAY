/**
 * Explore 6 : capture TOUS les logs console pendant la tentative de login
 * pour voir le code d'erreur Firebase réel.
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

try {
  const page = await browser.newPage();
  page.on('console', (m) => {
    const t = m.text();
    if (/auth|error|fail|denied| bloc| 火|Firebase/i.test(t)) console.log('[console]', m.type(), t.slice(0, 220));
  });
  page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 200)));
  page.on('requestfailed', (r) => console.log('[reqfail]', r.url().slice(0, 100), r.failure()?.errorText));

  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForFunction(() => document.body && document.body.innerText.length > 40, { timeout: 180000, polling: 1000 });
  await sleep(3000);

  const dotIdx = await page.evaluate(() => {
    const tabs = [...document.querySelectorAll('[role="tab"]')];
    return tabs.findIndex((t) => (t.getAttribute('aria-label') || '').toLowerCase().includes('club'));
  });
  const box = await page.evaluate((i) => {
    const r = [...document.querySelectorAll('[role="tab"]')][i].getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }, dotIdx);
  await page.mouse.click(box.x, box.y);
  await sleep(1000);
  const cta = await page.evaluate(() => {
    const els = [...document.querySelectorAll('div,span')].filter((e) => e.children.length === 0 && e.textContent.trim() === 'Entrer dans Club');
    const r = els[els.length - 1].getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  await page.mouse.click(cta.x, cta.y);
  await sleep(2500);
  const loginLink = await page.evaluate(() => {
    const els = [...document.querySelectorAll('div,span,text')].filter((e) => e.children.length === 0 && e.textContent.trim() === 'Se connecter');
    const r = els[els.length - 1].getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  await page.mouse.click(loginLink.x, loginLink.y);
  await sleep(2000);

  const inputs = await page.$$('input');
  await inputs[0].click(); await inputs[0].type(EMAIL, { delay: 10 });
  await inputs[1].click(); await inputs[1].type(PASSWORD, { delay: 10 });
  await sleep(300);

  // Debug : valeur des deux inputs
  const vals = await page.evaluate(() => [...document.querySelectorAll('input')].map((i) => ({ type: i.type, value: i.value, len: i.value.length })));
  console.log('INPUT VALUES:', JSON.stringify(vals));

  const btnBox = await page.evaluate(() => {
    const el = [...document.querySelectorAll('[role="button"]')].find(
      (b) => (b.getAttribute('aria-label') || b.textContent || '').trim() === 'Se connecter',
    );
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  await page.mouse.click(btnBox.x, btnBox.y);
  await sleep(6000);
  const t = await page.evaluate(() => document.body.innerText.replace(/\n+/g, ' | ').slice(0, 250));
  console.log('AFTER SUBMIT:', t);
} finally {
  await browser.close();
}
