import type { OpsHistoryEntry } from "./adminOpsHistoryTypes";

/**
 * Persistance de l'état e-mail ops (historique + dernier test) — un seul
 * module store pour la route admin, la page RSC et le scheduler.
 *
 * Production (Netlify) : Blobs — le FS Lambda est éphémère, seul un store
 * déployé survit entre les instances et les exécutions planifiées.
 * Local/dev : repli fichier `.data/` (gitignored).
 *
 * Le module scheduler Netlify (netlify/functions, JS autonome non bundlé par
 * Next) ne peut pas importer l'alias `@/` : il réutilise la MÊME logique via
 * `loadStoreModule()` (import dynamique du TS transpilé côté Next) ou fournit
 * son propre accès fichier `.data` — mêmes chemins, même format.
 */

export type { OpsHistoryEntry } from "./adminOpsHistoryTypes";

export type OpsHistoryStoreResult = {
  entries: OpsHistoryEntry[];
  /** null = aucun backend dispo (local sans écriture) ; sinon backend utilisé. */
  backend: "blobs" | "file" | null;
  error?: string;
};

export const BLOBS_STORE = "ops-status";
export const BLOBS_KEY_HISTORY = "email-health-history";
export const BLOBS_KEY_LAST_TEST = "email-health-last-test";
export const BLOBS_KEY_ALERT_STATE = "email-health-alert-state";
export const HISTORY_LIMIT = 60;
export const LOCAL_HISTORY_PATH = ".data/ops-status-email-history.json";
export const LOCAL_LAST_TEST_PATH = ".data/ops-status-email-test.json";
export const LOCAL_ALERT_STATE_PATH = ".data/ops-status-email-alert-state.json";

type BlobsStore = {
  get: (key: string, opts?: { type?: string }) => Promise<unknown>;
  setJSON: (key: string, value: unknown) => Promise<void>;
};

/** Blobs est disponible uniquement sur l'infra Netlify (env + package). */
async function getBlobsStore(): Promise<BlobsStore | null> {
  if (!process.env.NETLIFY) return null;
  try {
    const { getStore } = await import("@netlify/blobs");
    return getStore({ name: BLOBS_STORE }) as unknown as BlobsStore;
  } catch {
    return null;
  }
}

async function readJsonFile(path: string): Promise<unknown> {
  try {
    const { readFile } = await import("fs/promises");
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeJsonFile(path: string, value: unknown): Promise<void> {
  const { mkdir, writeFile } = await import("fs/promises");
  const dir = path.split("/").slice(0, -1).join("/") || ".";
  await mkdir(dir, { recursive: true });
  await writeFile(path, JSON.stringify(value, null, 2), "utf8");
}

function normalizeEntries(raw: unknown): OpsHistoryEntry[] {
  const entries = (raw as { entries?: unknown })?.entries;
  return Array.isArray(entries) ? (entries as OpsHistoryEntry[]) : [];
}

// ---------------------------------------------------------------------------
// Historique
// ---------------------------------------------------------------------------

export async function readHistory(): Promise<{
  entries: OpsHistoryEntry[];
  backend: "blobs" | "file" | null;
  error?: string;
}> {
  const blobs = await getBlobsStore();
  if (blobs) {
    try {
      const raw = await blobs.get(BLOBS_KEY_HISTORY, { type: "json" });
      return { entries: normalizeEntries(raw), backend: "blobs" };
    } catch (error) {
      return {
        entries: [],
        backend: "blobs",
        error: error instanceof Error ? error.message : "Lecture Blobs impossible",
      };
    }
  }
  const raw = await readJsonFile(LOCAL_HISTORY_PATH);
  return { entries: normalizeEntries(raw), backend: raw ? "file" : null };
}

export async function appendHistory(
  entry: Omit<OpsHistoryEntry, "at"> & { at?: string },
): Promise<OpsHistoryStoreResult> {
  const full: OpsHistoryEntry = { at: new Date().toISOString(), ...entry };

  const blobs = await getBlobsStore();
  if (blobs) {
    try {
      const raw = await blobs.get(BLOBS_KEY_HISTORY, { type: "json" });
      const entries = [full, ...normalizeEntries(raw)].slice(0, HISTORY_LIMIT);
      await blobs.setJSON(BLOBS_KEY_HISTORY, { entries });
      return { entries, backend: "blobs" };
    } catch (error) {
      return {
        entries: [],
        backend: "blobs",
        error: error instanceof Error ? error.message : "Écriture Blobs impossible",
      };
    }
  }

  const raw = await readJsonFile(LOCAL_HISTORY_PATH);
  const entries = [full, ...normalizeEntries(raw)].slice(0, HISTORY_LIMIT);
  try {
    await writeJsonFile(LOCAL_HISTORY_PATH, { entries });
    return { entries, backend: "file" };
  } catch (error) {
    return {
      entries,
      backend: "file",
      error: error instanceof Error ? error.message : "Écriture locale impossible",
    };
  }
}

// ---------------------------------------------------------------------------
// État d'alerte (escalade après N échecs consécutifs du scheduler)
// ---------------------------------------------------------------------------

export type OpsAlertState = {
  /** Échecs consécutifs planifiés en cours. */
  streak: number;
  /** Dernière alerte envoyée (déduplication / re-rappel). */
  lastAlertAt: string | null;
  /** Dernier streak signalé — sert au message de rétablissement. */
  lastAlertStreak: number | null;
};

export const OPS_ALERT_THRESHOLD = 2;
/** Re-rappel si le problème persiste (ms). */
export const OPS_ALERT_REMIND_MS = 7 * 24 * 60 * 60 * 1000;

/** Vue publique de l'état d'alerte pour la page Statut Ops. */
export async function readAlertStatePublic(): Promise<{
  streak: number;
  lastAlertAt: string | null;
  threshold: number;
  webhookConfigured: boolean;
}> {
  const state = await readAlertState();
  return {
    streak: state.streak,
    lastAlertAt: state.lastAlertAt,
    threshold: OPS_ALERT_THRESHOLD,
    webhookConfigured: Boolean(process.env.OPS_ALERT_WEBHOOK_URL?.trim()),
  };
}

async function readAlertState(): Promise<OpsAlertState> {
  const blobs = await getBlobsStore();
  if (blobs) {
    try {
      const raw = (await blobs.get(BLOBS_KEY_ALERT_STATE, { type: "json" })) as
        | OpsAlertState
        | null;
      if (raw && typeof raw.streak === "number") return raw;
    } catch {
      // État absent/illisible → défaut.
    }
  }
  const raw = (await readJsonFile(LOCAL_ALERT_STATE_PATH)) as OpsAlertState | null;
  return raw && typeof raw.streak === "number"
    ? raw
    : { streak: 0, lastAlertAt: null, lastAlertStreak: null };
}

async function writeAlertState(state: OpsAlertState): Promise<void> {
  const blobs = await getBlobsStore();
  if (blobs) {
    try {
      await blobs.setJSON(BLOBS_KEY_ALERT_STATE, state);
      return;
    } catch {
      // Repli fichier sous Blobs illisible en écriture.
    }
  }
  try {
    await writeJsonFile(LOCAL_ALERT_STATE_PATH, state);
  } catch {
    // L'alerte reste émise même si la persistance échoue.
  }
}

function describeAlertProblem(latest: OpsHistoryEntry | undefined): string {
  if (!latest) return "Pipeline e-mail en échec";
  return latest.log ?? "Envoi de test impossible";
}

/**
 * Met à jour la série d'échecs consécutifs et décide de l'alerte.
 *
 * - Échec : streak +1 ; à `OPS_ALERT_THRESHOLD` (2) → alerte webhook.
 * - Persistance du problème : re-rappel tous les `OPS_ALERT_REMIND_MS` (7 j).
 * - Succès après alerte : notification de rétablissement + remise à zéro.
 * - Aucun webhook configuré : la série est suivie mais rien n'est envoyé
 *   (l'état reste visible sur la page Statut Ops).
 */
export async function updateAlertState(input: {
  ok: boolean;
  latest: OpsHistoryEntry | undefined;
  source: "manual" | "scheduled";
}): Promise<{
  state: OpsAlertState;
  alertSent: boolean;
  alertError?: string;
  alertAction: "sent" | "reminder" | "recovery" | "none";
}> {
  const state = await readAlertState();
  const webhook = process.env.OPS_ALERT_WEBHOOK_URL?.trim();

  if (input.ok) {
    const hadFailureStreak = state.streak > 0;
    const next: OpsAlertState = {
      streak: 0,
      lastAlertAt: state.lastAlertAt,
      lastAlertStreak: state.lastAlertStreak,
    };
    await writeAlertState(next);
    if (hadFailureStreak && state.lastAlertAt && webhook) {
      const sent = await postAlertWebhook(
        webhook,
        "✅ ProDay — pipeline e-mail rétabli",
        `Le pipeline e-mail est de nouveau opérationnel après ${state.streak} échec(s) consécutif(s) du scheduler quotidien.`,
      );
      return { state: next, alertSent: sent.ok, alertError: sent.error, alertAction: "recovery" };
    }
    return { state: next, alertSent: false, alertAction: "none" };
  }

  const streak = state.streak + 1;
  const shouldAlertFirst =
    streak >= OPS_ALERT_THRESHOLD &&
    (!state.lastAlertAt || state.lastAlertStreak === null || state.lastAlertStreak < OPS_ALERT_THRESHOLD);
  const lastAlertAge = state.lastAlertAt ? Date.now() - new Date(state.lastAlertAt).getTime() : Infinity;
  const shouldRemind =
    streak > OPS_ALERT_THRESHOLD &&
    state.lastAlertAt !== null &&
    lastAlertAge >= OPS_ALERT_REMIND_MS;

  if (!webhook || (!shouldAlertFirst && !shouldRemind)) {
    const next: OpsAlertState = { ...state, streak };
    await writeAlertState(next);
    return { state: next, alertSent: false, alertAction: "none" };
  }

  const problem = describeAlertProblem(input.latest);
  const title =
    streak === OPS_ALERT_THRESHOLD
      ? "🚨 ProDay — pipeline e-mail en échec"
      : "⏰ ProDay — rappel : pipeline e-mail toujours en échec";
  const lines = [
    `Le scheduler quotidien ProDay enregistre **${streak} échec(s) consécutif(s)** de la vérification e-mail.`,
    `Dernier problème : ${problem}`,
    input.latest?.hint ? `Action : ${input.latest.hint}` : null,
    `Voir /admin/ops/status → Historique des vérifications e-mail.`,
  ].filter(Boolean);
  const sent = await postAlertWebhook(webhook, title, lines.join("\n"));
  const next: OpsAlertState = {
    streak,
    lastAlertAt: sent.ok ? new Date().toISOString() : state.lastAlertAt,
    lastAlertStreak: sent.ok ? streak : state.lastAlertStreak,
  };
  await writeAlertState(next);
  return {
    state: next,
    alertSent: sent.ok,
    alertError: sent.error,
    alertAction: shouldRemind ? "reminder" : "sent",
  };
}

async function postAlertWebhook(
  url: string,
  title: string,
  body: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // Format compatible Slack/Discord incoming webhook ; personnalisable.
        text: `${title}\n${body}`,
      }),
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

// ---------------------------------------------------------------------------
// Dernier test (état dérivé de l'historique — un seul backend)
// ---------------------------------------------------------------------------

export type LastEmailTest = {
  ok: boolean;
  at: string;
  hint?: string;
  log?: string;
};

export async function readLastEmailTest(): Promise<LastEmailTest | null> {
  const blobs = await getBlobsStore();
  if (blobs) {
    try {
      const raw = (await blobs.get(BLOBS_KEY_LAST_TEST, { type: "json" })) as
        | LastEmailTest
        | null;
      return raw && raw.at ? raw : null;
    } catch {
      return null;
    }
  }
  const raw = (await readJsonFile(LOCAL_LAST_TEST_PATH)) as LastEmailTest | null;
  return raw && raw.at ? raw : null;
}

/** Dérive le dernier test de l'historique (source de vérité unique). */
export async function syncLastTestFromHistory(): Promise<LastEmailTest | null> {
  const { entries } = await readHistory();
  const latest = entries[0];
  if (!latest) return null;
  const last: LastEmailTest = {
    ok: latest.ok,
    at: latest.at,
    hint: latest.hint,
    log: latest.log,
  };
  const blobs = await getBlobsStore();
  if (blobs) {
    try {
      await blobs.setJSON(BLOBS_KEY_LAST_TEST, last);
    } catch {
      // Le dernier test reste dérivable de l'historique même si ce miroir échoue.
    }
  } else {
    try {
      await writeJsonFile(LOCAL_LAST_TEST_PATH, last);
    } catch {
      // idem
    }
  }
  return last;
}

// ---------------------------------------------------------------------------
// Vérification réelle partagée (action manuelle + scheduler)
// ---------------------------------------------------------------------------

export type EmailCheckResult = {
  ok: boolean;
  hint?: string;
  log?: string;
  history: OpsHistoryStoreResult;
};

export async function runEmailHealthCheck(
  source: OpsHistoryEntry["source"],
): Promise<EmailCheckResult> {
  const { getEmailJsBetaConfig, describeBetaEmailJsFailure, sendBetaWelcomeEmailViaEmailJs } =
    await import("@/lib/betaEmailjs");

  const config = getEmailJsBetaConfig();
  if (!config) {
    const missing = [
      "EMAILJS_SERVICE_ID",
      "EMAILJS_TEMPLATE_ID",
      "EMAILJS_PUBLIC_KEY",
      "EMAILJS_PRIVATE_KEY",
    ]
      .filter((k) => !process.env[k]?.trim())
      .join(", ");
    const result = {
      ok: false,
      log: `Config EmailJS incomplète (${missing})`,
      hint: "Définissez les variables EMAILJS_* sur Netlify (Site configuration → Environment variables).",
    };
    const history = await appendHistory({ ...result, source });
    return { ...result, history };
  }

  const recipient = process.env.OPS_STATUS_TEST_EMAIL?.trim();
  if (!recipient) {
    const result = {
      ok: false,
      log: "OPS_STATUS_TEST_EMAIL non défini",
      hint: "Définissez OPS_STATUS_TEST_EMAIL (destinataire de l'envoi de test).",
    };
    const history = await appendHistory({ ...result, source });
    return { ...result, history };
  }

  try {
    await sendBetaWelcomeEmailViaEmailJs(config, {
      email: recipient,
      roleLabel: "Test Ops",
    });
    const result = { ok: true };
    const history = await appendHistory({ ok: true, source });
    return { ...result, history };
  } catch (error) {
    const { log, hint } = describeBetaEmailJsFailure(error);
    const result = { ok: false, log, hint };
    const history = await appendHistory({ ...result, source });
    return { ...result, history };
  }
}
