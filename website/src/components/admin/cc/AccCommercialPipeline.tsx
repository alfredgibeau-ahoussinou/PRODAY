"use client";

import Link from "next/link";
import { AccShell } from "@/components/admin/cc/AccShell";
import { AccBanner, AccEmpty, AccMetric, AccPanel, AccStatus } from "@/components/admin/cc/AccUi";

const PIPELINE = [
  { id: "prospect", label: "Prospect", hint: "Demandes site / waitlist club" },
  { id: "contacted", label: "Contacté", hint: "Premier échange" },
  { id: "qualified", label: "Qualifié", hint: "Adhérents & besoins connus" },
  { id: "quote_prep", label: "Devis en préparation", hint: "Calculateur" },
  { id: "quote_sent", label: "Devis envoyé", hint: "En attente réponse" },
  { id: "negotiation", label: "Négociation", hint: "Remise / options" },
  { id: "client", label: "Client", hint: "Contrat actif" },
  { id: "lost", label: "Perdu", hint: "Archivé" },
] as const;

type Props = {
  badges?: { pendingBeta?: number; pastDue?: number; actionRequired?: number };
  healthScore?: number | null;
  healthLabel?: string | null;
  pendingBeta: number;
  clubAccounts: number;
  betaError?: string | null;
};

export function AccCommercialPipeline({
  badges,
  healthScore = null,
  healthLabel = null,
  pendingBeta,
  clubAccounts,
  betaError = null,
}: Props) {
  return (
    <AccShell
      title="Commercial · Pipeline CRM"
      subtitle="CRM clubs interne — pipeline réel branché sur waitlist & comptes club ; stages avancés sans fake deals."
      badges={badges}
      healthScore={healthScore}
      healthLabel={healthLabel}
    >
      {betaError ? <AccBanner tone="warning">{betaError}</AccBanner> : null}

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <AccMetric label="Prospects bêta" value={pendingBeta} hint="Liste d’attente" tone="amber" />
        <AccMetric label="Comptes club" value={clubAccounts} hint="Rôle plateforme" tone="blue" />
        <AccMetric label="Devis" value="—" hint="Collection devis amont à brancher" tone="default" />
        <AccMetric label="Contrats" value="—" hint="Pas de mock" tone="default" />
      </div>

      <AccPanel title="Stages CRM" description="Kanban logique — données deal persistées = backlog prioritaire.">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {PIPELINE.map((stage) => {
            const count =
              stage.id === "prospect"
                ? pendingBeta
                : stage.id === "client"
                  ? clubAccounts
                  : 0;
            return (
              <div
                key={stage.id}
                className="border border-[var(--acc-line)] bg-[var(--acc-surface-2)] p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-medium text-white">{stage.label}</p>
                  <AccStatus tone={count > 0 ? "info" : "neutral"}>{count}</AccStatus>
                </div>
                <p className="mt-1 text-[11px] text-white/40">{stage.hint}</p>
              </div>
            );
          })}
        </div>
      </AccPanel>

      <AccPanel title="Actions commerciales">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/ops/beta"
            className="border border-[var(--acc-line)] px-3 py-2 text-[12px] text-white/70 hover:text-white"
          >
            Traiter la waitlist
          </Link>
          <Link
            href="/admin/commercial/pricing"
            className="border border-[var(--acc-line)] px-3 py-2 text-[12px] text-white/70 hover:text-white"
          >
            Ouvrir le calculateur
          </Link>
          <Link
            href="/admin/commercial/devis"
            className="border border-[var(--acc-line)] px-3 py-2 text-[12px] text-white/70 hover:text-white"
          >
            Centre devis
          </Link>
        </div>
        <div className="mt-4">
          <AccEmpty
            title="Pas de faux pipeline"
            description="Les devis sponsor publics passent par /api/sponsor/quote. Un inbox admin devis clubs sera branché sur la même CF quand l’endpoint liste sera exposé."
          />
        </div>
      </AccPanel>
    </AccShell>
  );
}
