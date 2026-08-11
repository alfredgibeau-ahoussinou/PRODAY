"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  AdminBanner,
  AdminEmptyState,
  AdminInput,
  AdminKpiCard,
  AdminStatusBadge,
  AdminTableShell,
  formatAdminDate,
} from "@/components/admin/adminUi";
import type { AdminPlatformSubscription } from "@/lib/adminPlatformApi";

const STATUS_LABEL: Record<string, string> = {
  active: "Actif",
  trialing: "Essai",
  canceled: "Annulé",
  past_due: "Impayé",
  none: "…",
};

type Props = {
  items: AdminPlatformSubscription[];
  proCount: number;
  activeOrTrialing: number;
  pastDue: number;
  error?: string | null;
};

export function AdminSubscriptions({
  items,
  proCount,
  activeOrTrialing,
  pastDue,
  error = null,
}: Props) {
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(
      (r) =>
        r.email.toLowerCase().includes(needle) ||
        r.plan.toLowerCase().includes(needle) ||
        (STATUS_LABEL[r.status] ?? r.status).toLowerCase().includes(needle),
    );
  }, [q, items]);

  return (
    <AdminShell
      title="Abonnements"
      subtitle="Champs Firestore `subscription_tier` / `subscription_status` (RevenueCat + stores)."
    >
      {error ? <AdminBanner tone="warning">{error}</AdminBanner> : null}
      <AdminBanner tone="info">
        Les abonnements Pro passent par App Store / Google Play via RevenueCat. Stripe reste
        réservé aux paiements ponctuels (shop, cotisations).
      </AdminBanner>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <AdminKpiCard label="Comptes Pro" value={proCount} accent="emerald" />
        <AdminKpiCard
          label="MRR store"
          value="RevenueCat"
          hint="Voir dashboard RevenueCat / App Store / Play"
          accent="blue"
        />
        <AdminKpiCard
          label="Actifs / essai (champ)"
          value={activeOrTrialing}
          hint={pastDue > 0 ? `${pastDue} impayé(s)` : undefined}
          accent="navy"
        />
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
              <th>Fin de période</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="!p-0">
                  <AdminEmptyState
                    title={
                      error
                        ? "Source abonnements indisponible"
                        : "Aucun abonnement Pro / statut renseigné"
                    }
                    description={
                      error
                        ? "Connectez websiteAdminStats."
                        : "Les comptes Free sans statut ne sont pas listés."
                    }
                  />
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
                      <AdminStatusBadge tone={tone}>
                        {STATUS_LABEL[r.status] ?? r.status}
                      </AdminStatusBadge>
                    </td>
                    <td className="tabular-nums text-white/45">…</td>
                    <td className="whitespace-nowrap text-white/45">
                      {r.renewsAt ? formatAdminDate(r.renewsAt) : "…"}
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
