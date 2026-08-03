"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  AdminBanner,
  AdminEmptyState,
  AdminInput,
  AdminKpiCard,
  AdminMockBadge,
  AdminStatusBadge,
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

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <AdminKpiCard label="Abonnements actifs" value={2} accent="emerald" />
        <AdminKpiCard label="MRR (démo)" value={`${mrr.toFixed(2)} €`} accent="blue" />
        <AdminKpiCard label="Impayés" value={1} accent="amber" />
      </section>

      <div className="relative max-w-md">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35"
        />
        <AdminInput
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher email ou plan…"
          className="pl-10"
        />
      </div>

      <AdminTableShell>
        <table className="min-w-[720px]">
          <thead>
            <tr>
              <th>Email</th>
              <th>Plan</th>
              <th>Statut</th>
              <th>MRR</th>
              <th>Renouvellement</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="!p-0">
                  <AdminEmptyState title="Aucun abonnement" />
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const tone =
                  r.status === "active"
                    ? "success"
                    : r.status === "trialing"
                      ? "info"
                      : r.status === "past_due"
                        ? "warning"
                        : "neutral";
                return (
                  <tr key={r.id}>
                    <td className="font-medium text-white">{r.email}</td>
                    <td className="text-white/65">{r.plan}</td>
                    <td>
                      <AdminStatusBadge tone={tone}>{STATUS_LABEL[r.status]}</AdminStatusBadge>
                    </td>
                    <td className="tabular-nums text-white/65">{r.mrr.toFixed(2)} €</td>
                    <td className="whitespace-nowrap text-white/45">
                      {formatAdminDate(r.renewsAt)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </AdminTableShell>
    </AdminShell>
  );
}
