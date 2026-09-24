/**
 * Recorder ProDay — capture screencast CDP d'une visite guidée.
 * Usage : node record.mjs <config.json> <outDir>
 *
 * Le config décrit viewport, compte, et la liste ordonnée des étapes
 * (login + navigation + pauses de narration).
 * Sortie : frames/*.jpg + steps.json (t0/t1 par étape) + diagnostics.json
 *          + frames.log (horodatage de chaque frame pour le montage).
 */
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import {
  sleep,
  clickReal,
  login,
  dismissOverlays,
  bodyText,
  waitForChange,
  screenSignature,
  dumpCandidates,
  findTargets,
} from './lib.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const APP_URL = process.env.PRODAY_URL ?? 'http://localhost:8081/';

const [, , cfgPath, outDirArg] = process.argv;
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const outDir = outDirArg ?? cfg.outDir ?? '/tmp/proday-shots';
fs.rmSync(path.join(outDir, 'frames'), { recursive: true, force: true });
fs.rmSync(path.join(outDir, 'frames.log'), { force: true });
fs.mkdirSync(path.join(outDir, 'frames'), { recursive: true });

// Densité de pixels de la page. Elle améliore le rendu du texte à l'écran — et
// surtout, elle est **indispensable aux images suréchantillonnées** (voir plus bas),
// car elles seules sont rendues à cette densité.
//   desktop : 1920×1080 CSS × 2 → images de 3840×2160, réduites à 1920×1080
//   mobile  : 390×844 CSS × 3  → images de 1170×2532, réduites à 1080×2340
const DPR = cfg.mobile ? (cfg.deviceScale ?? 3) : (cfg.deviceScale ?? 2);
const viewport = cfg.mobile
  ? { width: 390, height: 844, deviceScaleFactor: DPR, isMobile: true, hasTouch: true }
  : { width: 1920, height: 1080, deviceScaleFactor: DPR, isMobile: false, hasTouch: false };
const SCREENCAST_MAX = 4096;
// Qualité du JPEG de capture : c'est la perte la plus en amont, donc la plus
// coûteuse à rattraper. 95 garde les bords de texte propres (80 laissait du ringing).
const JPEG_QUALITY = cfg.jpegQuality ?? 95;
// Cadence d'échantillonnage des images nettes (0 = désactivé).
const HIRES_EVERY_MS = cfg.hiResEveryMs ?? 2000;

const steps = [];
let frameTotal = 0;
let finished = false;

/** Écrit steps.json + diagnostics.json (appelé après chaque étape, et à la fin). */
function flushManifest() {
  if (steps.length) steps[steps.length - 1].observed = currentStepObserved;
  try {
    fs.writeFileSync(
      path.join(outDir, 'steps.json'),
      JSON.stringify(
        { cfg: { ...cfg, password: undefined }, steps, frameCount: frameTotal, partial: !finished },
        null,
        2,
      ),
    );
    fs.writeFileSync(path.join(outDir, 'diagnostics.json'), JSON.stringify(diagnostics, null, 2));
  } catch {
    /* le manifeste est un journal de bord : on ne casse pas la capture pour lui */
  }
}
const diagnostics = { failedSteps: [], notes: [] };
let captureT0 = null;
let currentStepObserved = null;
let unchangedStreak = 0;

function markStep(id, label) {
  const t = (Date.now() - captureT0) / 1000;
  if (steps.length) {
    steps[steps.length - 1].t1 = t;
    steps[steps.length - 1].observed = currentStepObserved;
  }
  steps.push({ id, label, t0: t, t1: null });
  console.log(`[step] ${id} — ${label} @ ${t.toFixed(1)}s -> ${currentStepObserved ?? ''}`);
}

// Certains pôles n'exposent le choix d'univers (carrousel) que sur la disposition
// mobile. `loginViewport` permet de se connecter dans cette disposition puis de
// basculer sur le format à filmer : la capture ne montre ainsi jamais le mot de passe.
const loginViewport = cfg.loginViewport
  ? { width: cfg.loginViewport.width, height: cfg.loginViewport.height, deviceScaleFactor: 1, isMobile: true, hasTouch: true }
  : viewport;

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'shell',
  args: [
    '--no-sandbox',
    '--disable-gpu',
    '--hide-scrollbars',
    '--mute-audio',
    '--autoplay-policy=no-user-gesture-required',
    '--force-device-scale-factor=1',
  ],
  defaultViewport: loginViewport,
});

try {
  const page = await browser.newPage();
  page.setDefaultTimeout(120000);
  const cdp = await page.createCDPSession();

  // ---------- Screencast (redémarrable : un setViewport interrompt le flux) ----------
  const framesDir = path.join(outDir, 'frames');
  let frameIndex = 0;
  let screencasting = false;
  let lastFrameAt = Date.now();
  // Décalage entre l'horloge du navigateur (celle des images du flux) et celle de
  // Node : il permet d'horodater les images nettes sur la **même** échelle de temps
  // que le flux, condition pour que le montage puisse les rattacher au bon écran.
  let clockOffset = null;
  cdp.on('Page.screencastFrame', async (ev) => {
    try {
      const { sessionId, data, metadata } = ev;
      lastFrameAt = Date.now();
      if (clockOffset === null) clockOffset = Date.now() / 1000 - metadata.timestamp;
      fs.writeFileSync(
        path.join(framesDir, `f${String(frameIndex).padStart(6, '0')}.jpg`),
        Buffer.from(data, 'base64'),
      );
      fs.appendFileSync(
        path.join(outDir, 'frames.log'),
        `${JSON.stringify({ i: frameIndex, ts: metadata.timestamp, file: path.join(framesDir, `f${String(frameIndex).padStart(6, '0')}.jpg`) })}\n`,
      );
      frameIndex += 1;
      frameTotal += 1;
      await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
    } catch {
      /* frame perdue : sans effet sur le montage (la frame précédente est tenue) */
    }
  });
  const startScreencast = async () => {
    await cdp
      .send('Page.startScreencast', {
        format: 'jpeg',
        quality: JPEG_QUALITY,
        maxWidth: Math.min(SCREENCAST_MAX, viewport.width * viewport.deviceScaleFactor),
        maxHeight: Math.min(SCREENCAST_MAX, viewport.height * viewport.deviceScaleFactor),
        everyNthFrame: 1,
      })
      .catch(() => {});
    screencasting = true;
  };
  const stopScreencast = async () => {
    await cdp.send('Page.stopScreencast').catch(() => {});
    screencasting = false;
  };

  // ---------- Images suréchantillonnées (voir « densité » plus haut) ----------
  // Le flux CDP est plafonné à la résolution CSS : la densité d'écran n'y change
  // rien (mesuré par probe-hq.mjs — 3840×2160 demandés, 1920×1080 reçus, quelle que
  // soit la configuration de lancement). Une capture d'image délibérée, elle, rend
  // bien à la densité demandée (probe-shot.mjs : 3840×2160 en ~98 ms en desktop,
  // 1170×2532 en ~58 ms en mobile). On échantillonne donc les deux en parallèle :
  // le flux donne le mouvement (30 im/s), les images nettes donnent la netteté des
  // écrans tenus — c'est-à-dire l'essentiel de la durée d'une visite guidée.
  const hiDir = path.join(outDir, 'hi');
  let hiIndex = 0;
  let hiBusy = false;
  let hiTimer = null;
  const takeHiRes = async () => {
    if (!HIRES_EVERY_MS || hiBusy || captureT0 === null) return;
    hiBusy = true;
    try {
      const t = Date.now() / 1000 - (clockOffset ?? 0);
      const buf = Buffer.from(await page.screenshot({ type: 'jpeg', quality: JPEG_QUALITY }));
      const name = `h${String(hiIndex).padStart(6, '0')}.jpg`;
      fs.writeFileSync(path.join(hiDir, name), buf);
      fs.appendFileSync(
        path.join(outDir, 'hi.log'),
        `${JSON.stringify({ i: hiIndex, ts: t, file: path.join(hiDir, name) })}\n`,
      );
      hiIndex += 1;
    } catch {
      /* image nette perdue : le flux reste la référence de l'écran */
    } finally {
      hiBusy = false;
    }
  };
  const startHiRes = (fresh = true) => {
    if (!HIRES_EVERY_MS) return;
    fs.mkdirSync(hiDir, { recursive: true });
    if (fresh) fs.rmSync(path.join(outDir, 'hi.log'), { force: true });
    hiTimer = setInterval(takeHiRes, HIRES_EVERY_MS);
  };
  const stopHiRes = () => {
    if (hiTimer) clearInterval(hiTimer);
    hiTimer = null;
  };

  // ---------- Utilitaires de défilement ----------
  const scrollBy = (dy) =>
    page.evaluate((dy) => {
      const scrollers = [...document.querySelectorAll('*')].filter(
        (e) => e.scrollHeight > e.clientHeight + 40,
      );
      const el = scrollers[scrollers.length - 1];
      if (el) el.scrollBy({ top: dy, behavior: 'smooth' });
      else window.scrollBy({ top: dy, behavior: 'smooth' });
    }, dy);
  const scrollTop = () =>
    page.evaluate(() => {
      const scrollers = [...document.querySelectorAll('*')].filter(
        (e) => e.scrollHeight > e.clientHeight + 40,
      );
      const el = scrollers[scrollers.length - 1];
      if (el) el.scrollTo({ top: 0 });
      window.scrollTo({ top: 0 });
    });

  /** Relance le flux de capture et, si l'application est figée, recharge la session. */
  const recover = async (stepId) => {
    const idleFor = Date.now() - lastFrameAt;
    if (idleFor < (cfg.freezeMs ?? 20000)) return;
    diagnostics.notes.push(
      `flux de capture interrompu ${(idleFor / 1000).toFixed(0)}s à l'étape ${stepId} : relance du screencast`,
    );
    console.log(`[freeze] étape ${stepId} — ${(idleFor / 1000).toFixed(0)}s sans frame, relance du screencast`);
    await stopScreencast();
    await sleep(400);
    await startScreencast();
    await sleep(1500);
    const stillIdle = Date.now() - lastFrameAt;
    if (cfg.recoverOnFreeze !== false && stillIdle > 4000) {
      diagnostics.notes.push(`rechargement de la session après blocage à l'étape ${stepId} (état du shell restauré)`);
      console.log(`[freeze] étape ${stepId} — rechargement de la session`);
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 }).catch(() => {});
      await page
        .waitForFunction(() => document.body && document.body.innerText.length > 60, { timeout: 120000, polling: 1000 })
        .catch(() => {});
      await sleep(5000);
      await dismissOverlays(page);
    }
  };

  await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => document.body && document.body.innerText.length > 40, {
    timeout: 240000,
    polling: 1000,
  });
  await sleep(cfg.settleMs ?? 4000);

  captureT0 = null;
  steps.push({ id: 'start', label: 'Début de la capture', t0: 0, t1: null });

  // ---------- Connexion (avant capture si les identifiants doivent rester hors vidéo) ----------
  if (cfg.loginViewport) {
    await login(page, {
      email: cfg.email,
      password: cfg.password,
      pole: cfg.pole,
      poleCta: cfg.poleCta,
      shellReadyPattern: cfg.shellReadyPattern,
      postLoginSettleMs: cfg.postLoginSettleMs ?? 6000,
    });
    await dismissOverlays(page);
    // Redimensionner une session déjà montée laisse la zone de contenu vide sur
    // certains pôles : on change de viewport puis on recharge pour un montage propre
    // à la taille filmée (la session, elle, persiste dans le navigateur).
    await page.setViewport(viewport);
    await sleep(1500);
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
    await page
      .waitForFunction(() => document.body && document.body.innerText.length > 60, { timeout: 180000, polling: 1000 })
      .catch(() => {});
    await sleep(6000);
    await dismissOverlays(page);
  }

  await startScreencast();
  startHiRes();
  captureT0 = Date.now();

  if (!cfg.loginViewport) {
    markStep('login', `Connexion au pôle ${cfg.pole}`);
    await login(page, {
      email: cfg.email,
      password: cfg.password,
      pole: cfg.pole,
      poleCta: cfg.poleCta,
      shellReadyPattern: cfg.shellReadyPattern,
      postLoginSettleMs: cfg.postLoginSettleMs ?? 6000,
    });
    await dismissOverlays(page);
  } else {
    markStep('login', `Connexion au pôle ${cfg.pole} (session de démonstration déjà ouverte, mot de passe masqué)`);
    await sleep(3000);
  }

  // ---------- Scénario ----------
  for (const step of cfg.steps) {
    try {
    await markStep(step.id, step.label);
    let acted = false;
    const hasClick = (step.actions ?? []).some((a) => ['text', 'aria', 'data-testid', 'coords'].includes(a.type));
    const before = (await bodyText(page)).slice(0, 400);
    // `retry` : certaines cibles (barre latérale, cartes du hub) ne répondent
    // qu'après la fin d'une transition ; on retente avant de conclure à l'échec.
    const clickOnce = async (action) => {
      const target =
        action.type === 'text'
          ? { kind: 'text', value: action.text }
          : action.type === 'aria'
            ? { kind: 'aria', value: action.label }
            : { kind: 'testid', value: action.value };
      for (let i = 0; i < (action.retry ?? 1); i += 1) {
        const hit = await clickReal(page, target);
        if (hit.ok) return true;
        await sleep(1500);
      }
      return false;
    };
    const actionName = (a) => a.text ?? a.label ?? a.value ?? a.type;
    // Mémoire de la **dernière** cible pressée et de l'écran d'avant : c'est elle qui
    // dit si l'appui a servi à quelque chose (voir le contrôle après la boucle).
    let lastClick = null;
    for (const action of step.actions ?? []) {
      try {
        if (['text', 'aria', 'data-testid'].includes(action.type)) {
          const pre = (await bodyText(page)).slice(0, 400);
          if (await clickOnce(action)) acted = true;
          lastClick = { action, pre };
        }
        else if (action.type === 'scroll') await scrollBy(action.dy ?? 500);
        else if (action.type === 'scrollToTop') await scrollTop();
        else if (action.type === 'key') await page.keyboard.press(action.key);
        else if (action.type === 'dismiss') await dismissOverlays(page);
        else if (action.type === 'wait') {
          /* pause pure */
        } else if (action.type === 'viewport') {
          // Bascule portrait ↔ paysage : le screencast doit être relancé après
          // le changement d'émulation, sinon Chrome cesse d'émettre des frames.
          // On garde une image nette du format qu'on quitte, puis on suspend
          // l'échantillonnage : une image prise pendant la bascule appartiendrait
          // au format d'après et serait attribuée au mauvais écran au montage.
          await takeHiRes();
          stopHiRes();
          await stopScreencast();
          await page.setViewport({
            width: action.width,
            height: action.height,
            deviceScaleFactor: viewport.deviceScaleFactor,
            isMobile: viewport.isMobile,
            hasTouch: viewport.hasTouch,
          });
          await sleep(2500);
          await startScreencast();
          await sleep(800);
          startHiRes(false);
        }
      } catch (e) {
        console.log(`[warn] action échouée (${step.id}): ${String(e).slice(0, 120)}`);
      }
      const wait = action.pauseAfter ?? (action.type === 'viewport' ? 500 : 700);
      if (wait) await sleep(wait);
    }
    // L'app Metro met 3-6 s à rendre l'écran suivant : on attend le changement
    // avant de lancer la narration, sinon le chapitre montre l'écran précédent.
    let changed = acted ? await waitForChange(page, before, step.changeTimeoutMs ?? 12000) : false;
    // Contrôle **de la dernière pression**, et non de l'étape : ouvrir le hub change
    // déjà l'écran, ce qui masquait l'échec du clic sur la tuile qui suit (constaté sur
    // les cartes du hub « Tout ProDay »). Si l'écran n'a pas bougé depuis l'appui,
    // c'est que la pression est tombée pendant une transition : on la refait, en
    // s'accordant un temps de pose entre chaque tentative.
    // On ne refait **pas** une pression sur un contrôle de bascule (onglet Menu, dock) :
    // reforger un appui qui vient d'ouvrir une vue la refermerait. Le contrôle porte sur
    // les cibles de contenu (tuile de hub, entrée de liste), où un appui perdu se voit.
    if (lastClick && lastClick.action.type !== 'aria' && (step.retryLast ?? 3) > 0) {
      for (let attempt = 1; attempt <= (step.retryLast ?? 3); attempt += 1) {
        const now = (await bodyText(page)).slice(0, 400);
        if (now !== lastClick.pre) break;
        console.log(
          `[retry] étape ${step.id} — « ${actionName(lastClick.action)} » sans effet, tentative ${attempt}`,
        );
        diagnostics.notes.push(
          `étape ${step.id} : pression sur « ${actionName(lastClick.action)} » sans effet — tentative ${attempt}`,
        );
        await sleep(2000);
        if (await clickOnce(lastClick.action)) acted = true;
        await sleep(2000);
      }
      changed = acted ? await waitForChange(page, before, step.changeTimeoutMs ?? 12000) : false;
    }
    // Détection de blocage : des clics qui n'ont plus aucun effet = l'application
    // s'est figée. On recharge alors la session (connectée) et on reprend le tour.
    if (hasClick && acted && !changed) {
      unchangedStreak += 1;
      // 1re tentative : certaines pages s'ouvrent en plein écran et neutralisent la
      // barre latérale ; on ressort par leur propre commande « Retour » puis on reprend.
      // On ne « ressort » que si l'écran est réellement pris en main : quand la barre
      // latérale reste cliquable, le module est simplement en cours de rendu et un
      // clic sur « Retour » annulerait la navigation que l'étape vient d'ouvrir.
      let shellAvailable = false;
      try {
        shellAvailable = (await findTargets(page, { kind: 'aria', value: 'Menu' })).length > 0;
      } catch {
        shellAvailable = false;
      }
      if (unchangedStreak === 1 && !shellAvailable && !/retour|accueil/i.test(step.id)) {
        const back = await clickReal(page, { kind: 'text', value: 'Retour' });
        if (!back.ok) await clickReal(page, { kind: 'aria', value: 'Retour' });
        if (back.ok) {
          console.log(`[freeze] étape ${step.id} — sortie par « Retour »`);
          diagnostics.notes.push(`étape ${step.id} : sortie par « Retour » après un clic sans effet`);
          await sleep(3000);
        }
      }
      if (unchangedStreak >= 2 && cfg.recoverOnFreeze !== false) {
        diagnostics.notes.push(
          `blocage détecté à l'étape ${step.id} : deux interactions sans effet → rechargement de la session`,
        );
        console.log(`[freeze] étape ${step.id} — clics sans effet, rechargement de la session`);
        await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 }).catch(() => {});
        await page
          .waitForFunction(() => document.body && document.body.innerText.length > 60, { timeout: 120000, polling: 1000 })
          .catch(() => {});
        await sleep(5000);
        await dismissOverlays(page);
        unchangedStreak = 0;
      }
    } else if (changed) {
      unchangedStreak = 0;
    }
    await recover(step.id);
    await sleep(step.holdMs ?? 6000);
    // Une image nette de l'écran **tenu**, prise pendant l'immobilité : c'est elle
    // qui sera gardée à l'image au montage, à la place du cliché du flux.
    await takeHiRes();
    try {
      currentStepObserved = await screenSignature(page);
    } catch {
      /* frame détachée : on garde la signature précédente */
    }
    // Manifeste écrit à chaque étape : un incident en fin de parcours ne fait
    // plus perdre l'ensemble de la capture (les vidéos restent exploitables).
    flushManifest();
    if (hasClick && !acted) {
      console.log(`[warn] aucune cible cliquée pour l'étape ${step.id}`);
      diagnostics.failedSteps.push({
        step: step.id,
        label: step.label,
        actions: step.actions,
        candidates: await dumpCandidates(page, 40),
        bodyText: (await bodyText(page)).slice(0, 400),
      });
    }
    } catch (e) {
      // Un incident isolé (frame détachée après un rechargement, action en échec)
      // ne doit pas interrompre un parcours de plusieurs minutes : on le consigne
      // et on poursuit avec l'étape suivante.
      console.log(`[warn] étape ${step.id} interrompue : ${String(e).slice(0, 160)}`);
      diagnostics.notes.push(
        `étape ${step.id} : incident interne (${String(e).slice(0, 120)}) — capture poursuivie`,
      );
      flushManifest();
    }
  }

  await markStep('end', 'Fin de la visite');
  await sleep(2500);

  if (screencasting) await stopScreencast();
  stopHiRes();
  await takeHiRes();
  finished = true;
  flushManifest();
  console.log(`DONE — ${frameTotal} frames, ${steps.length} étapes → ${outDir}`);
  if (diagnostics.failedSteps.length) {
    console.log(`[warn] ${diagnostics.failedSteps.length} étape(s) sans cible : ${diagnostics.failedSteps.map((f) => f.step).join(', ')}`);
  }
} finally {
  await browser.close();
}
