"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  AdminBanner,
  AdminKpiCard,
  AdminMockBadge,
  AdminTableShell,
  formatAdminDate,
} from "@/components/admin/adminUi";

type ReferralRow = {
  id: string;
  code: string;
  ownerEmail: string;
  progress: number;
  totalSubscribed: number;
  rewardsEarned: number;
  updatedAt: string;
};

/** Démo — brancher `referral_codes` + champs user `referral_*`. */
const MOCK: ReferralRow[] = [
  {
    id: "1",
    code: "ABCD2345",
    ownerEmail: "jean.dupont@example.com",
    progress: 1,
    totalSubscribed: 1,
    rewardsEarned: 0,
    updatedAt: "2026-08-01T12:00:00Z",
  },
  {
    id: "2",
    code: "PRODAY88",
    ownerEmail: "marie.martin@example.com",
    progress: 2,
    totalSubscribed: 4,
    rewardsEarned: 2,
    updatedAt: "2026-08-02T18:30:00Z",
  },
];

export function AdminReferrals() {
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return MOCK;
    return MOCK.filter(
      (r) =>
        r.code.toLowerCase().includes(needle) ||
        r.ownerEmail.toLowerCase().includes(needle),
    );
  }, [q]);

  return (
    <AdminShell
      title="Parrainage"
      subtitle="Codes, progression (2 amis = 1 mois Pro) et récompenses. Aligné Cloud Functions referral."
      actions={<AdminMockBadge />}
    >
      <AdminBanner tone="info">
        Hook prévu : <code className="text-white/80">GET /api/admin/referrals</code> → collections{" "}
        <code className="text-white/80">referral_codes</code> /{" "}
        <code className="text-white/80">referrals</code> + stats user.
      </AdminBanner>

      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminKpiCard label="Codes actifs (démo)" value={MOCK.length} accent="blue" />
        <AdminKpiCard
          label="Conversions"
          value={MOCK.reduce((a, r) => a + r.totalSubscribed, 0)}
          accent="emerald"
        />
        <AdminKpiCard
          label="Récompenses"
          value={MOCK.reduce((a, r) => a + r.rewardsEarned, 0)}
          accent="violet"
        />
      </section>

      <div className="relative mt-8 max-w-md">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher code ou email…"
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#0054F0]/50"
        />
      </div>

      <AdminTableShell>
        <table className="mt-4 w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Parrain</th>
              <th className="px-4 py-3">Progression</th>
              <th className="px-4 py-3">Abonnés</th>
              <th className="px-4 py-3">Récompenses</th>
              <th className="px-4 py-3">Maj</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-white/5">
                <td className="px-4 py-3 font-mono font-semibold text-[#4C8BFF]">{r.code}</td>
                <td className="px-4 py-3 text-white/80">{r.ownerEmail}</td>
                <td className="px-4 py-3 text-white/70">{r.progress}/2</td>
                <td className="px-4 py-3 text-white/70">{r.totalSubscribed}</td>
                <td className="px-4 py-3 text-white/70">{r.rewardsEarned}</td>
                <td className="px-4 py-3 text-white/50">{formatAdminDate(r.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableShell>
    </AdminShell>
  );
}
