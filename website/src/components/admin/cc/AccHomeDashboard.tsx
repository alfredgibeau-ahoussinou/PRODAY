"use client";

import Link from "next/link";
import { ArrowUpRight, AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import { AccShell } from "@/components/admin/cc/AccShell";
import { AccBanner, AccMetric, AccPanel, AccStatus } from "@/components/admin/cc/AccUi";
import type { AccActionItem, AccInsight } from "@/lib/adminCc/insights";

type Props = {
  healthScore: number;
  healthLabel: string;
  badges: { pendingBeta: number; pastDue: number; actionRequired: number };
  metrics: {
    users: number;
    active: number;
    pro: number;
    byRole: Record<string, number>;
    pendingBeta: number;
    siteWeek: number;
    siteToday: number;
    appOpens: number;
    mrr: number | null;
    mrrAvailable: boolean;
    pastDue: number;
    reportsOpen: number;
  };
  actions: AccActionItem[];
  insights: AccInsight[];
  errors: { beta?: string | null; visits?: string | null; platform?: string | null };
};

const ROLE_SHORT: Record<string, string> = {
  player: "Joueurs",
  coach: "Coachs",
  club: "Clubs",
  supporter: "Supporters",
  sponsor: "Sponsors",
  parent: "Parents",
  organizer: "Orga",
};

export function AccHomeDashboard({
  healthScore,
  healthLabel,
  badges,
  metrics,
  actions,
  insights,
  errors,
}: Props) {
  const roleEntries = Object.entries(metrics.byRole)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <AccShell
      title="Vue d'ensemble ProDay"
      subtitle="Supervision opérationnelle en temps réel : santé, actions requises, finances et signaux de la plateforme."
      badges={badges}
      healthScore={healthScore}
      healthLabel={healthLabel}
    >
      {(errors.beta || errors.visits || errors.platform) && (
        <div className="space-y-2">
          {errors.beta ? <AccBanner tone="warning">Bêta : {errors.beta}</AccBanner> : null}
          {errors.visits ? <AccBanner tone="warning">Trafic : {errors.visits}</AccBanner> : null}
          {errors.platform ? <AccBanner tone="warning">Plateforme : {errors.platform}</AccBanner> : null}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <AccPanel
            title="Santé Plateforme"
            description="Score composite : services Cloud, Auth, Stripe & API."
            action={
              <Link
                href="/admin/platform/health"
                className="inline-flex items-center gap-1 rounded-md bg-white/[0.04] px-2 py-1 text-xs font-semibold text-blue-400 transition hover:bg-white/[0.08] hover:text-blue-300"
              >
                Diagnostic <ArrowUpRight size={13} />
              </Link>
            }
          >
            <div className="flex items-end gap-5">
              <p
                className={`font-display text-6xl font-extrabold tabular-nums tracking-tight ${
                  healthScore >= 75
                    ? "text-teal-400"
                    : healthScore >= 55
                      ? "text-amber-400"
                      : "text-rose-400"
                }`}
              >
                {healthScore}
                <span className="text-3xl text-white/30">%</span>
              </p>
              <div className="pb-1.5">
                <AccStatus tone={healthScore >= 75 ? "success" : healthScore >= 55 ? "warning" : "danger"}>
                  {healthLabel}
                </AccStatus>
                <p className="mt-2 text-xs text-white/45">
                  Tous les systèmes principaux sont opérationnels.
                </p>
              </div>
            </div>
          </AccPanel>
        </div>

        <div className="lg:col-span-8">
          <AccPanel title="Actions prioritaires" description="Tâches en attente d'intervention immédiate.">
            <ul className="divide-y divide-[var(--acc-line)]">
              {actions.map((a) => (
                <li key={a.id}>
                  <Link
                    href={a.href}
                    className="group flex items-center gap-3 py-3 text-sm transition hover:bg-white/[0.02]"
                  >
                    {a.count > 0 ? (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30">
                        <AlertTriangle size={15} />
                      </div>
                    ) : (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-500/15 text-teal-400 ring-1 ring-teal-500/30">
                        <CheckCircle2 size={15} />
                      </div>
                    )}
                    <span className="flex-1 font-medium text-white/85 group-hover:text-white">{a.label}</span>
                    {a.count > 0 ? (
                      <span className="rounded-full bg-amber-400/20 px-2 py-0.5 font-mono text-xs font-bold tabular-nums text-amber-200 ring-1 ring-amber-400/30">
                        {a.count}
                      </span>
                    ) : null}
                    <ArrowUpRight size={15} className="text-white/25 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white/70" />
                  </Link>
                </li>
              ))}
            </ul>
          </AccPanel>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <AccMetric label="Utilisateurs" value={metrics.users} hint={`${metrics.active} actifs récemment`} tone="blue" />
        <AccMetric
          label="Clubs"
          value={metrics.byRole.club ?? 0}
          hint="Comptes rôle club"
          tone="default"
        />
        <AccMetric label="Abonnés Pro" value={metrics.pro} hint="Souscriptions actives" tone="teal" />
        <AccMetric
          label="MRR"
          value={
            metrics.mrrAvailable && metrics.mrr != null
              ? `${metrics.mrr.toFixed(0)} €`
              : "0 €"
          }
          hint={metrics.mrrAvailable ? "Revenu mensuel récurrent" : "Stripe synchronisé"}
          tone="amber"
        />
        <AccMetric label="Bêta en attente" value={metrics.pendingBeta} hint="Candidatures à valider" tone="amber" />
        <AccMetric
          label="Visites (7j)"
          value={metrics.siteWeek}
          hint={`${metrics.siteToday} auj. · ${metrics.appOpens} lancements`}
          tone="default"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AccPanel
          title="Insights & Détection Intelligente"
          description="Signaux réels calculés sur les données d'utilisation."
          action={
            <span className="inline-flex items-center gap-1.5 rounded-md bg-white/[0.04] px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-amber-300">
              <Sparkles size={12} className="text-amber-400" /> Analyse Live
            </span>
          }
        >
          <ul className="space-y-3">
            {insights.map((ins) => (
              <li key={ins.id} className="rounded-xl border border-[var(--acc-line)] bg-black/20 p-4 transition hover:border-[var(--acc-line-highlight)]">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-white">{ins.problem}</p>
                  <AccStatus
                    tone={
                      ins.severity === "critical"
                        ? "danger"
                        : ins.severity === "warning"
                          ? "warning"
                          : "info"
                    }
                  >
                    {ins.severity}
                  </AccStatus>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-white/50">
                  <span className="font-semibold text-white/70">Impact : </span>
                  {ins.impact}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-white/50">
                  <span className="font-semibold text-white/70">Recommandation : </span>
                  {ins.recommendation}
                </p>
                <Link
                  href={ins.href}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 hover:underline"
                >
                  Résoudre <ArrowUpRight size={13} />
                </Link>
              </li>
            ))}
          </ul>
        </AccPanel>

        <AccPanel title="Répartition par rôle" description="Profils actifs dans l'écosystème ProDay.">
          {roleEntries.length === 0 ? (
            <p className="text-xs text-white/45">Aucune donnée de rôle disponible.</p>
          ) : (
            <ul className="space-y-3">
              {roleEntries.map(([role, count]) => {
                const max = roleEntries[0]?.[1] || 1;
                const pct = Math.round((count / max) * 100);
                return (
                  <li key={role} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-white/80">{ROLE_SHORT[role] ?? role}</span>
                      <span className="font-mono text-xs tabular-nums text-white/60">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-6 flex flex-wrap gap-2 border-t border-[var(--acc-line)] pt-4">
            <Link
              href="/admin/users"
              className="rounded-lg border border-[var(--acc-line)] bg-white/[0.02] px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/[0.06] hover:text-white"
            >
              Gérer les utilisateurs
            </Link>
            <Link
              href="/admin/commercial/pricing"
              className="rounded-lg border border-[var(--acc-line)] bg-white/[0.02] px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/[0.06] hover:text-white"
            >
              Calculateur devis
            </Link>
            <Link
              href="/admin/finances"
              className="rounded-lg border border-[var(--acc-line)] bg-white/[0.02] px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/[0.06] hover:text-white"
            >
              Tableau finances
            </Link>
            <Link
              href="/admin/ops/beta"
              className="rounded-lg border border-[var(--acc-line)] bg-white/[0.02] px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/[0.06] hover:text-white"
            >
              Waitlist Bêta
            </Link>
          </div>
        </AccPanel>
      </div>
    </AccShell>
  );
}
