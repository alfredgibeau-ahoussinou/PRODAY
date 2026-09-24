/**
 * Explore 7 : login avec remplissage fiable (native setter + event input),
 * vérification de la valeur avant submit.
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

  // Remplissage natif fiable (setter natif + event input) — react-native-web écoute onChange.
  const setVal = (sel, value) => page.evaluate(({ index, value }) => {
    const input = document.querySelectorAll('input')[index];
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, { index: sel, value });

  await setVal(0, EMAIL);
  await sleep(300);
  await setVal(1, PASSWORD);
  await sleep(400);
  const vals = await page.evaluate(() => [...document.querySelectorAll('input')].map((i) => i.value));
  console.log('VALUES:', JSON.stringify(vals));
  if (vals[0] !== EMAIL || vals[1] !== PASSWORD) throw new Error('remplissage échoué');

  const btnBox = await page.evaluate(() => {
    const el = [...document.querySelectorAll('[role="button"]')].find(
      (b) => (b.getAttribute('aria-label') || b.textContent || '').trim() === 'Se connecter',
    );
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  await page.mouse.click(btnBox.x, btnBox.y);

  let ok = false;
  for (let i = 0; i < 30; i++) {
    await sleep(1000);
    const t = await page.evaluate(() => document.body.innerText.replace(/\n+/g, ' | ').slice(0, 300));
    if (/Équipes|Calendrier|Menu|Copilote|Adhésions|Classement|Licences|Sponsors|Pilotage/.test(t)) { ok = true; console.log(`club shell after ${i + 1}s`); break; }
  }
  await sleep(5000);
  console.log('FINAL:', await page.evaluate(() => document.body.innerText.replace(/\n+/g, ' | ').slice(0, 300)));
  console.log('LOGIN', ok ? 'OK ✓' : 'FAILED ✗');
  await page.screenshot({ path: '/tmp/e7-club.png' });
} finally {
  await browser.close();
}
