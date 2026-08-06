"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  AdminBanner,
  AdminButton,
  AdminEmptyState,
  AdminFilterChip,
  AdminKpiCard,
  AdminPanel,
  AdminStatusBadge,
  AdminTableShell,
  formatAdminDate,
} from "@/components/admin/adminUi";
import type { BetaFeedbackItem } from "@/lib/adminBetaApi";

type Filter = "open" | "resolved" | "all";

export function AdminFeedback({
  initialItems,
  initialCounts,
  initialError = null,
}: {
  initialItems: BetaFeedbackItem[];
  initialCounts: { all: number; open: number; resolved: number };
  initialError?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [items, setItems] = useState(initialItems);
  const [counts, setCounts] = useState(initialCounts);
  const [filter, setFilter] = useState<Filter>("open");
  const [error, setError] = useState(initialError);
  const [busyId, setBusyId] = useState<string | null>(null);

  const visible = items.filter((item) =>
    filter === "all" ? true : item.status === filter,
  );

  async function resolve(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/feedback/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackId: id }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Résolution impossible");
        return;
      }
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: "resolved",
                resolved_at: new Date().toISOString(),
              }
            : item,
        ),
      );
      setCounts((c) => ({
        all: c.all,
        open: Math.max(0, c.open - 1),
        resolved: c.resolved + 1,
      }));
      startTransition(() => router.refresh());
    } catch {
      setError("Erreur réseau");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminShell
      title="Retours bêta"
      subtitle="Bugs, idées et retours UX envoyés depuis l’espace bêta."
      actions={
        <AdminButton
          variant="ghost"
          disabled={pending}
          onClick={() => startTransition(() => router.refresh())}
        >
          Actualiser
        </AdminButton>
      }
    >
      {error ? <AdminBanner tone="error">{error}</AdminBanner> : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <AdminKpiCard label="Ouverts" value={counts.open} accent="amber" />
        <AdminKpiCard label="Résolus" value={counts.resolved} accent="emerald" />
        <AdminKpiCard label="Total" value={counts.all} accent="blue" />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ["open", "Ouverts"],
            ["resolved", "Résolus"],
            ["all", "Tous"],
          ] as const
        ).map(([id, label]) => (
          <AdminFilterChip
            key={id}
            active={filter === id}
            onClick={() => setFilter(id)}
          >
            {label}
          </AdminFilterChip>
        ))}
      </div>

      {visible.length === 0 ? (
        <AdminPanel className="p-0">
          <AdminEmptyState
            title="Aucun retour"
            description="Les messages du formulaire Aide bêta apparaîtront ici."
          />
        </AdminPanel>
      ) : (
        <AdminTableShell>
          <table className="min-w-[720px]">
            <thead>
              <tr>
                <th>Quand</th>
                <th>Auteur</th>
                <th>Catégorie</th>
                <th>Message</th>
                <th>Statut</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.id} className="align-top">
                  <td className="whitespace-nowrap text-white/55">
                    {formatAdminDate(row.created_at)}
                  </td>
                  <td>
                    <p className="text-white">{row.email}</p>
                    <p className="text-[11px] text-white/40">{row.role_label}</p>
                  </td>
                  <td className="font-mono text-[10px] uppercase tracking-wide text-[var(--proday-accent-bright)]">
                    {row.category}
                  </td>
                  <td className="max-w-md text-white/75">{row.message}</td>
                  <td>
                    <AdminStatusBadge
                      tone={row.status === "open" ? "pending" : "success"}
                    >
                      {row.status === "open" ? "Ouvert" : "Résolu"}
                    </AdminStatusBadge>
                  </td>
                  <td>
                    {row.status === "open" ? (
                      <AdminButton
                        size="sm"
                        variant="secondary"
                        disabled={busyId === row.id}
                        onClick={() => void resolve(row.id)}
                      >
                        Résoudre
                      </AdminButton>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminTableShell>
      )}
    </AdminShell>
  );
}
