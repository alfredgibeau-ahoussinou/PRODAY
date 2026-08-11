"use client";

import { useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  AdminBanner,
  AdminEmptyState,
  AdminFilterChip,
  AdminKpiCard,
  AdminTableShell,
  formatAdminDate,
} from "@/components/admin/adminUi";
import type { AdminPlatformReport } from "@/lib/adminPlatformApi";

type Props = {
  items: AdminPlatformReport[];
  total: number;
  error?: string | null;
};

export function AdminReports({ items, total, error = null }: Props) {
  const [filter, setFilter] = useState<"all" | "open">("all");
  const rows = useMemo(
    () => (filter === "all" ? items : items.filter((r) => r.status === "open")),
    [filter, items],
  );

  return (
    <AdminShell
      title="Modération"
      subtitle="Signalements reels depuis Firestore `reel_reports`."
    >
      {error ? <AdminBanner tone="warning">{error}</AdminBanner> : null}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <AdminKpiCard label="Ouverts" value={total} accent="amber" />
        <AdminKpiCard label="Total" value={total} accent="blue" />
        <AdminKpiCard label="En cours" value="…" hint="Non suivi" accent="cyan" />
        <AdminKpiCard label="Résolus" value="…" hint="Non suivi" accent="emerald" />
      </section>

      <div className="flex flex-wrap gap-1.5">
        {(["all", "open"] as const).map((id) => (
          <AdminFilterChip
            key={id}
            active={filter === id}
            onClick={() => setFilter(id)}
          >
            {id === "all" ? "Tous" : "Ouverts"}
          </AdminFilterChip>
        ))}
      </div>

      <AdminTableShell>
        <table className="min-w-[760px]">
          <thead>
            <tr>
              <th>Type</th>
              <th>Cible</th>
              <th>Signaleur</th>
              <th>Statut</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="!p-0">
                  <AdminEmptyState
                    title={
                      error
                        ? "Source signalements indisponible"
                        : "Aucun signalement"
                    }
                    description={
                      error
                        ? "Connectez websiteAdminStats."
                        : "La file `reel_reports` est vide."
                    }
                  />
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td className="text-white">{r.type}</td>
                  <td className="font-mono text-xs text-white/55">{r.target}</td>
                  <td className="text-white/70">{r.reporter}</td>
                  <td className="text-white/70">Ouvert</td>
                  <td className="text-white/50">
                    {r.createdAt ? formatAdminDate(r.createdAt) : "…"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </AdminTableShell>
    </AdminShell>
  );
}
