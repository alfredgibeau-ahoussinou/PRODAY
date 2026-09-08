"use client";

import { AccShell } from "@/components/admin/cc/AccShell";
import { AccBanner, AccPanel, AccStatus } from "@/components/admin/cc/AccUi";

const FLAG_DEFS = [
  { id: "AI_PLAYER", label: "IA Joueur", domain: "IA" },
  { id: "FORM_ANALYSIS", label: "Analyse de forme", domain: "Sport" },
  { id: "TOURNAMENTS", label: "Tournois", domain: "Sport" },
  { id: "RECRUITMENT", label: "Recrutement", domain: "Club" },
  { id: "MARKETPLACE", label: "Marketplace", domain: "Produit" },
  { id: "SPONSORSHIP", label: "Sponsoring", domain: "Commercial" },
  { id: "SUPPORTER", label: "Pôle Supporter", domain: "Produit" },
  { id: "ADMIN_AI", label: "Admin AI (console)", domain: "Admin" },
] as const;

type Props = {
  badges?: { pendingBeta?: number; pastDue?: number; actionRequired?: number };
  healthScore?: number | null;
  healthLabel?: string | null;
};

/** Catalogue produit en lecture seule — pas de toggles morts (Remote Config = app). */
export function AccFeatureFlags({
  badges,
  healthScore = null,
  healthLabel = null,
}: Props) {
  return (
    <AccShell
      title="Feature flags"
      subtitle="Catalogue produit (référence). Pas d’interrupteur site — Remote Config / app Admin."
      badges={badges}
      healthScore={healthScore}
      healthLabel={healthLabel}
    >
      <AccBanner tone="info">
        Ces entrées documentent le backlog flags. Elles ne pilotent pas l’app en production.
        Le contrôle runtime (Remote Config, kill-switches) vit dans l’Espace Admin de l’app
        Expo, pas sur ce site.
      </AccBanner>

      <AccPanel title="Catalogue" description="Référence Control Center — lecture seule.">
        <ul className="divide-y divide-[var(--acc-line)]">
          {FLAG_DEFS.map((f) => (
            <li key={f.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white">{f.label}</p>
                <p className="font-mono text-[10px] text-white/35">
                  {f.id} · {f.domain}
                </p>
              </div>
              <AccStatus tone="neutral">App Admin</AccStatus>
            </li>
          ))}
        </ul>
      </AccPanel>
    </AccShell>
  );
}
