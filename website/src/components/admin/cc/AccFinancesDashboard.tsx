"use client";

import Link from "next/link";
import { AccShell } from "@/components/admin/cc/AccShell";
import { AccClubInvoiceCenter } from "@/components/admin/cc/AccClubInvoiceCenter";
import {
  AccBanner,
  AccEmpty,
  AccMetric,
  AccPanel,
  AccStatus,
  AccTable,
} from "@/components/admin/cc/AccUi";
import type { AdminPlatformSubscription } from "@/lib/adminPlatformApi";

type Props = {
  badges?: { pendingBeta?: number; pastDue?: number; actionRequired?: number };
  healthScore?: number | null;
  healthLabel?: string | null;
  proCount: number;
  freeCount: number;
  activeOrTrialing: number;
  pastDue: number;
  mrr: number | null;
  mrrAvailable: boolean;
  byStatus: Record<string, number>;
  items: AdminPlatformSubscription[];
  error?: string | null;
};

export function AccFinancesDashboard({
  badges,
  healthScore = null,
  healthLabel = null,
  proCount,
  freeCount,
  activeOrTrialing,
  pastDue,
  mrr,
  mrrAvailable,
  byStatus,
  items,
  error = null,
}: Props) {
  const top = items.slice(0, 12);

  return (
    <AccShell
      title="Finances"
      subtitle="Abonnements plateforme + facturation club Stripe (Invoices)."
      badges={badges}
      healthScore={healthScore}
      healthLabel={healthLabel}
    >
      {error ? <AccBanner tone="warning">{error}</AccBanner> : null}

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        <AccMetric
          label="MRR"
          value={mrrAvailable && mrr != null ? `${mrr.toFixed(0)} €` : "n/d"}
          hint={mrrAvailable ? "Estimé amont" : "Non fourni par l’API"}
          tone="teal"
        />
        <AccMetric label="Pro" value={proCount} hint={`${freeCount} free`} tone="blue" />
        <AccMetric label="Actifs / essai" value={activeOrTrialing} tone="default" />
        <AccMetric label="Past due" value={pastDue} tone={pastDue > 0 ? "red" : "default"} />
        <AccMetric
          label="ARR indicatif"
          value={mrrAvailable && mrr != null ? `${(mrr * 12).toFixed(0)} €` : "n/d"}
          hint="MRR × 12"
          tone="amber"
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <AccPanel title="Statuts abonnement">
          <ul className="space-y-2">
            {Object.entries(byStatus).length === 0 ? (
              <li className="text-xs text-white/40">Aucun statut.</li>
            ) : (
              Object.entries(byStatus).map(([k, v]) => (
                <li key={k} className="flex justify-between text-sm">
                  <span className="text-white/60">{k}</span>
                  <span className="font-mono tabular-nums text-white">{v}</span>
                </li>
              ))
            )}
          </ul>
          <Link
            href="/admin/finances/subscriptions"
            className="mt-3 inline-block text-[12px] text-[var(--acc-steel)] hover:underline"
          >
            Voir tous les abonnements →
          </Link>
        </AccPanel>

        <AccPanel
          title="Facturation club (Stripe Invoice)"
          description="Prix custom + envoi réel — pas de faux paiements."
        >
          <AccClubInvoiceCenter />
        </AccPanel>
      </div>

      <AccPanel title="Abonnements récents (échantillon)" description="Données plateforme réelles.">
        {top.length === 0 ? (
          <AccEmpty title="Aucun abonnement" description="L’API n’a renvoyé aucun item." />
        ) : (
          <AccTable>
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Plan</th>
                  <th>Statut</th>
                  <th>Renouvellement</th>
                </tr>
              </thead>
              <tbody>
                {top.map((row) => (
                  <tr key={row.id}>
                    <td className="text-white/80">{row.email}</td>
                    <td>{row.plan}</td>
                    <td>
                      <AccStatus
                        tone={
                          row.status === "past_due"
                            ? "danger"
                            : row.status === "active" || row.status === "trialing"
                              ? "success"
                              : "neutral"
                        }
                      >
                        {row.status}
                      </AccStatus>
                    </td>
                    <td className="font-mono text-[11px] text-white/45">
                      {row.renewsAt ? new Date(row.renewsAt).toLocaleDateString("fr-FR") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AccTable>
        )}
      </AccPanel>
    </AccShell>
  );
}
