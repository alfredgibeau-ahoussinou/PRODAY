"use client";

import { useState } from "react";
import { AccShell } from "@/components/admin/cc/AccShell";
import { AccBanner, AccButton, AccInput, AccPanel, AccStatus } from "@/components/admin/cc/AccUi";

const AGENTS = [
  { id: "admin", label: "Admin AI", role: "Orchestrateur" },
  { id: "finance", label: "Finance AI", role: "MRR, impayés, devis" },
  { id: "sales", label: "Sales AI", role: "CRM & pipeline" },
  { id: "support", label: "Support AI", role: "Tickets" },
  { id: "security", label: "Security AI", role: "Audit & sessions" },
  { id: "product", label: "Product AI", role: "Flags & modules" },
] as const;

type Props = {
  badges?: { pendingBeta?: number; pastDue?: number; actionRequired?: number };
  healthScore?: number | null;
  healthLabel?: string | null;
  contextSummary: string;
};

export function AccAiCenter({
  badges,
  healthScore = null,
  healthLabel = null,
  contextSummary,
}: Props) {
  const [agent, setAgent] = useState<(typeof AGENTS)[number]["id"]>("admin");
  const [prompt, setPrompt] = useState("");
  const [log, setLog] = useState<{ q: string; a: string }[]>([]);
  const [pendingConfirm, setPendingConfirm] = useState<string | null>(null);

  function ask() {
    const q = prompt.trim();
    if (!q) return;
    const a = [
      `[${AGENTS.find((x) => x.id === agent)?.label}] Contexte plateforme :`,
      contextSummary,
      "",
      "Réponse déterministe (pas d’appel LLM branché) :",
      "Utilisez les modules Control Center (Finances, Commercial, Utilisateurs, Santé) pour l’action.",
      "Les actions sensibles exigeront une confirmation Admin.",
    ].join("\n");
    setLog((prev) => [{ q, a }, ...prev].slice(0, 8));
    setPrompt("");
    if (/tarif|prix|suspend|supprim|rembours/i.test(q)) {
      setPendingConfirm("Action sensible détectée — confirmation requise avant exécution.");
    }
  }

  return (
    <AccShell
      title="ProDay Admin AI"
      subtitle="Assistant contextualisé — multi-agents prévus. Pas de faux LLM : réponses basées sur le résumé ops branché."
      badges={badges}
      healthScore={healthScore}
      healthLabel={healthLabel}
    >
      <AccBanner tone="info">
        L’inférence LLM (Vertex / OpenAI) n’est pas branchée ici. La coque agents + confirmation
        Admin est en place pour brancher le provider ensuite.
      </AccBanner>

      <div className="grid gap-3 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <AccPanel title="Agents">
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
          <AccPanel title="Console">
            <p className="mb-3 whitespace-pre-wrap text-[11px] leading-relaxed text-white/40">
              {contextSummary}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <AccInput
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder='Ex. « Quels devis / waitlist sont en attente ? »'
                onKeyDown={(e) => {
                  if (e.key === "Enter") ask();
                }}
              />
              <AccButton onClick={ask}>Analyser</AccButton>
            </div>
            {pendingConfirm ? (
              <div className="mt-3 border border-amber-500/30 bg-amber-500/10 p-3">
                <p className="text-xs text-amber-100">{pendingConfirm}</p>
                <div className="mt-2 flex gap-2">
                  <AccButton variant="ghost" onClick={() => setPendingConfirm(null)}>
                    Annuler
                  </AccButton>
                  <AccButton
                    onClick={() => {
                      setPendingConfirm(null);
                      setLog((prev) => [
                        {
                          q: "CONFIRMATION",
                          a: "Confirmé — aucune mutation exécutée (provider IA non branché).",
                        },
                        ...prev,
                      ]);
                    }}
                  >
                    Confirmer
                  </AccButton>
                </div>
              </div>
            ) : null}
          </AccPanel>

          <AccPanel title="Journal session">
            {log.length === 0 ? (
              <p className="text-xs text-white/40">Aucune requête dans cette session.</p>
            ) : (
              <ul className="space-y-3">
                {log.map((entry, i) => (
                  <li key={i} className="border border-[var(--acc-line)] bg-[var(--acc-surface-2)] p-3">
                    <p className="text-sm text-white">{entry.q}</p>
                    <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px] text-white/45">
                      {entry.a}
                    </pre>
                  </li>
                ))}
              </ul>
            )}
          </AccPanel>
        </div>
      </div>
    </AccShell>
  );
}
