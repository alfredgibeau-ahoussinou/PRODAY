import { getEmailJsBetaConfig } from "@/lib/betaEmailjs";
import { fetchAdminAuditLogs } from "@/lib/adminBetaApi";
import {
  readAlertStatePublic,
  readHistory,
  readLastEmailTest,
  type OpsHistoryEntry,
} from "@/lib/adminOpsStore";

/**
 * Statut Ops — vérifications e-mail & diffusion en un seul agrégat.
 *
 * Conventions repo : présence-only pour la config (jamais de valeur secrète
 * exposée), actions réelles uniquement (pas d'état simulé), et le moindre
 * soupçon Gmail se solde par un rappel de reconnexion explicite.
 */

export type OpsStatusTone = "ok" | "warning" | "error" | "unknown";

export type OpsStatusCheck = {
  id: string;
  label: string;
  hint: string;
  tone: OpsStatusTone;
  detail: string;
  /** Rappel actionnable (ex. reconnexion Gmail) affiché en évidence. */
  reminder?: string;
};

export type OpsEmailHealth = {
  configured: boolean;
  missing: string[];
  /** Résultat du dernier envoi réel de test (null = jamais testé). */
  lastTest: {
    ok: boolean;
    at: string;
    /** Ex. « Reconnectez le compte Gmail dans EmailJS… » */
    hint?: string;
    log?: string;
  } | null;
  checks: OpsStatusCheck[];
};

export type OpsBroadcastReadiness = {
  audience: number;
  /** Vrais destinataires : approuvés n'ayant pas reçu l'email de bienvenue. */
  pendingWelcome: number;
  emailHealthy: boolean;
  /** Erreur réelle du service waitlist (chiffres à zéro ≠ audience vide). */
  error?: string;
  actions: Array<{
    id:
      | "broadcast_ios_pre_announcement"
      | "broadcast_ios_delay_notice"
      | "trigger_ios_launch"
      | "send_engagement_round";
    label: string;
    ready: boolean;
    blocker?: string;
  }>;
};

export type OpsStatusReport = {
  generatedAt: string;
  email: OpsEmailHealth;
  broadcast: OpsBroadcastReadiness;
  recentBroadcastActions: Array<{
    action: string;
    summary: string;
    at: string | null;
  }>;
  /** Historique des vérifications e-mail (manuelles + scheduler quotidien). */
  emailHistory: {
    entries: OpsHistoryEntry[];
    backend: "blobs" | "file" | null;
    error?: string;
  };
  /** Escalade : échecs consécutifs du scheduler + état de l'alerte. */
  escalation: {
    streak: number;
    lastAlertAt: string | null;
    threshold: number;
    webhookConfigured: boolean;
  };
};

const EMAILJS_FIELDS = [
  { key: "EMAILJS_SERVICE_ID", label: "Service ID" },
  { key: "EMAILJS_TEMPLATE_ID", label: "Template ID" },
  { key: "EMAILJS_PUBLIC_KEY", label: "Public key" },
  { key: "EMAILJS_PRIVATE_KEY", label: "Private key" },
] as const;

const BROADCAST_ACTIONS: Array<{
  id: OpsBroadcastReadiness["actions"][number]["id"];
  label: string;
}> = [
  { id: "broadcast_ios_pre_announcement", label: "Pré-annonce iOS" },
  { id: "broadcast_ios_delay_notice", label: "Avis de retard iOS" },
  { id: "trigger_ios_launch", label: "Déclenchement lancement iOS" },
  { id: "send_engagement_round", label: "Relance d'engagement" },
];

/** Regroupement anti-spam des actions de diffusion pour l'encadré « récent ». */
const BROADCAST_ACTION_KEYS = new Set([
  "broadcast_ios_pre_announcement",
  "broadcast_ios_delay_notice",
  "trigger_ios_launch",
  "send_engagement_round",
  "resend",
  "bulk_approve",
]);

/** Évalue la santé e-mail à partir de la config réelle (présence-only). */
export function getEmailHealth(
  lastTest: OpsEmailHealth["lastTest"],
): OpsEmailHealth {
  const config = getEmailJsBetaConfig();
  const missing = EMAILJS_FIELDS.filter(
    (f) => !process.env[f.key]?.trim(),
  ).map((f) => f.label);

  const checks: OpsStatusCheck[] = EMAILJS_FIELDS.map((f) => ({
    id: f.key.toLowerCase(),
    label: f.label,
    hint: f.key,
    tone: process.env[f.key]?.trim() ? "ok" : "error",
    detail: process.env[f.key]?.trim()
      ? "Définie"
      : "Variable d'environnement manquante",
  }));

  const gmailHinted = lastTest && !lastTest.ok && lastTest.hint;
  if (gmailHinted) {
    checks.unshift({
      id: "gmail_connection",
      label: "Connexion Gmail (EmailJS)",
      hint: "Email Services → Reconnect",
      tone: "error",
      detail: lastTest.log ?? "Échec du dernier envoi de test",
      reminder: lastTest.hint,
    });
  }

  return {
    configured: Boolean(config),
    missing,
    lastTest,
    checks,
  };
}

/**
 * Évalue l'état de préparation de chaque action de diffusion. Les valeurs
 * viennent du service (waitlist + santé e-mail) : rien n'est simulé.
 */
export function getBroadcastReadiness(input: {
  counts: { approved: number };
  entries: Array<{
    status: string;
    welcome_email_sent?: boolean;
  }>;
  emailHealth: OpsEmailHealth;
}): OpsBroadcastReadiness {
  const pendingWelcome = input.entries.filter(
    (e) => e.status === "approved" && !e.welcome_email_sent,
  ).length;

  const emailHealthy =
    input.emailHealth.configured &&
    input.emailHealth.checks.every((c) => c.tone === "ok");

  const blocker = input.emailHealth.configured
    ? emailHealthy
      ? undefined
      : "Santé e-mail dégradée — effectuez un envoi de test avant la diffusion"
    : "EmailJS non configuré (EMAILJS_* manquants)";

  return {
    audience: input.counts.approved,
    pendingWelcome,
    emailHealthy,
    actions: BROADCAST_ACTIONS.map((a) => ({
      ...a,
      ready: Boolean(emailHealthy),
      blocker,
    })),
  };
}

/** Dernières actions de diffusion tracées (audit Cloud Functions). */

/** Dernières actions de diffusion tracées (audit Cloud Functions). */
export async function getRecentBroadcastActions(): Promise<
  OpsStatusReport["recentBroadcastActions"]
> {
  const audit = await fetchAdminAuditLogs();
  if (!audit.ok) return [];
  return audit.entries
    .filter((e) => BROADCAST_ACTION_KEYS.has(e.action))
    .slice(0, 5)
    .map((e) => ({
      action: e.action,
      summary: e.summary,
      at: e.created_at,
    }));
}

/** Agrégat complet pour la page de statut. */
export async function loadOpsStatus(): Promise<OpsStatusReport> {
  const { fetchBetaWaitlistAdmin } = await import("@/lib/adminBetaApi");
  const lastTest = await readLastEmailTest();
  const emailHealth = getEmailHealth(lastTest);

  const waitlist = await fetchBetaWaitlistAdmin({ pageSize: 200 });

  const broadcast = getBroadcastReadiness({
    counts: waitlist.counts,
    entries: waitlist.entries.map((e) => ({
      status: e.status,
      welcome_email_sent: e.welcome_email_sent,
    })),
    emailHealth,
  });
  if (!waitlist.ok && waitlist.error) {
    broadcast.error = waitlist.error;
  }

  const [recentBroadcastActions, emailHistory, alertState] = await Promise.all([
    getRecentBroadcastActions(),
    readHistory(),
    readAlertStatePublic(),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    email: emailHealth,
    broadcast,
    recentBroadcastActions,
    emailHistory,
    escalation: {
      streak: alertState.streak,
      lastAlertAt: alertState.lastAlertAt,
      threshold: alertState.threshold,
      webhookConfigured: alertState.webhookConfigured,
    },
  };
}
