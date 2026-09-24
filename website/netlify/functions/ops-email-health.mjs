/**
 * Scheduler Netlify — vérification e-mail quotidienne (09:00 UTC).
 *
 * Exécute le MÊME contrôle que l'action manuelle de la page Statut Ops :
 * config EmailJS → envoi réel sur OPS_STATUS_TEST_EMAIL → historisation
 * (Netlify Blobs en prod, .data/ en local). Le résultat alimente l'encadré
 * « Historique » de /admin/ops/status, y compris le rappel de reconnexion
 * Gmail lorsque l'envoi échoue pour cette raison.
 *
 * Déclaré dans netlify.toml ([functions] "ops-email-health" cron = daily 09:00 UTC).
 * Module autonome : ne pas importer l'alias `@/` (non résolu hors bundler Next) —
 * la logique store est réimplémentée ici à l'identique (mêmes chemins/formats).
 */

const BLOBS_STORE = "ops-status";
const BLOBS_KEY_HISTORY = "email-health-history";
const BLOBS_KEY_ALERT_STATE = "email-health-alert-state";
const HISTORY_LIMIT = 60;
const ALERT_THRESHOLD = 2;
const ALERT_REMIND_MS = 7 * 24 * 60 * 60 * 1000;
const LOCAL_HISTORY_PATH = ".data/ops-status-email-history.json";

const EMAILJS_FIELDS = [
  "EMAILJS_SERVICE_ID",
  "EMAILJS_TEMPLATE_ID",
  "EMAILJS_PUBLIC_KEY",
  "EMAILJS_PRIVATE_KEY",
];

/** Astuces opérationnelles — mêmes règles que describeBetaEmailJsFailure (repo). */
function describeEmailJsFailure(rawInput) {
  const raw =
    typeof rawInput === "string"
      ? rawInput
      : rawInput && typeof rawInput === "object" && "text" in rawInput
        ? String(rawInput.text)
        : "Envoi impossible";

  if (/invalid grant|gmail_api/i.test(String(raw))) {
    return {
      log: String(raw),
      hint: "Reconnectez le compte Gmail dans EmailJS (Email Services → Reconnect).",
    };
  }
  if (/412/.test(String(raw))) {
    return {
      log: String(raw),
      hint: "Vérifiez le service email connecté dans le dashboard EmailJS.",
    };
  }
  if (/403|401|unauthorized|forbidden/i.test(String(raw))) {
    return {
      log: String(raw),
      hint:
        "Clés EmailJS invalides ou API non navigateur désactivée (Account → Security).",
    };
  }
  return { log: String(raw) };
}

async function getBlobsStore() {
  if (!process.env.NETLIFY) return null;
  try {
    const { getStore } = await import("@netlify/blobs");
    return getStore({ name: BLOBS_STORE });
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// État d'alerte — même logique que adminOpsStore.ts (updateAlertState)
// ---------------------------------------------------------------------------

async function readAlertState(store) {
  const fallback = { streak: 0, lastAlertAt: null, lastAlertStreak: null };
  if (store) {
    try {
      const raw = await store.get(BLOBS_KEY_ALERT_STATE, { type: "json" });
      return raw && typeof raw.streak === "number" ? raw : fallback;
    } catch {
      return fallback;
    }
  }
  try {
    const { readFile } = await import("node:fs/promises");
    const raw = JSON.parse(await readFile(".data/ops-status-email-alert-state.json", "utf8"));
    return raw && typeof raw.streak === "number" ? raw : fallback;
  } catch {
    return fallback;
  }
}

async function writeAlertState(store, state) {
  if (store) {
    try {
      await store.setJSON(BLOBS_KEY_ALERT_STATE, state);
      return;
    } catch {
      // Repli fichier.
    }
  }
  try {
    const { mkdir, writeFile } = await import("node:fs/promises");
    await mkdir(".data", { recursive: true });
    await writeFile(".data/ops-status-email-alert-state.json", JSON.stringify(state, null, 2), "utf8");
  } catch {
    // L'alerte reste émise même si la persistance échoue.
  }
}

async function postAlertWebhook(url, title, body) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: `${title}\n${body}` }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: text || `Webhook HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Webhook indisponible" };
  }
}

/** Escalade : alerte au 2e échec consécutif, re-rappel hebdo, rétablissement. */
async function updateAlertState(store, result) {
  const state = await readAlertState(store);
  const webhook = process.env.OPS_ALERT_WEBHOOK_URL?.trim();

  if (result.ok) {
    const hadFailureStreak = state.streak > 0;
    const next = { streak: 0, lastAlertAt: state.lastAlertAt, lastAlertStreak: state.lastAlertStreak };
    await writeAlertState(store, next);
    if (hadFailureStreak && state.lastAlertAt && webhook) {
      const sent = await postAlertWebhook(
        webhook,
        "✅ ProDay — pipeline e-mail rétabli",
        `Le pipeline e-mail est de nouveau opérationnel après ${state.streak} échec(s) consécutif(s) du scheduler quotidien.`,
      );
      return { ...next, alertAction: sent.ok ? "recovery" : "none" };
    }
    return { ...next, alertAction: "none" };
  }

  const streak = state.streak + 1;
  const shouldAlertFirst =
    streak >= ALERT_THRESHOLD &&
    (!state.lastAlertAt || state.lastAlertStreak === null || state.lastAlertStreak < ALERT_THRESHOLD);
  const lastAlertAge = state.lastAlertAt ? Date.now() - new Date(state.lastAlertAt).getTime() : Infinity;
  const shouldRemind = streak > ALERT_THRESHOLD && state.lastAlertAt !== null && lastAlertAge >= ALERT_REMIND_MS;

  if (!webhook || (!shouldAlertFirst && !shouldRemind)) {
    const next = { ...state, streak };
    await writeAlertState(store, next);
    return { ...next, alertAction: "none" };
  }

  const problem = result.log ?? "Envoi de test impossible";
  const title =
    streak === ALERT_THRESHOLD
      ? "🚨 ProDay — pipeline e-mail en échec"
      : "⏰ ProDay — rappel : pipeline e-mail toujours en échec";
  const lines = [
    `Le scheduler quotidien ProDay enregistre **${streak} échec(s) consécutif(s)** de la vérification e-mail.`,
    `Dernier problème : ${problem}`,
    result.hint ? `Action : ${result.hint}` : null,
    `Voir https://proday75.fr/admin/ops/status → Historique des vérifications e-mail.`,
  ].filter(Boolean);
  const sent = await postAlertWebhook(webhook, title, lines.join("\n"));
  const next = {
    streak,
    lastAlertAt: sent.ok ? new Date().toISOString() : state.lastAlertAt,
    lastAlertStreak: sent.ok ? streak : state.lastAlertStreak,
  };
  await writeAlertState(store, next);
  return { ...next, alertAction: shouldRemind ? "reminder" : "sent" };
}

async function readHistoryFromBlobs(store) {
  try {
    const raw = await store.get(BLOBS_KEY_HISTORY, { type: "json" });
    const entries = Array.isArray(raw?.entries) ? raw.entries : [];
    return { entries, error: null };
  } catch (error) {
    // Clé absente (premier run) : historique vide, pas une erreur.
    return { entries: [], error: error?.message ?? "Lecture impossible" };
  }
}

async function readHistoryFromFile() {
  try {
    const { readFile } = await import("node:fs/promises");
    const raw = JSON.parse(await readFile(LOCAL_HISTORY_PATH, "utf8"));
    return { entries: Array.isArray(raw?.entries) ? raw.entries : [], error: null };
  } catch {
    return { entries: [], error: null };
  }
}

async function persistHistory(entries) {
  const store = await getBlobsStore();
  if (store) {
    await store.setJSON(BLOBS_KEY_HISTORY, { entries });
    return { backend: "blobs", error: null };
  }
  try {
    const { mkdir, writeFile } = await import("node:fs/promises");
    await mkdir(".data", { recursive: true });
    await writeFile(LOCAL_HISTORY_PATH, JSON.stringify({ entries }, null, 2), "utf8");
    return { backend: "file", error: null };
  } catch (error) {
    return { backend: null, error: error?.message ?? "Écriture impossible" };
  }
}

async function sendViaEmailJs(config, params) {
  // Même API + payload que sendBetaWelcomeEmailViaEmailJsFetch (repo) :
  // fetch direct — aucune dépendance npm à bundler dans la fonction.
  const templateParams = {
    email: params.email,
    to_email: params.email,
    user_email: params.email,
    member_role: "Beta testeur ProDay",
    profile_label: "Test Ops",
    role_label: "Beta testeur ProDay",
    site_url: (process.env.NEXT_PUBLIC_SITE_URL || "https://proday75.fr").replace(/\/$/, ""),
    beta_url: (process.env.NEXT_PUBLIC_SITE_URL || "https://proday75.fr").replace(/\/$/, "") + "/beta/programme",
    installer_url: (process.env.NEXT_PUBLIC_SITE_URL || "https://proday75.fr").replace(/\/$/, "") + "/beta/installer",
    subject: "Vous êtes beta testeur ProDay",
  };

  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: config.serviceId,
      template_id: config.templateId,
      user_id: config.publicKey,
      accessToken: config.privateKey,
      template_params: templateParams,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `EmailJS HTTP ${res.status}`);
  }
}

async function runCheck() {
  const missing = EMAILJS_FIELDS.filter((k) => !process.env[k]?.trim());
  if (missing.length) {
    return {
      ok: false,
      log: `Config EmailJS incomplète (${missing.join(", ")})`,
      hint: "Définissez les variables EMAILJS_* sur Netlify (Site configuration → Environment variables).",
    };
  }

  const recipient = process.env.OPS_STATUS_TEST_EMAIL?.trim();
  if (!recipient) {
    return {
      ok: false,
      log: "OPS_STATUS_TEST_EMAIL non défini",
      hint: "Définissez OPS_STATUS_TEST_EMAIL (destinataire de l'envoi de test).",
    };
  }

  try {
    await sendViaEmailJs(
      {
        serviceId: process.env.EMAILJS_SERVICE_ID.trim(),
        templateId: process.env.EMAILJS_TEMPLATE_ID.trim(),
        publicKey: process.env.EMAILJS_PUBLIC_KEY.trim(),
        privateKey: process.env.EMAILJS_PRIVATE_KEY.trim(),
      },
      { email: recipient },
    );
    return { ok: true };
  } catch (error) {
    const { log, hint } = describeEmailJsFailure(
      error instanceof Error ? error.message : error,
    );
    return { ok: false, log, hint };
  }
}

const handler = async () => {
  const result = await runCheck();
  const at = new Date().toISOString();
  const entry = { at, ...result, source: "scheduled" };

  const store = await getBlobsStore();
  let persist;
  if (store) {
    const { entries } = await readHistoryFromBlobs(store);
    persist = await persistHistory([entry, ...entries].slice(0, HISTORY_LIMIT));
  } else {
    const { entries } = await readHistoryFromFile();
    persist = await persistHistory([entry, ...entries].slice(0, HISTORY_LIMIT));
  }

  // Escalade : alerte webhook au 2e échec consécutif (re-rappel hebdo,
  // rétablissement automatique) — même logique que adminOpsStore.ts.
  const alert = await updateAlertState(store, result);

  const summary = result.ok
    ? "Email de test quotidien reçu — pipeline opérationnel."
    : `Échec : ${result.log ?? "envoi impossible"}${result.hint ? ` → ${result.hint}` : ""}`;
  console.log(
    `[ops-email-health] ${summary} (backend: ${persist.backend ?? "aucun"}, alert: ${alert.alertAction})`,
  );

  return new Response(
    JSON.stringify({
      ok: result.ok,
      at,
      historyBackend: persist.backend,
      alertStreak: alert.streak,
      alertAction: alert.alertAction,
      error: persist.error,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
};

export default handler;

export const config = {
  schedule: "0 9 * * *",
  name: "ops-email-health",
};
