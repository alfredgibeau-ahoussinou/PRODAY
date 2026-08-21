"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AccShell } from "@/components/admin/cc/AccShell";
import {
  AccBanner,
  AccEmpty,
  AccMetric,
  AccPanel,
  AccStatus,
  AccTable,
} from "@/components/admin/cc/AccUi";
import type { AdminPlatformUser } from "@/lib/adminPlatformApi";

type Props = {
  clubUsers: AdminPlatformUser[];
  badges?: { pendingBeta?: number; pastDue?: number; actionRequired?: number };
  healthScore?: number | null;
  healthLabel?: string | null;
  error?: string | null;
  /** Epoch ms figé côté serveur (évite Date.now en render). */
  nowMs: number;
};

export function AccClubsPanel({
  clubUsers,
  badges,
  healthScore = null,
  healthLabel = null,
  error = null,
  nowMs,
}: Props) {
  const searchParams = useSearchParams();
  const view = searchParams.get("view") || "all";
  const cutoff = nowMs - 30 * 24 * 3600 * 1000;

  const rows = useMemo(() => {
    const sorted = [...clubUsers].sort((a, b) => {
      const da = a.created_at ? Date.parse(a.created_at) : 0;
      const db = b.created_at ? Date.parse(b.created_at) : 0;
      return db - da;
    });
    if (view === "active") return sorted.filter((u) => u.is_active);
    if (view === "new") {
      return sorted.filter((u) => (u.created_at ? Date.parse(u.created_at) >= cutoff : false));
    }
    return sorted;
  }, [clubUsers, view, cutoff]);

  const newCount = clubUsers.filter((u) =>
    u.created_at ? Date.parse(u.created_at) >= cutoff : false,
  ).length;

  return (
    <AccShell
      title="Clubs"
      subtitle="Comptes rôle club (proxy dossier club). Fiche complète CRM = extension du pipeline Commercial."
      badges={badges}
      healthScore={healthScore}
      healthLabel={healthLabel}
    >
      {error ? <AccBanner tone="warning">{error}</AccBanner> : null}

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <AccMetric label="Tous" value={clubUsers.length} tone="blue" />
        <AccMetric label="Actifs" value={clubUsers.filter((u) => u.is_active).length} tone="teal" />
        <AccMetric label="Nouveaux 30j" value={newCount} tone="amber" />
        <AccMetric label="Affichés" value={rows.length} />
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: "all", label: "Tous" },
          { id: "active", label: "Actifs" },
          { id: "new", label: "Nouveaux" },
        ].map((t) => (
          <Link
            key={t.id}
            href={t.id === "all" ? "/admin/clubs" : `/admin/clubs?view=${t.id}`}
            className={`px-3 py-1.5 text-[12px] border ${
              view === t.id
                ? "border-[var(--proday-accent)]/50 bg-[var(--acc-accent-soft)] text-white"
                : "border-[var(--acc-line)] text-white/55"
            }`}
          >
            {t.label}
          </Link>
        ))}
        <Link href="/admin/commercial" className="border border-[var(--acc-line)] px-3 py-1.5 text-[12px] text-white/55">
          CRM Commercial →
        </Link>
      </div>

      <AccPanel title="Annuaire clubs" bodyClassName="p-0" className="overflow-hidden">
        {rows.length === 0 ? (
          <AccEmpty
            title="Aucun club dans l’échantillon"
            description="Les dossiers clubs enrichis (équipes, devis, contrats) arriveront quand l’API admin exposera la collection clubs."
          />
        ) : (
          <AccTable>
            <table>
              <thead>
                <tr>
                  <th>Club / contact</th>
                  <th>Tier</th>
                  <th>Statut</th>
                  <th>Créé</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <p className="text-white/85">{u.name || "Sans nom"}</p>
                      <p className="font-mono text-[11px] text-white/35">{u.email}</p>
                    </td>
                    <td className="font-mono text-[11px]">{u.subscription_tier ?? "—"}</td>
                    <td>
                      <AccStatus tone={u.is_active ? "success" : "neutral"}>
                        {u.is_active ? "Actif" : "Inactif"}
                      </AccStatus>
                    </td>
                    <td className="font-mono text-[11px] text-white/40">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString("fr-FR") : "—"}
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
