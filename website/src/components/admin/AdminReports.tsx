"use client";

import { useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  AdminBanner,
  AdminKpiCard,
  AdminMockBadge,
  AdminTableShell,
  formatAdminDate,
} from "@/components/admin/adminUi";

type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";

type Report = {
  id: string;
  type: string;
  target: string;
  reporter: string;
  status: ReportStatus;
  createdAt: string;
};

const MOCK: Report[] = [
  {
    id: "r1",
    type: "Contenu inapproprié",
    target: "reel:abc123",
    reporter: "user@example.com",
    status: "open",
    createdAt: "2026-08-02T10:00:00Z",
  },
  {
    id: "r2",
    type: "Spam message",
    target: "dm:thread-9",
    reporter: "coach@example.com",
    status: "reviewing",
    createdAt: "2026-08-01T16:20:00Z",
  },
  {
    id: "r3",
    type: "Profil suspect",
    target: "user:uid-88",
    reporter: "club@example.com",
    status: "resolved",
    createdAt: "2026-07-28T09:00:00Z",
  },
];

const LABELS: Record<ReportStatus, string> = {
  open: "Ouvert",
  reviewing: "En cours",
  resolved: "Résolu",
  dismissed: "Rejeté",
};

export function AdminReports() {
  const [filter, setFilter] = useState<ReportStatus | "all">("open");
  const rows = useMemo(
    () => (filter === "all" ? MOCK : MOCK.filter((r) => r.status === filter)),
    [filter],
  );

  return (
    <AdminShell
      title="Modération"
      subtitle="Signalements et files de revue. Brancher la collection Firestore `reports`."
      actions={<AdminMockBadge />}
    >
      <AdminBanner tone="info">
        Hook prévu : <code className="text-white/80">GET/POST /api/admin/reports</code> (aligné
        admin in-app moderation).
      </AdminBanner>

      <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <AdminKpiCard label="Ouverts" value={1} accent="amber" />
        <AdminKpiCard label="En cours" value={1} accent="cyan" />
        <AdminKpiCard label="Résolus" value={1} accent="emerald" />
        <AdminKpiCard label="Total (démo)" value={MOCK.length} accent="blue" />
      </section>

      <div className="mt-6 flex flex-wrap gap-2">
        {(["all", "open", "reviewing", "resolved", "dismissed"] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide ${
              filter === id ? "bg-white text-black" : "bg-white/[0.06] text-white/60"
            }`}
          >
            {id === "all" ? "Tous" : LABELS[id]}
          </button>
        ))}
      </div>

      <AdminTableShell>
        <table className="mt-4 w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
            <tr>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Cible</th>
              <th className="px-4 py-3">Signaleur</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-white/5">
                <td className="px-4 py-3 text-white">{r.type}</td>
                <td className="px-4 py-3 font-mono text-xs text-white/55">{r.target}</td>
                <td className="px-4 py-3 text-white/70">{r.reporter}</td>
                <td className="px-4 py-3 text-white/70">{LABELS[r.status]}</td>
                <td className="px-4 py-3 text-white/50">{formatAdminDate(r.createdAt)}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className="rounded-lg border border-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/70"
                    onClick={() =>
                      window.alert("Action démo — brancher POST /api/admin/reports/:id")
                    }
                  >
                    Traiter
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableShell>
    </AdminShell>
  );
}
