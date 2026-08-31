"use client";

import Link from "next/link";
import { AccShell } from "@/components/admin/cc/AccShell";
import {
  AccBanner,
  AccMetric,
  AccPanel,
  AccStatus,
  AccTable,
} from "@/components/admin/cc/AccUi";
import type { AdminConfigCheck } from "@/lib/adminConfigHealth";

type Props = {
  badges?: { pendingBeta?: number; pastDue?: number; actionRequired?: number };
  healthScore: number;
  healthLabel: string;
  config: AdminConfigCheck[];
  metrics: {
    users: number;
    active: number;
    pro: number;
    pendingBeta: number;
    pastDue: number;
    reportsOpen: number;
    siteWeek: number;
    appOpens: number;
  };
  errors?: { platform?: string | null; beta?: string | null; visits?: string | null };
};

export function AccPlatformHealth({
  badges,
  healthScore,
  healthLabel,
  config,
  metrics,
  errors,
}: Props) {
  return (
    <AccShell
      title="Santé système"
      subtitle="Diagnostic présence secrets / URLs + signaux ops. Jamais de valeurs secrètes affichées."
      badges={badges}
      healthScore={healthScore}
      healthLabel={healthLabel}
    >
      {(errors?.platform || errors?.beta || errors?.visits) && (
        <div className="space-y-1.5">
          {errors.platform ? <AccBanner tone="warning">{errors.platform}</AccBanner> : null}
          {errors.beta ? <AccBanner tone="warning">{errors.beta}</AccBanner> : null}
          {errors.visits ? <AccBanner tone="warning">{errors.visits}</AccBanner> : null}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <AccMetric
          label="Health"
          value={`${healthScore}%`}
          hint={healthLabel}
          tone={healthScore >= 75 ? "teal" : healthScore >= 55 ? "amber" : "red"}
        />
        <AccMetric label="Utilisateurs" value={metrics.users} hint={`${metrics.active} actifs`} />
        <AccMetric label="Past due" value={metrics.pastDue} tone={metrics.pastDue ? "red" : "default"} />
        <AccMetric label="Trafic 7j" value={metrics.siteWeek} hint={`${metrics.appOpens} opens`} />
      </div>

      <AccPanel title="Intégrations & configuration" description="Checks présence-only (Netlify env).">
        <AccTable>
          <table>
            <thead>
              <tr>
                <th>Contrôle</th>
                <th>Variable</th>
                <th>État</th>
              </tr>
            </thead>
            <tbody>
              {config.map((c) => (
                <tr key={c.id}>
                  <td className="text-white/80">{c.label}</td>
                  <td className="font-mono text-[11px] text-white/40">{c.hint}</td>
                  <td>
                    <AccStatus tone={c.ok ? "success" : "danger"}>
                      {c.ok ? "OK" : "Manquant"}
                    </AccStatus>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AccTable>
      </AccPanel>

      <AccPanel title="Liens ops">
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/home" className="border border-[var(--acc-line)] px-3 py-2 text-[12px] text-white/70">
            Control Center
          </Link>
          <Link href="/admin/ops/visites" className="border border-[var(--acc-line)] px-3 py-2 text-[12px] text-white/70">
            Trafic
          </Link>
          <Link href="/admin/system" className="border border-[var(--acc-line)] px-3 py-2 text-[12px] text-white/70">
            Configuration
          </Link>
        </div>
      </AccPanel>
    </AccShell>
  );
}
