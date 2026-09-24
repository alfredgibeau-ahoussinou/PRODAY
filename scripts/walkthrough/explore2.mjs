/**
 * Explore 2 : trouve l'entrée connexion, se connecte au compte club démo,
 * vérifie le shell club, puis teste la capture screencast CDP.
 */
import puppeteer from 'puppeteer-core';
import fs from 'fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = 'http://localhost:8081/';
const EMAIL = 'club.demo@proday.app';
const PASSWORD = 'ProDayDemo2026!';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'shell',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--mute-audio', '--autoplay-policy=no-user-gesture-required'],
  defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
});

try {
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 120)));
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForFunction(() => document.body && document.body.innerText.length > 40, { timeout: 180000, polling: 1000 });
  await sleep(3000);

  const dump = () => page.evaluate(() => document.body.innerText.slice(0, 600).replace(/\n+/g, ' | '));

  // 1. Passer l'univers (Passer)
  const bodyText = await page.evaluate(() => document.body.innerText);
  if (/Sélectionnez votre univers/.test(bodyText)) {
    await page.evaluate(() => {
      const els = [...document.querySelectorAll('*')].filter((e) => e.children.length === 0 && e.textContent.trim() === 'Passer');
      els[0]?.click();
    });
    console.log('clicked Passer');
    await sleep(2500);
  }
  console.log('AFTER PASSER:', await dump());

  // 2. Chercher un bouton connexion
  const candidates = await page.evaluate(() => {
    const out = [];
    for (const e of document.querySelectorAll('div[role], button, a, [tabindex], div')) {
      const t = (e.textContent || '').trim();
      if (t && t.length < 40 && /connexion|connecter|se connect|compte|auth/i.test(t) && e.children.length <= 2) {
        out.push({ tag: e.tagName, text: t, role: e.getAttribute('role'), cls: String(e.className).slice(0, 60) });
      }
    }
    return out.slice(0, 12);
  });
  console.log('LOGIN CANDIDATES:', JSON.stringify(candidates, null, 1));

  await page.screenshot({ path: '/tmp/explore2-guest.png' });
} finally {
  await browser.close();
}
