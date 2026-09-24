/**
 * lib.mjs — primitives d'interaction ProDay pour l'automatisation CDP (Puppeteer).
 *
 * Leçon des essais précédents : un clic aux coordonnées échoue dès qu'une cible est
 * hors du viewport (grille Menu mobile) et ne survit pas à un changement de frame.
 * On clique donc l'élément lui-même, après `scrollIntoView`, en émettant les
 * événements souris sur le nœud — c'est ce qui fonctionne avec React Native Web.
 */
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Attend que l'écran se calme (plus aucune modification du DOM pendant `quietMs`).
 * Un appui envoyé pendant une transition — ouverture de menu, liste qui se remplit —
 * est le plus souvent perdu : React Native Web monte les zones interactives après
 * l'animation. On laisse donc la page se poser avant de mesurer une cible.
 */
export async function waitForQuiet(page, { quietMs = 350, timeoutMs = 3000 } = {}) {
  try {
    return await page.evaluate(
      ({ quietMs, timeoutMs }) =>
        new Promise((resolve) => {
          let last = Date.now();
          const obs = new MutationObserver(() => {
            last = Date.now();
          });
          try {
            obs.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true });
          } catch {
            resolve(false);
            return;
          }
          const t0 = Date.now();
          const tick = () => {
            if (Date.now() - last >= quietMs || Date.now() - t0 > timeoutMs) {
              obs.disconnect();
              resolve(true);
              return;
            }
            setTimeout(tick, 120);
          };
          setTimeout(tick, quietMs);
        }),
      { quietMs, timeoutMs },
    );
  } catch {
    return false;
  }
}

export function normalize(s) {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2019']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Énumère les cibles candidates (texte / aria / testid) réellement cliquables,
 * avec leurs coordonnées écran. Le hit-test élimine les doublons hors écran ou
 * masqués (barre latérale desktop laissée montée sur mobile).
 */
export async function findTargets(page, target) {
  return page.evaluate((t) => {
    const norm = (s) =>
      String(s ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[\u2019']/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
    const nodes = [...document.querySelectorAll('div,span,text,p,button,a,li')];
    let matches = [];
    if (t.kind === 'text') {
      const needle = norm(t.value);
      matches = nodes.filter((e) => norm(e.textContent) === needle);
      if (!matches.length) {
        matches = nodes.filter(
          (e) => e.children.length === 0 && norm(e.textContent).includes(needle),
        );
      }
    } else if (t.kind === 'aria') {
      const needle = norm(t.value);
      matches = [...document.querySelectorAll('[aria-label],[role="button"],[role="tab"]')].filter(
        (e) => norm(e.getAttribute('aria-label')) === needle,
      );
    } else {
      matches = [...document.querySelectorAll(`[data-testid="${t.value}"]`)];
    }
    const intoView = (e) => {
      let n = e.parentElement;
      while (n && n !== document.body) {
        const cs = getComputedStyle(n);
        if (/(auto|scroll)/.test(cs.overflowY) && n.scrollHeight > n.clientHeight + 4) {
          const er = e.getBoundingClientRect();
          const nr = n.getBoundingClientRect();
          if (er.top < nr.top + 8 || er.bottom > nr.bottom - 8) {
            n.scrollTop += er.top - nr.top - nr.height / 2 + er.height / 2;
          }
        }
        n = n.parentElement;
      }
      e.scrollIntoView({ block: 'center', inline: 'nearest' });
    };
    const out = [];
    for (const e of matches) {
      intoView(e);
      const r = e.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const x = r.x + r.width / 2;
      const y = r.y + r.height / 2;
      if (x < 1 || y < 1 || x > window.innerWidth - 1 || y > window.innerHeight - 1) continue;
      const node = document.elementFromPoint(x, y);
      if (node !== e && !e.contains(node)) continue;
      out.push({ text: String(e.textContent || '').trim().slice(0, 50), x, y, depth: e.contains(node) ? 1 : 0 });
    }
    // Le plus profond d'abord : c'est la cible qui reçoit le clic.
    return out.sort((a, b) => b.depth - a.depth).slice(0, 6);
  }, target);
}

/**
 * Clic réel (CDP) sur la meilleure cible trouvée. On préfère le clic souris natif :
 * React Native Web réagit aux événements du navigateur, pas aux seuls appels DOM.
 */
export async function clickReal(page, target) {
  // Après un scrollIntoView, la mise en page bouge encore : on laisse retomber
  // puis on re-mesure, sinon le clic atterrit sur la ligne voisine.
  await waitForQuiet(page);
  await findTargets(page, target);
  await sleep(450);
  const candidates = await findTargets(page, target);
  if (!candidates.length) return { ok: false, reason: 'aucune cible cliquable' };
  for (const c of candidates) {
    await page.mouse.move(c.x, c.y);
    await page.mouse.down();
    await sleep(70);
    await page.mouse.up();
    await sleep(400);
    return { ok: true, x: c.x, y: c.y, text: c.text };
  }
  return { ok: false, reason: 'clic impossible' };
}

/**
 * Attend que le contenu de l'écran change (l'app Metro dev répond en 3-6 s).
 * Renvoie true dès que le texte observé diffère de la signature précédente.
 */
export async function waitForChange(page, previous, timeoutMs = 9000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const now = (await bodyText(page)).slice(0, 400);
    if (now !== previous) return true;
    await sleep(500);
  }
  return false;
}

/**
 * Titre réel de l'écran courant : le plus gros texte de la moitié haute de l'écran.
 * Sert de libellé honnête dans la checklist de couverture (« écran atteint »).
 */
export async function screenTitle(page) {
  // Un rechargement peut détacher la frame juste avant l'évaluation : on ne
  // laisse pas cet incident interrompre une capture de plusieurs minutes.
  try {
    return await evaluateTitle(page);
  } catch {
    return '';
  }
}

function evaluateTitle(page) {
  return page.evaluate(() => {
    const parts = [...document.querySelectorAll('div,span,text')]
      .filter((e) => {
        const t = (e.textContent || '').trim();
        return e.children.length === 0 && t.length > 2 && t.length < 60;
      })
      .map((e) => ({
        t: e.textContent.trim(),
        r: e.getBoundingClientRect(),
        fs: parseFloat(getComputedStyle(e).fontSize) || 0,
      }))
      .filter((x) => {
        if (!(x.r.width > 0 && x.r.height > 0)) return false;
        if (x.fs < 16.5) return false;
        // On ignore la barre latérale (desktop) et la barre d'état pour ne garder
        // que le titre de la zone de contenu.
        const minX = window.innerWidth > 800 ? 280 : 0;
        return x.r.x >= minX && x.r.y >= 80 && x.r.y < window.innerHeight * 0.6;
      })
      .sort((a, b) => b.fs - a.fs || a.r.y - b.r.y);
    return parts.length ? parts[0].t : '';
  });
}

/** Signature courte de l'écran courant : titre + amorce de contenu. */
export async function screenSignature(page) {
  const title = await screenTitle(page);
  let t = '';
  try {
    t = await bodyText(page);
  } catch {
    /* frame détachée pendant l'évaluation : la signature reste partielle */
  }
  return `${title || '?'} — ${t.slice(0, 90)}`.slice(0, 150);
}

/** Clique un élément trouvé par texte / aria-label / data-testid, en le ramenant à l'écran. */
export async function clickTarget(page, target) {
  return page.evaluate((t) => {
    const norm = (s) =>
      String(s ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[\u2019']/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

    const nodes = [...document.querySelectorAll('div,span,text,p,button,a,li')];
    let matches = [];
    if (t.kind === 'text') {
      const needle = norm(t.value);
      const exact = nodes.filter((e) => e.children.length === 0 && norm(e.textContent) === needle);
      matches = exact.length
        ? exact
        : nodes.filter(
            (e) =>
              e.children.length === 0 &&
              norm(e.textContent).length > 0 &&
              norm(e.textContent).includes(needle),
          );
    } else if (t.kind === 'aria') {
      const needle = norm(t.value);
      matches = [...document.querySelectorAll('[aria-label],[role="button"],[role="tab"]')].filter(
        (e) => norm(e.getAttribute('aria-label')) === needle || norm(e.textContent) === needle,
      );
    } else if (t.kind === 'testid') {
      matches = [...document.querySelectorAll(`[data-testid="${t.value}"]`)];
    }
    if (!matches.length) return { ok: false, reason: 'introuvable' };

    // Pièges du shell (constatés à l'expérience) :
    //  1. la barre latérale desktop reste montée sur mobile en `pointer-events: none` ;
    //  2. les listes longues vivent dans un ScrollView interne qui rogne les cibles.
    // On descend donc les ancêtres pour amener la cible dans une zone visible, et on
    // n'accepte que si le hit-test retombe sur la cible elle-même.
    const hit = (e) => {
      const r = e.getBoundingClientRect();
      if (r.width === 0 || r.height === 0 || e.offsetParent === null) return null;
      const x = r.x + r.width / 2;
      const y = r.y + r.height / 2;
      if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) return null;
      const node = document.elementFromPoint(x, y);
      if (node !== e && !e.contains(node)) return null;
      return { x, y };
    };
    const intoView = (e) => {
      let n = e.parentElement;
      while (n && n !== document.body) {
        const cs = getComputedStyle(n);
        if (/(auto|scroll)/.test(cs.overflowY) && n.scrollHeight > n.clientHeight + 4) {
          const er = e.getBoundingClientRect();
          const nr = n.getBoundingClientRect();
          if (er.top < nr.top + 8 || er.bottom > nr.bottom - 8) {
            n.scrollTop += er.top - nr.top - nr.height / 2 + er.height / 2;
          }
        }
        n = n.parentElement;
      }
      e.scrollIntoView({ block: 'center', inline: 'nearest' });
    };
    let el = null;
    let point = null;
    for (const candidate of matches) {
      intoView(candidate);
      const p = hit(candidate);
      if (p) {
        el = candidate;
        point = p;
        break;
      }
    }
    if (!el) return { ok: false, reason: 'non cliquable (masqué, couvert ou hors écran)' };
    const { x, y } = point;
    const opts = { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, view: window };
    for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']) {
      const Ctor = type.startsWith('pointer') ? PointerEvent : MouseEvent;
      try {
        el.dispatchEvent(new Ctor(type, { ...opts, pointerId: 1, pointerType: 'mouse' }));
      } catch {
        el.dispatchEvent(new MouseEvent(type.replace('pointer', 'mouse'), opts));
      }
    }
    return { ok: true, text: (el.textContent || '').trim().slice(0, 60), x, y };
  }, target);
}

export const clickText = (page, value) => clickTarget(page, { kind: 'text', value });
export const clickAria = (page, value) => clickTarget(page, { kind: 'aria', value });
export const clickTestId = (page, value) => clickTarget(page, { kind: 'testid', value });

export async function bodyText(page) {
  return page.evaluate(() => document.body.innerText.replace(/\n+/g, ' | '));
}

export async function waitForText(page, pattern, timeoutMs = 45000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const t = await bodyText(page);
    if (new RegExp(pattern, 'i').test(t)) return true;
    await sleep(500);
  }
  return false;
}

/** Inventaire des cibles visibles — sert de diagnostic quand un clic échoue. */
export async function dumpCandidates(page, limit = 60) {
  return page.evaluate((limit) => {
    const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
    const out = [];
    for (const e of document.querySelectorAll('div,span,text,p,button,a,li')) {
      const label = norm(e.getAttribute?.('aria-label'));
      const txt = e.children.length === 0 ? norm(e.textContent) : '';
      if (!label && (!txt || txt.length > 60)) continue;
      const r = e.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      out.push({ t: label || txt, role: e.getAttribute?.('role') || '', y: Math.round(r.y) });
      if (out.length >= limit) break;
    }
    return out;
  }, limit);
}

/** Remplit un input via le setter natif (sinon React ignore la frappe synthétique). */
export async function fillInput(page, index, value) {
  return page.evaluate(
    ({ index, value }) => {
      const input = document.querySelectorAll('input')[index];
      if (!input) return false;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    },
    { index, value },
  );
}

/**
 * Ouvre le formulaire de connexion depuis l'accueil invité, quel que soit le pôle
 * et quel que soit le format (mobile : dots + CTA · desktop : rail « Univers X »).
 * Boucle sur les affordances connues : robuste aux variantes d'ordre.
 */
export async function openLogin(page, { pole, poleCta, log = console.log }) {
  const cta = `Entrer dans ${poleCta ?? pole}`;
  for (let round = 0; round < 5; round += 1) {
    const text = await bodyText(page);
    const hasForm = /Mot de passe|Adresse e-mail|Email/i.test(text) && (await page.$$('input')).length > 0;
    if (hasForm) return true;

    // 1. Lien « Se connecter » (le plus direct quand la modale est ouverte)
    if (/Se connecter/.test(text)) {
      const r = await clickText(page, 'Se connecter');
      log(`[auth] « Se connecter » → ${r.ok}`);
      await sleep(2200);
      continue;
    }
    // 2. CTA explicite « Entrer dans <Pôle> »
    if (await clickText(page, cta).then((r) => r.ok)) {
      log(`[auth] CTA « ${cta} » cliqué`);
      await sleep(2800);
      continue;
    }
    // 3. Dot du carrousel (mobile) : [role="tab"] dont l'aria contient le pôle
    const dot = await page.evaluate((needle) => {
      const n = needle.toLowerCase();
      const idx = [...document.querySelectorAll('[role="tab"]')].findIndex((t) =>
        (t.getAttribute('aria-label') || t.textContent || '').toLowerCase().includes(n),
      );
      if (idx < 0) return false;
      const el = [...document.querySelectorAll('[role="tab"]')][idx];
      el.scrollIntoView({ block: 'center' });
      const r = el.getBoundingClientRect();
      const o = { bubbles: true, cancelable: true, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2, view: window };
      for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']) {
        const Ctor = type.startsWith('pointer') ? PointerEvent : MouseEvent;
        el.dispatchEvent(new Ctor(type, o));
      }
      return true;
    }, pole);
    if (dot) {
      log(`[auth] dot « ${pole} »`);
      await sleep(2000);
      continue;
    }
    // 4. Rail desktop « Univers X »
    if (poleCta) {
      const aria = await clickAria(page, `Univers ${poleCta}`);
      if (aria.ok) log(`[auth] tuile « Univers ${poleCta} »`);
      if (!aria.ok) await clickAria(page, `Univers ${pole}`);
      await sleep(2600);
      continue;
    }
    log('[auth] aucune affordance trouvée, nouvel essai');
    await sleep(1800);
  }
  throw new Error(`Gate de connexion ${pole} introuvable`);
}

/** Connexion complète → attend le shell du pôle. */
export async function login(page, { email, password, pole, poleCta, shellReadyPattern, postLoginSettleMs = 6000, log = console.log }) {
  await openLogin(page, { pole, poleCta, log });
  if (!(await clickText(page, 'Se connecter')).ok) {
    const t = await bodyText(page);
    throw new Error(`Formulaire de connexion absent : ${t.slice(0, 200)}`);
  }
  await sleep(2200);
  if (!(await fillInput(page, 0, email))) throw new Error('Champ email introuvable');
  await sleep(350);
  if (!(await fillInput(page, 1, password))) throw new Error('Champ mot de passe introuvable');
  await sleep(450);
  const values = await page.evaluate(() => [...document.querySelectorAll('input')].map((i) => i.value));
  if (values[0] !== email || values[1] !== password) {
    throw new Error(`Remplissage login incomplet : ${values.map((v) => v.length).join('/')}`);
  }
  const submit = await page.evaluate(() => {
    const el = [...document.querySelectorAll('[role="button"]')].find(
      (b) => (b.getAttribute('aria-label') || '').trim() === 'Se connecter',
    );
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const o = { bubbles: true, cancelable: true, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2, view: window };
    for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']) {
      const Ctor = type.startsWith('pointer') ? PointerEvent : MouseEvent;
      el.dispatchEvent(new Ctor(type, o));
    }
    return true;
  });
  if (!submit) throw new Error('Bouton « Se connecter » introuvable');
  // Le formulaire de connexion disparaît quand l'authentification réussit :
  // c'est le signal fiable, valable pour les 4 pôles et les 2 formats.
  // Le motif de shell sert de contrôle supplémentaire (avertissement seulement).
  const deadline = Date.now() + 90000;
  let formGone = false;
  let patternOk = false;
  while (Date.now() < deadline) {
    const hasPassword = await page.evaluate(() => Boolean(document.querySelector('input[type="password"]')));
    const text = await bodyText(page);
    if (!hasPassword && text.length > 60) {
      formGone = true;
      if (new RegExp(shellReadyPattern, 'i').test(text)) patternOk = true;
      if (patternOk) break;
      await sleep(1000);
      const again = await bodyText(page);
      if (new RegExp(shellReadyPattern, 'i').test(again)) {
        patternOk = true;
        break;
      }
    }
    await sleep(800);
  }
  if (!formGone) {
    const t = await bodyText(page);
    throw new Error(`Connexion ${pole} non confirmée (${t.slice(0, 200)})`);
  }
  if (!patternOk) log(`[auth] connexion ${pole} réussie (motif de shell non reconnu)`);
  await sleep(postLoginSettleMs);
  return true;
}

/** Ferme les modales d'accueil qui masquent le shell (« Question de la semaine », etc.). */
export async function dismissOverlays(page, log = console.log) {
  for (const label of ['Plus tard', 'Fermer', 'Ignorer', 'Passer']) {
    const t = await bodyText(page);
    if (!new RegExp(label, 'i').test(t)) continue;
    const r = await clickText(page, label);
    if (r.ok) {
      log(`[overlay] « ${label} » fermé`);
      await sleep(1200);
    }
  }
}
