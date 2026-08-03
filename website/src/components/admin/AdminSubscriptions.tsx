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

type SubStatus = "active" | "trialing" | "canceled" | "past_due";

type SubscriptionRow = {
  id: string;
  email: string;
  plan: string;
  status: SubStatus;
  mrr: number;
  renewsAt: string;
};

/** Données démo — brancher Stripe Billing / Firestore `subscriptions`. */
const MOCK: SubscriptionRow[] = [
  {
    id: "sub_1",
    email: "lea.moreau@example.com",
    plan: "Pro Joueur",
    status: "active",
    mrr: 9.99,
    renewsAt: "2026-09-01T00:00:00Z",
  },
  {
    id: "sub_2",
    email: "club.paris@example.com",
    plan: "Pro Club",
    status: "trialing",
    mrr: 49,
    renewsAt: "2026-08-15T00:00:00Z",
  },
  {
    id: "sub_3",
    email: "agent.martin@example.com",
    plan: "Pro Staff",
    status: "past_due",
    mrr: 29,
    renewsAt: "2026-08-05T00:00:00Z",
  },
];

const STATUS_LABEL: Record<SubStatus, string> = {
  active: "Actif",
  trialing: "Essai",
  canceled: "Annulé",
  past_due: "Impayé",
};

export function AdminSubscriptions() {
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return MOCK;
    return MOCK.filter(
      (r) =>
        r.email.includes(needle) ||
        r.plan.toLowerCase().includes(needle) ||
        STATUS_LABEL[r.status].toLowerCase().includes(needle),
    );
  }, [q]);

  const mrr = MOCK.filter((r) => r.status === "active" || r.status === "trialing").reduce(
    (a, r) => a + r.mrr,
    0,
  );

  return (
    <AdminShell
      title="Abonnements"
      subtitle="Plans Free / Pro. Brancher Stripe customers + invoices pour le revenu réel."
      actions={<AdminMockBadge />}
    >
      <AdminBanner tone="info">
        Hook prévu : <code className="text-white/80">GET /api/admin/subscriptions</code> → Stripe
        Billing ou collection Firestore <code className="text-white/80">subscriptions</code>.
      </AdminBanner>

      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminKpiCard label="Abonnements actifs" value={2} accent="emerald" />
        <AdminKpiCard label="MRR (démo)" value={`${mrr.toFixed(2)} €`} accent="blue" />
        <AdminKpiCard label="Impayés" value={1} accent="amber" />
      </section>

      <div className="relative mt-8 max-w-md">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher email ou plan…"
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#0054F0]/50"
        />
      </div>

      <AdminTableShell>
        <table className="mt-4 w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">MRR</th>
              <th className="px-4 py-3">Renouvellement</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-white/5">
                <td className="px-4 py-3 text-white">{r.email}</td>
                <td className="px-4 py-3 text-white/70">{r.plan}</td>
                <td className="px-4 py-3 text-white/70">{STATUS_LABEL[r.status]}</td>
                <td className="px-4 py-3 tabular-nums text-white/70">{r.mrr.toFixed(2)} €</td>
                <td className="px-4 py-3 text-white/50">{formatAdminDate(r.renewsAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableShell>
    </AdminShell>
  );
}
