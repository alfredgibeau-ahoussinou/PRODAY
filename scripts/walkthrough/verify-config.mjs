/**
 * verify-config — exécute un scénario sans enregistrer, et affiche pour chaque
 * étape l'écran réellement atteint. Sert à valider/corriger un config avant de
 * lancer une capture complète (et alimente la checklist de couverture).
 *
 *   node verify-config.mjs <config.json> [--json sortie.json]
 */
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import {
  sleep,
  clickReal,
  login,
  dismissOverlays,
  bodyText,
  waitForChange,
  screenSignature,
} from './lib.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const APP_URL = 'http://localhost:8081/';
const [, , cfgPath, ...rest] = process.argv;
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const jsonOut = rest.includes('--json') ? rest[rest.indexOf('--json') + 1] : null;
// `--shots dossier` : une capture par étape, pour vérifier visuellement le
// scénario avant d'engager une capture complète.
const shotsDir = rest.includes('--shots') ? rest[rest.indexOf('--shots') + 1] : null;
if (shotsDir) fs.mkdirSync(shotsDir, { recursive: true });

const viewport = cfg.mobile
  ? { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
  : { width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: false, hasTouch: false };

const scrollBy = (page, dy) =>
  page.evaluate((dy) => {
    const s = [...document.querySelectorAll('*')].filter((e) => e.scrollHeight > e.clientHeight + 40);
    const el = s[s.length - 1];
    if (el) el.scrollBy({ top: dy, behavior: 'smooth' });
    else window.scrollBy({ top: dy, behavior: 'smooth' });
  }, dy);

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'shell',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--mute-audio'],
  defaultViewport: viewport,
});

const report = [];
try {
  const page = await browser.newPage();
  page.setDefaultTimeout(90000);
  await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => document.body.innerText.length > 40, { timeout: 240000, polling: 1000 });
  await sleep(cfg.settleMs ?? 4000);
  await login(page, {
    email: cfg.email,
    password: cfg.password,
    pole: cfg.pole,
    poleCta: cfg.poleCta,
    shellReadyPattern: cfg.shellReadyPattern,
    postLoginSettleMs: cfg.postLoginSettleMs ?? 6000,
  });
  await dismissOverlays(page);

  for (const step of cfg.steps) {
    const before = (await bodyText(page)).slice(0, 400);
    let acted = false;
    const log = [];
    for (const action of step.actions ?? []) {
      const t = action.type;
      if (['text', 'aria', 'data-testid'].includes(t)) {
        const target =
          t === 'text'
            ? { kind: 'text', value: action.text }
            : t === 'aria'
              ? { kind: 'aria', value: action.label }
              : { kind: 'testid', value: action.value };
        // Même politique que l'enregistreur : on retente les cibles qui ne
        // répondent qu'après la fin d'une transition.
        let ok = false;
        for (let i = 0; i < (action.retry ?? 1) && !ok; i += 1) {
          const r = await clickReal(page, target);
          ok = r.ok;
          if (!ok) await sleep(1500);
        }
        acted = ok || acted;
        log.push(`${t}«${target.value}»=${ok ? 'ok' : 'ko'}`);
      } else if (t === 'key') {
        await page.keyboard.press(action.key);
        log.push(`key«${action.key}»`);
      } else if (t === 'dismiss') {
        await dismissOverlays(page);
        log.push('dismiss');
      } else if (t === 'scroll') {
        await scrollBy(page, action.dy ?? 500);
        log.push('scroll');
      } else if (t === 'scrollToTop') {
        await page.evaluate(() => {
          const s = [...document.querySelectorAll('*')].filter((e) => e.scrollHeight > e.clientHeight + 40);
          s[s.length - 1]?.scrollTo({ top: 0 });
          window.scrollTo({ top: 0 });
        });
      } else if (t === 'wait') log.push('wait');
      if (action.pauseAfter) await sleep(action.pauseAfter);
    }
    const changed = acted ? await waitForChange(page, before, step.changeTimeoutMs ?? 12000) : false;
    await sleep(1200);
    const observed = await screenSignature(page);
    if (shotsDir) {
      await page.screenshot({ path: `${shotsDir}/${String(report.length).padStart(2, '0')}-${step.id}.jpg`, quality: 60, type: 'jpeg' });
    }
    report.push({ id: step.id, label: step.label, acted, changed, observed, log: log.join(' ') });
    console.log(`${changed ? '✅' : acted ? '⚠️' : '·'} ${step.id} → ${observed}`);
    if (log.length) console.log(`     ${log}`);
  }
} catch (e) {
  console.log('ERREUR', String(e).slice(0, 300));
  report.push({ error: String(e).slice(0, 300) });
} finally {
  if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify({ cfg: cfgPath, report }, null, 2));
  await browser.close();
}
