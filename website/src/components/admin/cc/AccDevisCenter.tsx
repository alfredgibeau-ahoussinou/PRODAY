"use client";

import Link from "next/link";
import { AccShell } from "@/components/admin/cc/AccShell";
import { AccBanner, AccEmpty, AccMetric, AccPanel } from "@/components/admin/cc/AccUi";

type Props = {
  badges?: { pendingBeta?: number; pastDue?: number; actionRequired?: number };
  healthScore?: number | null;
  healthLabel?: string | null;
  pendingBeta: number;
};

export function AccDevisCenter({
  badges,
  healthScore = null,
  healthLabel = null,
  pendingBeta,
}: Props) {
  return (
    <AccShell
      title="Centre devis"
      subtitle="Demandes club / sponsor — préparation via calculateur ; pas de faux devis stockés."
      badges={badges}
      healthScore={healthScore}
      healthLabel={healthLabel}
    >
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <AccMetric label="Waitlist (proxy)" value={pendingBeta} hint="Prospects entrants" tone="amber" />
        <AccMetric label="Devis ouverts" value="—" hint="Endpoint liste à venir" />
        <AccMetric label="Envoyés" value="—" />
        <AccMetric label="Acceptés" value="—" />
      </div>

      <AccPanel
        title="Workflow devis"
        description="Demande → Analyse → Tarification → Validation Admin → Envoi → Acceptation → Contrat"
        action={
          <Link
            href="/admin/commercial/pricing"
            className="text-[12px] text-[var(--acc-steel)] hover:underline"
          >
            Calculateur →
          </Link>
        }
      >
        <ol className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {[
            "Demande",
            "Analyse",
            "Prix",
            "Validation",
            "Envoi",
            "Contrat",
          ].map((step, i) => (
            <li
              key={step}
              className="border border-[var(--acc-line)] bg-[var(--acc-surface-2)] px-3 py-3 text-center"
            >
              <p className="font-mono text-[9px] text-white/30">{i + 1}</p>
              <p className="mt-1 text-[12px] text-white/75">{step}</p>
            </li>
          ))}
        </ol>
      </AccPanel>

      <AccBanner tone="info">
        Les soumissions publiques sponsor utilisent déjà{" "}
        <code className="text-[11px]">POST /api/sponsor/quote</code>. Le listing admin attend
        l’exposition sécurisée côté Cloud Function (secret admin).
      </AccBanner>

      <AccPanel title="Inbox">
        <AccEmpty
          title="Aucune file devis branchée"
          description="Utilisez le calculateur pour préparer un devis, puis archivez-le hors bande jusqu’à l’API inbox."
        />
      </AccPanel>
    </AccShell>
  );
}
