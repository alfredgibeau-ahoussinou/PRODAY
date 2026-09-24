"use client";

import { useState } from "react";
import { AlertTriangle, Check, Mail, RefreshCw, X } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  AdminBanner,
  AdminButton,
  AdminKpiCard,
  AdminPanel,
  AdminStatusBadge,
  formatAdminDate,
  type AdminStatusTone,
} from "@/components/admin/adminUi";
import type { OpsHistoryEntry } from "@/lib/adminOpsHistoryTypes";
import type { OpsStatusReport, OpsStatusTone } from "@/lib/adminOpsStatus";

const TONE_BADGE: Record<OpsStatusTone, { tone: AdminStatusTone; label: string }> = {
  ok: { tone: "success", label: "OK" },
  warning: { tone: "warning", label: "Attention" },
  error: { tone: "danger", label: "KO" },
  unknown: { tone: "neutral", label: "Inconnu" },
};

const ACTION_LABELS: Record<string, string> = {
  broadcast_ios_pre_announcement: "Pré-annonce iOS",
  broadcast_ios_delay_notice: "Avis de retard iOS",
  trigger_ios_launch: "Lancement iOS",
  send_engagement_round: "Relance engagement",
  resend: "Renvoi email",
  bulk_approve: "Approbation groupée",
};

export function OpsStatusDashboard({
  initialReport,
}: {
  initialReport: OpsStatusReport;
}) {
  const [report, setReport] = useState(initialReport);
  const [refreshing, setRefreshing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Le rapport contient l'historique ; le POST le renvoie aussi. */
  const applyHistory = (history: OpsStatusReport["emailHistory"] | undefined) => {
    if (!history) return;
    setReport((prev) => ({ ...prev, emailHistory: history }));
  };

  const refresh = async () => {
    setRefreshing(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/ops/status", { cache: "no-store" });
      const data = (await res.json()) as {
        ok?: boolean;
        report?: OpsStatusReport;
        error?: string;
      };
      if (!res.ok || !data.report) {
        setError(data.error ?? "Rafraîchissement impossible");
        return;
      }
      setReport(data.report);
      applyHistory((data as { history?: OpsStatusReport["emailHistory"] }).history);
    } catch {
      setError("Réseau indisponible");
    } finally {
      setRefreshing(false);
    }
  };

  const sendTestEmail = async () => {
    setTesting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/ops/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test_email" }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        lastTest?: OpsStatusReport["email"]["lastTest"];
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Envoi de test impossible");
        return;
      }
      setReport((prev) => ({
        ...prev,
        email: { ...prev.email, lastTest: data.lastTest ?? prev.email.lastTest },
      }));
      applyHistory((data as { history?: OpsStatusReport["emailHistory"] }).history);
      setMessage(
        data.lastTest?.ok
          ? "Email de test envoyé — vérifiez la boîte de l'adresse OPS_STATUS_TEST_EMAIL."
          : (data.lastTest?.hint ?? data.lastTest?.log ?? "Échec de l'envoi de test — voir le détail ci-dessous."),
      );
    } catch {
      setError("Réseau indisponible");
    } finally {
      setTesting(false);
    }
  };

  const lastTest = report.email.lastTest;
  const gmailReminder =
    lastTest && !lastTest.ok && lastTest.hint ? lastTest.hint : null;
  const failingChecks = report.email.checks.filter((c) => c.tone === "error");

  return (
    <AdminShell
      title="Statut e-mail & diffusion"
      subtitle={`Généré le ${formatAdminDate(report.generatedAt)}. Les vérifications portent sur la configuration réelle du service — aucun état simulé.`}
      actions={
        <>
          <AdminButton onClick={refresh} disabled={refreshing}>
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Actualisation…" : "Actualiser"}
          </AdminButton>
          <AdminButton
            variant="primary"
            onClick={sendTestEmail}
            disabled={testing || !report.email.configured}
          >
            <Mail size={12} />
            {testing ? "Envoi…" : "Email de test"}
          </AdminButton>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {error ? <AdminBanner tone="error">{error}</AdminBanner> : null}
        {message ? (
          <AdminBanner tone={lastTest?.ok ? "success" : "warning"}>{message}</AdminBanner>
        ) : null}

        {report.escalation.streak > 0 ? (
          <div className="border border-orange-500/35 bg-orange-500/10 px-4 py-3">
            <p className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-orange-200">
              <AlertTriangle size={13} />
              Escalade — {report.escalation.streak} échec{report.escalation.streak > 1 ? "s" : ""} consécutif{report.escalation.streak > 1 ? "s" : ""} du scheduler
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-orange-100">
              {report.escalation.streak >= report.escalation.threshold
                ? "Seuil d'alerte atteint"
                : `Alerte envoyée à ${report.escalation.threshold}e échec consécutif`}
              {report.escalation.lastAlertAt
                ? ` · dernière alerte ${formatAdminDate(report.escalation.lastAlertAt)}`
                : ""}
              .
            </p>
            {!report.escalation.webhookConfigured ? (
              <p className="mt-1 text-[11px] text-orange-200/75">
                Aucun webhook d&apos;alerte configuré (OPS_ALERT_WEBHOOK_URL) —
                la série est suivie ici mais personne n&apos;est prévenu.
              </p>
            ) : null}
          </div>
        ) : null}

        {report.broadcast.error ? (
          <AdminBanner tone="warning">
            Audience indisponible : {report.broadcast.error} — les chiffres de
            diffusion affichés sont à zéro faute de réponse du service.
          </AdminBanner>
        ) : null}

        {/* Rappel de reconnexion Gmail — mis en évidence en tête de page */}
        {gmailReminder ? (
          <div className="border border-amber-500/40 bg-amber-500/10 px-4 py-3">
            <p className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-amber-200">
              <AlertTriangle size={13} />
              Action requise — Gmail
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-amber-100">
              {gmailReminder}
            </p>
            <p className="mt-1 text-[11px] text-amber-200/70">
              Tant que la reconnexion n&apos;est pas faite, waitlist, support et
              diffusions échoueront silencieusement côté expéditeur.
            </p>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <AdminKpiCard
            label="Config EmailJS"
            value={report.email.configured ? "Complète" : "Incomplète"}
            hint={report.email.missing.length ? `Manque : ${report.email.missing.join(", ")}` : "4/4 variables"}
            accent={report.email.configured ? "emerald" : "red"}
          />
          <AdminKpiCard
            label="Dernier test"
            value={lastTest ? (lastTest.ok ? "Reçu" : "Échec") : "Jamais"}
            hint={lastTest ? formatAdminDate(lastTest.at) : "Lancez un envoi de test"}
            accent={lastTest ? (lastTest.ok ? "emerald" : "amber") : "cyan"}
          />
          <AdminKpiCard
            label="Audience approuvée"
            value={report.broadcast.audience}
            hint={`${report.broadcast.pendingWelcome} en attente d'email`}
            accent="blue"
          />
          <AdminKpiCard
            label="Diffusion"
            value={report.broadcast.emailHealthy ? "Prête" : "Bloquée"}
            hint={report.broadcast.emailHealthy ? "Pipeline opérationnel" : "Corrigez la santé e-mail"}
            accent={report.broadcast.emailHealthy ? "emerald" : "red"}
          />
        </div>

        <AdminPanel
          title="Santé e-mail (EmailJS)"
          description="Présence-only : les valeurs secrètes ne sont jamais exposées."
        >
          <div className="flex flex-col divide-y divide-white/8 border border-white/10">
            {report.email.checks.map((check) => {
              const badge = TONE_BADGE[check.tone];
              return (
                <div
                  key={check.id}
                  className="flex flex-col gap-1 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white">{check.label}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-white/35">{check.hint}</p>
                    <p className="mt-0.5 text-[11px] text-white/45">{check.detail}</p>
                  </div>
                  <AdminStatusBadge tone={badge.tone}>{badge.label}</AdminStatusBadge>
                </div>
              );
            })}
          </div>
        </AdminPanel>

        <AdminPanel
          title="Workflow de diffusion"
          description="Préparation réelle de chaque action de campagne, dérivée de la waitlist et de la santé e-mail."
        >
          <div className="flex flex-col divide-y divide-white/8 border border-white/10">
            {report.broadcast.actions.map((action) => (
              <div
                key={action.id}
                className="flex flex-col gap-1 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white">{action.label}</p>
                  <p className="mt-0.5 text-[11px] text-white/45">
                    {action.ready
                      ? `Prête — ${report.broadcast.audience} destinataires approuvés`
                      : action.blocker}
                  </p>
                </div>
                <AdminStatusBadge tone={action.ready ? "success" : "danger"}>
                  {action.ready ? "Prête" : "Bloquée"}
                </AdminStatusBadge>
              </div>
            ))}
          </div>
          {!report.broadcast.emailHealthy ? (
            <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-amber-200/80">
              <AlertTriangle size={12} className="mt-0.5 shrink-0" />
              Les actions de campagne restent disponibles depuis la liste
              d&apos;attente, mais lancez-les uniquement après un envoi de test
              réussi.
            </p>
          ) : null}
        </AdminPanel>

        <AdminPanel
          title="Historique des vérifications e-mail"
          description={`Vérification quotidienne automatique (09:00 UTC) + envois manuels — backend : ${
            report.emailHistory.backend === "blobs"
              ? "Netlify Blobs"
              : report.emailHistory.backend === "file"
                ? "fichier local (dev)"
                : "aucun encore"
          }.`}
        >
          {report.emailHistory.error ? (
            <AdminBanner tone="warning">Historique indisponible : {report.emailHistory.error}</AdminBanner>
          ) : null}
          {report.emailHistory.entries.length === 0 ? (
            <p className="px-1 py-4 text-center text-[11px] text-white/35">
              Aucune vérification enregistrée — lancez un envoi de test ou
              attendez la prochaine exécution quotidienne.
            </p>
          ) : (
            <div className="flex max-h-64 flex-col divide-y divide-white/8 overflow-y-auto border border-white/10">
              {report.emailHistory.entries.map((entry: OpsHistoryEntry, i: number) => (
                <div
                  key={`${entry.at}-${i}`}
                  className="flex flex-col gap-0.5 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-xs text-white/75">
                      <AdminStatusBadge tone={entry.ok ? "success" : "danger"}>
                        {entry.ok ? "OK" : "Échec"}
                      </AdminStatusBadge>
                      {entry.source === "scheduled" ? "Automatique (09:00 UTC)" : "Manuel"}
                    </p>
                    {!entry.ok && entry.log ? (
                      <p className="mt-0.5 truncate text-[11px] text-white/45" title={entry.log}>
                        {entry.log}
                      </p>
                    ) : null}
                    {!entry.ok && entry.hint ? (
                      <p className="mt-0.5 text-[11px] text-amber-200/80">{entry.hint}</p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-[10px] text-white/35">
                    {formatAdminDate(entry.at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </AdminPanel>

        <AdminPanel
          title="Actions de diffusion récentes"
          description="Traces d'audit réelles (Cloud Functions)."
        >
          {report.recentBroadcastActions.length === 0 ? (
            <p className="px-1 py-4 text-center text-[11px] text-white/35">
              Aucune action de diffusion tracée.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-white/8 border border-white/10">
              {report.recentBroadcastActions.map((entry, i) => (
                <div
                  key={`${entry.action}-${entry.at ?? i}`}
                  className="flex flex-col gap-0.5 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="text-xs text-white/75">
                    <span className="font-mono text-[10px] uppercase tracking-wide text-white/40">
                      {ACTION_LABELS[entry.action] ?? entry.action}
                    </span>{" "}
                    — {entry.summary}
                  </p>
                  <span className="shrink-0 text-[10px] text-white/35">
                    {formatAdminDate(entry.at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </AdminPanel>

        <p className="flex items-center gap-2 text-[10px] text-white/30">
          {report.email.configured && failingChecks.length === 0 ? (
            <>
              <Check size={11} className="text-emerald-400" />
              Toutes les vérifications de configuration passent.
            </>
          ) : (
            <>
              <X size={11} className="text-red-400" />
              {failingChecks.length} vérification(s) en échec — corrigez avant diffusion.
            </>
          )}
        </p>
      </div>
    </AdminShell>
  );
}
