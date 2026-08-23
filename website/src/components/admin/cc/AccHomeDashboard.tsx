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
      title="Que se passe t il sur ProDay ?"
      subtitle="Vision ops temps réel : santé, actions, monétisation et signaux plateforme."
      badges={badges}
      healthScore={healthScore}
      healthLabel={healthLabel}
    >
      {(errors.beta || errors.visits || errors.platform) && (
        <div className="space-y-1.5">
          {errors.beta ? <AccBanner tone="warning">Bêta : {errors.beta}</AccBanner> : null}
          {errors.visits ? <AccBanner tone="warning">Trafic : {errors.visits}</AccBanner> : null}
          {errors.platform ? <AccBanner tone="warning">Plateforme : {errors.platform}</AccBanner> : null}
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <AccPanel
            title="ProDay Health"
            description="Score composite config + signaux ops."
            action={
              <Link
                href="/admin/platform/health"
                className="inline-flex items-center gap-1 text-[11px] text-[var(--acc-steel)] hover:underline"
              >
                Diagnostic <ArrowUpRight size={12} />
              </Link>
            }
          >
            <div className="flex items-end gap-4">
              <p
                className={`font-display text-5xl font-medium tabular-nums tracking-[-0.04em] ${
                  healthScore >= 75 ? "text-teal-300" : healthScore >= 55 ? "text-amber-300" : "text-rose-300"
                }`}
              >
                {healthScore}
                <span className="text-2xl text-white/35">%</span>
              </p>
              <div className="pb-1">
                <AccStatus tone={healthScore >= 75 ? "success" : healthScore >= 55 ? "warning" : "danger"}>
                  {healthLabel}
                </AccStatus>
                <p className="mt-2 text-[11px] text-white/40">
                  Cliquer pour ouvrir le diagnostic intégrations.
                </p>
              </div>
            </div>
          </AccPanel>
        </div>

        <div className="lg:col-span-8">
          <AccPanel title="Action required" description="File actionnable — chaque ligne mène au module.">
            <ul className="divide-y divide-[var(--acc-line)]">
              {actions.map((a) => (
                <li key={a.id}>
                  <Link
                    href={a.href}
                    className="flex items-center gap-3 py-2.5 text-sm transition hover:bg-white/[0.02]"
                  >
                    {a.count > 0 ? (
                      <AlertTriangle
                        size={15}
                        className={
                          a.tone === "red"
                            ? "text-rose-400"
                            : a.tone === "amber"
                              ? "text-amber-400"
                              : "text-[var(--proday-accent-bright)]"
                        }
                      />
                    ) : (
                      <CheckCircle2 size={15} className="text-teal-400" />
                    )}
                    <span className="flex-1 text-white/80">{a.label}</span>
                    {a.count > 0 ? (
                      <span className="font-mono text-xs font-bold tabular-nums text-white">{a.count}</span>
                    ) : null}
                    <ArrowUpRight size={14} className="text-white/25" />
                  </Link>
                </li>
              ))}
            </ul>
          </AccPanel>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 xl:grid-cols-6">
        <AccMetric label="Utilisateurs" value={metrics.users} hint={`${metrics.active} actifs`} tone="blue" />
        <AccMetric
          label="Clubs (rôle)"
          value={metrics.byRole.club ?? 0}
          hint="Comptes rôle club"
          tone="default"
        />
        <AccMetric label="Pro" value={metrics.pro} hint="Tiers abonnement" tone="teal" />
        <AccMetric
          label="MRR"
          value={
            metrics.mrrAvailable && metrics.mrr != null
              ? `${metrics.mrr.toFixed(0)} €`
              : "n/d"
          }
          hint={metrics.mrrAvailable ? "Estimé plateforme" : "Non exposé amont"}
          tone="amber"
        />
        <AccMetric label="Bêta attente" value={metrics.pendingBeta} hint="À approuver" tone="amber" />
        <AccMetric
          label="Trafic 7j"
          value={metrics.siteWeek}
          hint={`${metrics.siteToday} aujourd’hui · ${metrics.appOpens} opens`}
          tone="default"
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <AccPanel
          title="Admin Insights"
          description="Signaux déterministes (données branchées) — pas de mock."
          action={
            <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.14em] text-white/30">
              <Sparkles size={11} /> Analyse
            </span>
          }
        >
          <ul className="space-y-3">
            {insights.map((ins) => (
              <li key={ins.id} className="border border-[var(--acc-line)] bg-[var(--acc-surface-2)] p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-white">{ins.problem}</p>
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
                <p className="mt-1 text-[11px] text-white/40">
                  <span className="text-white/55">Impact · </span>
                  {ins.impact}
                </p>
                <p className="mt-1 text-[11px] text-white/55">
                  <span className="text-white/40">Reco · </span>
                  {ins.recommendation}
                </p>
                <Link
                  href={ins.href}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] text-[var(--acc-steel)] hover:underline"
                >
                  Action <ArrowUpRight size={12} />
                </Link>
              </li>
            ))}
          </ul>
        </AccPanel>

        <AccPanel title="Répartition rôles" description="Comptes plateforme (échantillon amont).">
          {roleEntries.length === 0 ? (
            <p className="text-xs text-white/40">Aucune donnée rôle disponible.</p>
          ) : (
            <ul className="space-y-2">
              {roleEntries.map(([role, count]) => {
                const max = roleEntries[0]?.[1] || 1;
                const pct = Math.round((count / max) * 100);
                return (
                  <li key={role}>
                    <div className="mb-1 flex justify-between text-[12px]">
                      <span className="text-white/70">{ROLE_SHORT[role] ?? role}</span>
                      <span className="font-mono tabular-nums text-white/50">{count}</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.06]">
                      <div
                        className="h-full bg-[var(--proday-accent)]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/admin/users"
              className="border border-[var(--acc-line)] px-2.5 py-1.5 text-[11px] text-white/60 hover:text-white"
            >
              Utilisateurs
            </Link>
            <Link
              href="/admin/commercial/pricing"
              className="border border-[var(--acc-line)] px-2.5 py-1.5 text-[11px] text-white/60 hover:text-white"
            >
              Calculateur devis
            </Link>
            <Link
              href="/admin/finances"
              className="border border-[var(--acc-line)] px-2.5 py-1.5 text-[11px] text-white/60 hover:text-white"
            >
              Finances
            </Link>
            <Link
              href="/admin/ops/beta"
              className="border border-[var(--acc-line)] px-2.5 py-1.5 text-[11px] text-white/60 hover:text-white"
            >
              Waitlist
            </Link>
          </div>
        </AccPanel>
      </div>
    </AccShell>
  );
}
