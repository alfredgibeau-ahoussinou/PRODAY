/**
 * Smoke test CDP : ouvre l'app ProDay (web), explore l'écran de connexion
 * et vérifie qu'on peut piloter le rendu. Génère des screenshots dans /tmp.
 */
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = 'http://localhost:8081/';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'shell',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--mute-audio', '--autoplay-policy=no-user-gesture-required'],
  defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
});

try {
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 120)));
  page.on('console', (m) => {
    const t = m.text();
    if (m.type() === 'error' && !t.includes('net::ERR') && !t.includes('firebasestorage')) console.log('[console.err]', t.slice(0, 160));
  });
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });

  // Attendre le bundle Metro (peut recompiler à la première ouverture)
  await page.waitForFunction(() => document.body && document.body.innerText.length > 40, { timeout: 180000, polling: 1000 });
  await new Promise((r) => setTimeout(r, 4000));
  console.log('BODY TEXT HEAD:', (await page.evaluate(() => document.body.innerText)).slice(0, 400).replace(/\n+/g, ' | '));
  await page.screenshot({ path: '/tmp/explore-1.png' });

  // Chercher le texte "Connexion" ou équivalent
  const hasLogin = await page.evaluate(() => /connexion|se connecter|email/i.test(document.body.innerText));
  console.log('login visible ?', hasLogin);
} finally {
  await browser.close();
}
