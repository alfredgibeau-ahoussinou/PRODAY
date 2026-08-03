"use client";

import { useMemo, useState } from "react";
import { Eye, Smartphone, Globe } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  AdminBanner,
  AdminEmptyState,
  AdminFilterChip,
  AdminKpiCard,
  AdminPanel,
  AdminSectionHeading,
  AdminTableShell,
} from "@/components/admin/adminUi";
import type { TrafficDailyRow, TrafficTotals } from "@/lib/adminTrafficApi";

type Period = "7d" | "30d" | "90d" | "all";

function dayKeyUtc(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function filterDays(days: TrafficDailyRow[], period: Period): TrafficDailyRow[] {
  if (period === "all") return days;
  const cutoff = new Date();
  if (period === "7d") cutoff.setUTCDate(cutoff.getUTCDate() - 6);
  if (period === "30d") cutoff.setUTCDate(cutoff.getUTCDate() - 29);
  if (period === "90d") cutoff.setUTCDate(cutoff.getUTCDate() - 89);
  const minKey = dayKeyUtc(cutoff);
  return days.filter((d) => d.day_key >= minKey);
}

type Props = {
  totals: TrafficTotals;
  days: TrafficDailyRow[];
  userTotal: number | null;
  proCount: number | null;
  trafficError?: string | null;
  platformError?: string | null;
};

export function AdminAnalytics({
  totals,
  days,
  userTotal,
  proCount,
  trafficError = null,
  platformError = null,
}: Props) {
  const [period, setPeriod] = useState<Period>("7d");
  const rows = useMemo(() => filterDays(days, period), [days, period]);
  const sitePeriod = rows.reduce((a, d) => a + d.site_visits, 0);
  const appPeriod = rows.reduce((a, d) => a + d.app_opens, 0);
  const chartRows = useMemo(
    () => [...rows].sort((a, b) => a.day_key.localeCompare(b.day_key)),
    [rows],
  );
  const maxBar = Math.max(
    1,
    ...chartRows.map((d) => d.site_visits + d.app_opens),
  );

  return (
    <AdminShell
      title="Analytics"
      subtitle="Uniquement le trafic suivi (site / app) et les comptes Firestore. Pas de métriques inventées."
    >
      {trafficError ? <AdminBanner tone="warning">Trafic : {trafficError}</AdminBanner> : null}
      {platformError ? (
        <AdminBanner tone="warning">Plateforme : {platformError}</AdminBanner>
      ) : null}

      <section className="flex flex-wrap gap-2">
        {(
          [
            ["7d", "7 jours"],
            ["30d", "30 jours"],
            ["90d", "90 jours"],
            ["all", "Tout"],
          ] as const
        ).map(([id, label]) => (
          <AdminFilterChip
            key={id}
            active={period === id}
            onClick={() => setPeriod(id)}
          >
            {label}
          </AdminFilterChip>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminKpiCard
          label="Visites site (période)"
          value={sitePeriod}
          hint={`${totals.site_visits} au total`}
          accent="blue"
        />
        <AdminKpiCard
          label="Ouvertures app (période)"
          value={appPeriod}
          hint={`${totals.app_opens} au total`}
          accent="cyan"
        />
        <AdminKpiCard
          label="Comptes utilisateurs"
          value={userTotal == null ? "—" : userTotal}
          hint={userTotal == null ? "Non disponible" : "Firestore"}
          accent="navy"
        />
        <AdminKpiCard
          label="Comptes Pro"
          value={proCount == null ? "—" : proCount}
          hint={proCount == null ? "Non disponible" : "subscription_tier"}
          accent="emerald"
        />
      </section>

      <AdminBanner tone="info">
        Durée de session, taux de rebond, sources et appareils ne sont pas trackés —
        cartes retirées (plus de valeurs démo).
      </AdminBanner>

      <section>
        <AdminSectionHeading
          title="Évolution journalière"
          description="Données `traffic_stats_daily`."
        />
        {chartRows.length === 0 ? (
          <AdminPanel className="p-0">
            <AdminEmptyState
              title="Pas encore de série journalière"
              description="Les compteurs démarrent avec recordTrafficVisit."
            />
          </AdminPanel>
        ) : (
          <AdminPanel className="p-6">
            <div className="flex h-48 items-end gap-1.5">
              {chartRows.map((stat) => {
                const total = stat.site_visits + stat.app_opens;
                const height = Math.max(4, (total / maxBar) * 100);
                const siteShare =
                  total > 0 ? (stat.site_visits / total) * 100 : 50;
                return (
                  <div
                    key={stat.day_key}
                    className="flex flex-1 flex-col items-center gap-2"
                    title={`${stat.day_key}: ${stat.site_visits} site · ${stat.app_opens} app`}
                  >
                    <div
                      className="flex w-full flex-col justify-end overflow-hidden rounded-t bg-white/5"
                      style={{ height: `${height}%` }}
                    >
                      <div
                        className="w-full bg-blue-500/70"
                        style={{ height: `${siteShare}%` }}
                      />
                      <div
                        className="w-full bg-cyan-500/60"
                        style={{ height: `${100 - siteShare}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-white/35">
                      {stat.day_key.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <Globe size={12} className="text-blue-400" />
                <span className="text-xs text-white/55">Site</span>
              </div>
              <div className="flex items-center gap-2">
                <Smartphone size={12} className="text-cyan-400" />
                <span className="text-xs text-white/55">App</span>
              </div>
            </div>
          </AdminPanel>
        )}
      </section>

      <section>
        <AdminSectionHeading title="Détail par jour" />
        <AdminTableShell>
          <table className="min-w-[520px]">
            <thead>
              <tr>
                <th>Jour</th>
                <th>Site</th>
                <th>App</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="!p-0">
                    <AdminEmptyState title="Aucune donnée" />
                  </td>
                </tr>
              ) : (
                [...rows]
                  .sort((a, b) => b.day_key.localeCompare(a.day_key))
                  .map((d) => (
                    <tr key={d.day_key}>
                      <td className="text-white">{d.day_key}</td>
                      <td className="tabular-nums text-white/70">{d.site_visits}</td>
                      <td className="tabular-nums text-white/70">{d.app_opens}</td>
                      <td className="tabular-nums text-white/50">
                        {d.site_visits + d.app_opens}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </AdminTableShell>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <AdminPanel className="flex items-center gap-3 p-5">
          <Eye className="text-[#7AA7FF]" size={18} />
          <div>
            <p className="text-sm text-white/50">Total site (depuis tracking)</p>
            <p className="font-display text-xl font-semibold text-white">
              {totals.site_visits.toLocaleString("fr-FR")}
            </p>
          </div>
        </AdminPanel>
        <AdminPanel className="flex items-center gap-3 p-5">
          <Smartphone className="text-cyan-300" size={18} />
          <div>
            <p className="text-sm text-white/50">Total ouvertures app</p>
            <p className="font-display text-xl font-semibold text-white">
              {totals.app_opens.toLocaleString("fr-FR")}
            </p>
          </div>
        </AdminPanel>
      </section>
    </AdminShell>
  );
}
