/**
 * Explore 2b : univers → gate signup → Se connecter → login club démo → shell club.
 * Vérifie chaque étape et fait un screenshot d'étape.
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
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--mute-audio', '--autoplay-policy=no-user-gesture-required'],
  defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
});

const text = (page) => page.evaluate(() => document.body.innerText.replace(/\n+/g, ' | ').slice(0, 500));

/** Clique sur l'élément feuille dont textContent == exact. */
async function clickText(page, needle) {
  return page.evaluate((needle) => {
    const targets = [...document.querySelectorAll('div,span,text,p,button,a')]
      .filter((e) => e.children.length === 0 && e.textContent.trim() === needle);
    if (!targets.length) return false;
    let el = targets[targets.length - 1];
    let cur = el;
    for (let i = 0; i < 6 && cur.parentElement; i++) {
      cur = cur.parentElement;
      const hit = [...cur.querySelectorAll('*')].find((x) => x.children.length === 0 && x.textContent.trim() === needle);
      if (!hit) break;
    }
    const r = el.getBoundingClientRect();
    const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
    const ev = (type) => new MouseEvent(type, { bubbles: true, cancelable: true, clientX: cx, clientY: cy, view: window });
    el.dispatchEvent(ev('mousedown')); el.dispatchEvent(ev('mouseup')); el.dispatchEvent(ev('click'));
    return true;
  }, needle);
}

try {
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 140)));
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForFunction(() => document.body && document.body.innerText.length > 40, { timeout: 180000, polling: 1000 });
  await sleep(3000);

  // 1. Univers : naviguer jusqu'au pôle Club puis "Entrer dans Club"
  // Le carousel s'affiche ; taper flèche droite pour aller à Club (02/08)
  for (let i = 0; i < 4; i++) {
    const t = await text(page);
    if (/Entrer dans Club/.test(t)) break;
    await page.keyboard.press('ArrowRight');
    await sleep(700);
  }
  console.log('CAROUSEL:', await text(page));
  const clickedEnter = await clickText(page, 'Entrer dans Club');
  console.log('clicked Entrer dans Club:', clickedEnter);
  await sleep(2500);
  console.log('AFTER ENTER:', await text(page));
  await page.screenshot({ path: '/tmp/e2-gate.png' });

  // 2. Gate → "Se connecter"
  const clickedLogin = await clickText(page, 'Se connecter');
  console.log('clicked Se connecter:', clickedLogin);
  await sleep(2000);
  console.log('AFTER SE CONNECTER:', await text(page));
  await page.screenshot({ path: '/tmp/e2-login.png' });

  // 3. Remplir email + password
  const inputs = await page.$$('input');
  console.log('inputs found:', inputs.length);
  if (inputs.length >= 2) {
    await inputs[0].click({ clickCount: 3 });
    await inputs[0].type(EMAIL, { delay: 15 });
    await inputs[1].click({ clickCount: 3 });
    await inputs[1].type(PASSWORD, { delay: 15 });
    await page.screenshot({ path: '/tmp/e2-filled.png' });
    // 4. Bouton connexion CTA : cherche div avec texte "Se connecter" (bouton plein)
    const t = await text(page);
    console.log('BEFORE SUBMIT:', t);
    const btn = await page.evaluate(() => {
      const els = [...document.querySelectorAll('div[role="button"], div')].filter((e) => {
        const s = (e.textContent || '').trim();
        return (s === 'Se connecter' || s === 'Connexion') && e.children.length <= 3 && e.offsetWidth > 100;
      });
      if (!els.length) return false;
      const el = els[els.length - 1];
      const r = el.getBoundingClientRect();
      const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
      const ev = (type) => new MouseEvent(type, { bubbles: true, cancelable: true, clientX: cx, clientY: cy, view: window });
      el.dispatchEvent(ev('mousedown')); el.dispatchEvent(ev('mouseup')); el.dispatchEvent(ev('click'));
      return true;
    });
    console.log('clicked submit:', btn);
  }
  // Attendre post-login (jusqu'à 25 s)
  for (let i = 0; i < 25; i++) {
    await sleep(1000);
    const t = await text(page);
    if (/Équipes|Calendrier|Menu|Copilote|Adhésions|Matchs|Classement|Licences|Finances/.test(t)) {
      console.log(`SHELL CLUB détecté après ${i + 1}s`);
      break;
    }
    if (i === 24) console.log('TIMEOUT POST-LOGIN. État :', t);
  }
  await sleep(4000);
  console.log('FINAL:', await text(page));
  await page.screenshot({ path: '/tmp/e2-club.png' });
} finally {
  await browser.close();
}
