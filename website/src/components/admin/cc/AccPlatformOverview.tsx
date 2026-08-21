"use client";

import Link from "next/link";
import { AccShell } from "@/components/admin/cc/AccShell";
import { AccMetric, AccPanel } from "@/components/admin/cc/AccUi";

type Props = {
  badges?: { pendingBeta?: number; pastDue?: number; actionRequired?: number };
  healthScore?: number | null;
  healthLabel?: string | null;
  users: number;
  active: number;
  byRole: Record<string, number>;
  siteWeek: number;
  appOpens: number;
  pendingBeta: number;
  pro: number;
};

export function AccPlatformOverview({
  badges,
  healthScore = null,
  healthLabel = null,
  users,
  active,
  byRole,
  siteWeek,
  appOpens,
  pendingBeta,
  pro,
}: Props) {
  return (
    <AccShell
      title="Plateforme · Vue globale"
      subtitle="Synthèse des flux branchés : comptes, trafic, monétisation individuelle."
      badges={badges}
      healthScore={healthScore}
      healthLabel={healthLabel}
    >
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <AccMetric label="Utilisateurs" value={users} hint={`${active} actifs`} tone="blue" />
        <AccMetric label="Pro" value={pro} tone="teal" />
        <AccMetric label="Bêta attente" value={pendingBeta} tone="amber" />
        <AccMetric label="Trafic 7j" value={siteWeek} hint={`${appOpens} opens app`} />
      </div>

      <AccPanel title="Rôles" description="Répartition comptes.">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(byRole)
            .sort((a, b) => b[1] - a[1])
            .map(([role, n]) => (
              <Link
                key={role}
                href={`/admin/users?role=${encodeURIComponent(role)}`}
                className="flex items-center justify-between border border-[var(--acc-line)] bg-[var(--acc-surface-2)] px-3 py-2.5 text-sm hover:bg-white/[0.03]"
              >
                <span className="text-white/70">{role}</span>
                <span className="font-mono tabular-nums text-white">{n}</span>
              </Link>
            ))}
        </div>
      </AccPanel>

      <AccPanel title="Modules">
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/platform/health" className="border border-[var(--acc-line)] px-3 py-2 text-[12px] text-white/70">
            Santé
          </Link>
          <Link href="/admin/ops/visites" className="border border-[var(--acc-line)] px-3 py-2 text-[12px] text-white/70">
            Activité
          </Link>
          <Link href="/admin/ops/analytics" className="border border-[var(--acc-line)] px-3 py-2 text-[12px] text-white/70">
            Performance
          </Link>
        </div>
      </AccPanel>
    </AccShell>
  );
}
