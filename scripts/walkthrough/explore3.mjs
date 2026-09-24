/**
 * Explore 3 : cliquer le CTA "Entrer dans Club" avec de VRAIS événements CDP
 * (souris puis touch), pour identifier le mode d'input qui déclenche Pressable.
 */
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = 'http://localhost:8081/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'shell',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--mute-audio'],
  defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
});

const bodyText = (page) => page.evaluate(() => document.body.innerText.replace(/\n+/g, ' | ').slice(0, 300));

/** Trouve le centre du rect d'un nœud texte exact. */
async function findTextCenter(page, needle) {
  return page.evaluate((needle) => {
    const els = [...document.querySelectorAll('div,span,text,p,button,a')]
      .filter((e) => e.children.length === 0 && e.textContent.trim() === needle);
    if (!els.length) return null;
    const r = els[els.length - 1].getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }, needle);
}

try {
  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForFunction(() => document.body && document.body.innerText.length > 40, { timeout: 180000, polling: 1000 });
  await sleep(3000);

  // Aller au pôle Club via les dots tablist (accessibilityRole="tab", aria rôle réel)
  const dotIdx = await page.evaluate(() => {
    const tabs = [...document.querySelectorAll('[role="tab"]')];
    const i = tabs.findIndex((t) => (t.getAttribute('aria-label') || '').toLowerCase().includes('club'));
    return i;
  });
  console.log('club dot index:', dotIdx);
  if (dotIdx >= 0) {
    const box = await page.evaluate((i) => {
      const tabs = [...document.querySelectorAll('[role="tab"]')];
      const r = tabs[i].getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    }, dotIdx);
    await page.mouse.click(box.x, box.y);
    await sleep(1200);
    console.log('after dot:', await bodyText(page));
  }

  // CTA "Entrer dans Club" — vrai clic souris CDP
  const cta = await findTextCenter(page, 'Entrer dans Club');
  console.log('cta center:', cta);
  if (cta) {
    await page.mouse.click(cta.x, cta.y);
    await sleep(2500);
    const t = await bodyText(page);
    console.log('after mouse click:', t);
    if (!/Continuer avec|Se connecter|Créer/.test(t)) {
      // essayer touch
      await page.touchscreen.tap(cta.x, cta.y);
      await sleep(2500);
      console.log('after touch tap:', await bodyText(page));
    }
  }
  await page.screenshot({ path: '/tmp/e3.png' });
} finally {
  await browser.close();
}
