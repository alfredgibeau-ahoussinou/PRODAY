"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
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

const STORAGE_KEY = "proday_acc_feature_flags_v1";
const DEFAULT_FLAGS = Object.fromEntries(FLAG_DEFS.map((f) => [f.id, true]));

function readFlagsRaw(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

type Props = {
  badges?: { pendingBeta?: number; pastDue?: number; actionRequired?: number };
  healthScore?: number | null;
  healthLabel?: string | null;
};

export function AccFeatureFlags({
  badges,
  healthScore = null,
  healthLabel = null,
}: Props) {
  const raw = useSyncExternalStore(subscribe, readFlagsRaw, () => "");
  const flags = useMemo(() => {
    if (!raw) return { ...DEFAULT_FLAGS };
    try {
      return { ...DEFAULT_FLAGS, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_FLAGS };
    }
  }, [raw]);

  const toggle = useCallback((id: string) => {
    const current = (() => {
      try {
        const r = localStorage.getItem(STORAGE_KEY);
        return r ? { ...DEFAULT_FLAGS, ...JSON.parse(r) } : { ...DEFAULT_FLAGS };
      } catch {
        return { ...DEFAULT_FLAGS };
      }
    })();
    const next = { ...current, [id]: !current[id] };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("storage"));
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <AccShell
      title="Feature flags"
      subtitle="Préférence console fondateurs (local). Sync Remote Config au backlog."
      badges={badges}
      healthScore={healthScore}
      healthLabel={healthLabel}
    >
      <AccBanner tone="info">
        Ces interrupteurs guident le backlog produit Admin. Ils ne coupent pas encore les modules
        app en production.
      </AccBanner>

      <AccPanel title="Catalogue" description="Feature management Control Center.">
        <ul className="divide-y divide-[var(--acc-line)]">
          {FLAG_DEFS.map((f) => {
            const on = flags[f.id] !== false;
            return (
              <li key={f.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white">{f.label}</p>
                  <p className="font-mono text-[10px] text-white/35">
                    {f.id} · {f.domain}
                  </p>
                </div>
                <AccStatus tone={on ? "success" : "neutral"}>{on ? "On" : "Off"}</AccStatus>
                <button
                  type="button"
                  onClick={() => toggle(f.id)}
                  className={`h-8 min-w-[3.5rem] px-2 text-[11px] font-semibold ${
                    on
                      ? "bg-teal-500/20 text-teal-100"
                      : "border border-[var(--acc-line)] text-white/45"
                  }`}
                >
                  {on ? "Désactiver" : "Activer"}
                </button>
              </li>
            );
          })}
        </ul>
      </AccPanel>
    </AccShell>
  );
}
