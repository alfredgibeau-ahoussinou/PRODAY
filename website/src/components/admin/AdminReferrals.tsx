"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  AdminBanner,
  AdminEmptyState,
  AdminInput,
  AdminKpiCard,
  AdminTableShell,
  formatAdminDate,
} from "@/components/admin/adminUi";
import type { AdminPlatformReferral } from "@/lib/adminPlatformApi";

type Props = {
  items: AdminPlatformReferral[];
  codes: number;
  totalSubscribed: number;
  rewardsEarned: number;
  error?: string | null;
};

export function AdminReferrals({
  items,
  codes,
  totalSubscribed,
  rewardsEarned,
  error = null,
}: Props) {
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(
      (r) =>
        r.code.toLowerCase().includes(needle) ||
        r.ownerEmail.toLowerCase().includes(needle),
    );
  }, [q, items]);

  return (
    <AdminShell
      title="Parrainage"
      subtitle="Codes et stats depuis les champs user `referral_*` (Firestore)."
    >
      {error ? <AdminBanner tone="warning">{error}</AdminBanner> : null}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <AdminKpiCard label="Codes actifs" value={codes} accent="blue" />
        <AdminKpiCard label="Conversions" value={totalSubscribed} accent="emerald" />
        <AdminKpiCard label="Récompenses" value={rewardsEarned} accent="navy" />
      </section>

      <div className="relative max-w-md">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35"
        />
        <AdminInput
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher code ou email…"
          className="pl-10"
        />
      </div>

      <AdminTableShell>
        <table className="min-w-[760px]">
          <thead>
            <tr>
              <th>Code</th>
              <th>Parrain</th>
              <th>Progression</th>
              <th>Abonnés</th>
              <th>Récompenses</th>
              <th>Maj</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="!p-0">
                  <AdminEmptyState
                    title={
                      error
                        ? "Source parrainage indisponible"
                        : "Aucun code de parrainage"
                    }
                    description={
                      error
                        ? "Connectez websiteAdminStats."
                        : "Les codes apparaissent dès qu’un utilisateur en a un."
                    }
                  />
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono font-semibold text-[#7AA7FF]">{r.code}</td>
                  <td className="text-white/70">{r.ownerEmail}</td>
                  <td className="text-white/65">{r.progress}/2</td>
                  <td className="text-white/65">{r.totalSubscribed}</td>
                  <td className="text-white/65">{r.rewardsEarned}</td>
                  <td className="whitespace-nowrap text-white/45">
                    {r.updatedAt ? formatAdminDate(r.updatedAt) : "…"}
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
