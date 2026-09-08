"use client";

import { useState } from "react";
import Link from "next/link";
import { AccShell } from "@/components/admin/cc/AccShell";
import { AccBanner, AccPanel, AccStatus } from "@/components/admin/cc/AccUi";

const AGENTS = [
  { id: "admin", label: "Admin AI", role: "Orchestrateur", href: "/admin/home" },
  { id: "finance", label: "Finance AI", role: "MRR, impayés, devis", href: "/admin/finances" },
  { id: "sales", label: "Sales AI", role: "CRM & pipeline", href: "/admin/commercial" },
  { id: "support", label: "Support AI", role: "Tickets", href: "/admin/ops/feedback" },
  { id: "security", label: "Security AI", role: "Audit & sessions", href: "/admin/security/audit" },
  { id: "product", label: "Product AI", role: "Flags & modules", href: "/admin/product" },
] as const;

type Props = {
  badges?: { pendingBeta?: number; pastDue?: number; actionRequired?: number };
  healthScore?: number | null;
  healthLabel?: string | null;
  contextSummary: string;
};

/** Coque multi-agents en lecture seule — pas de faux LLM ni mutations fantômes. */
export function AccAiCenter({
  badges,
  healthScore = null,
  healthLabel = null,
  contextSummary,
}: Props) {
  const [agent, setAgent] = useState<(typeof AGENTS)[number]["id"]>("admin");
  const selected = AGENTS.find((x) => x.id === agent) ?? AGENTS[0];

  return (
    <AccShell
      title="ProDay Admin AI"
      subtitle="Contexte ops branché — provider LLM non branché (pas de chat fictif)."
      badges={badges}
      healthScore={healthScore}
      healthLabel={healthLabel}
    >
      <AccBanner tone="info">
        Aucune inférence Vertex / OpenAI ici. Utilisez les modules Control Center (liens
        ci-dessous) pour agir. Les agents listés sont une carte de navigation, pas un
        copilote exécutable.
      </AccBanner>

      <div className="grid gap-3 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <AccPanel title="Agents (navigation)">
            <ul className="space-y-1">
              {AGENTS.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => setAgent(a.id)}
                    className={`flex w-full items-center justify-between px-2.5 py-2 text-left text-sm ${
                      agent === a.id
                        ? "bg-[var(--acc-accent-soft)] text-white"
                        : "text-white/55 hover:bg-white/[0.03]"
                    }`}
                  >
                    <span>{a.label}</span>
                    <AccStatus tone={agent === a.id ? "info" : "neutral"}>{a.role}</AccStatus>
                  </button>
                </li>
              ))}
            </ul>
          </AccPanel>
        </div>

        <div className="space-y-3 lg:col-span-8">
          <AccPanel
            title={`Contexte · ${selected.label}`}
            description="Résumé déterministe des agrégats déjà chargés (bêta, plateforme, santé)."
            action={
              <Link
                href={selected.href}
                className="border border-[var(--acc-line)] px-3 py-1.5 text-[11px] font-semibold text-white/70 hover:bg-white/[0.04] hover:text-white"
              >
                Ouvrir le module →
              </Link>
            }
          >
            <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-white/55">
              {contextSummary}
            </pre>
          </AccPanel>

          <AccPanel title="Statut provider">
            <p className="text-xs text-white/45">
              LLM : non configuré sur le site. Mutations admin (suspendre, rembourser, flags
              runtime) : Espace Admin app ou routes ops déjà branchées (bêta, facturation).
            </p>
          </AccPanel>
        </div>
      </div>
    </AccShell>
  );
}
