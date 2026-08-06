"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  AdminBanner,
  AdminButton,
  AdminEmptyState,
  AdminPanel,
  AdminTableShell,
  formatAdminDate,
} from "@/components/admin/adminUi";
import type { AdminAuditEntry } from "@/lib/adminBetaApi";

export function AdminLogs({
  initialEntries,
  initialError = null,
}: {
  initialEntries: AdminAuditEntry[];
  initialError?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [entries] = useState(initialEntries);
  const [error] = useState(initialError);

  return (
    <AdminShell
      title="Journal d’activité"
      subtitle="Actions admin site (approbations, campagnes, retours)."
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

      <AdminPanel className="p-0">
        {entries.length === 0 ? (
          <AdminEmptyState
            title="Aucun événement"
            description="Les approbations, refus, renvois et campagnes apparaîtront ici."
          />
        ) : (
          <AdminTableShell>
            <table className="min-w-[640px]">
              <thead>
                <tr>
                  <th>Quand</th>
                  <th>Action</th>
                  <th>Résumé</th>
                  <th>Cible</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((row) => (
                  <tr key={row.id}>
                    <td className="whitespace-nowrap text-white/55">
                      {formatAdminDate(row.created_at)}
                    </td>
                    <td className="font-mono text-[10px] text-[var(--proday-accent-bright)]">
                      {row.action}
                    </td>
                    <td className="text-white/80">{row.summary}</td>
                    <td className="font-mono text-[10px] text-white/40">
                      {row.target_type}/{row.target_id.slice(0, 12)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTableShell>
        )}
      </AdminPanel>
    </AdminShell>
  );
}
