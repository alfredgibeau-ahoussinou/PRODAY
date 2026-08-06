"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  AdminBanner,
  AdminButton,
  AdminEmptyState,
  AdminFilterChip,
  AdminKpiCard,
  AdminSectionHeading,
  AdminTableShell,
} from "@/components/admin/adminUi";
import type {
  TrafficDailyRow,
  TrafficTotals,
} from "@/lib/adminTrafficApi";

type Period = "today" | "7d" | "30d" | "all";

const PERIODS: { id: Period; label: string }[] = [
  { id: "today", label: "Aujourd’hui" },
  { id: "7d", label: "7 jours" },
  { id: "30d", label: "30 jours" },
  { id: "all", label: "Tout" },
];

function dayKeyUtc(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function sumDays(
  days: TrafficDailyRow[],
  period: Period,
): { site: number; app: number; rows: TrafficDailyRow[] } {
  if (period === "all") {
    return {
      site: days.reduce((a, d) => a + d.site_visits, 0),
      app: days.reduce((a, d) => a + d.app_opens, 0),
      rows: days,
    };
  }

  const today = dayKeyUtc();
  const cutoff = new Date();
  if (period === "7d") cutoff.setUTCDate(cutoff.getUTCDate() - 6);
  if (period === "30d") cutoff.setUTCDate(cutoff.getUTCDate() - 29);
  const minKey = period === "today" ? today : dayKeyUtc(cutoff);

  const rows = days.filter((d) => d.day_key >= minKey);
  return {
    site: rows.reduce((a, d) => a + d.site_visits, 0),
    app: rows.reduce((a, d) => a + d.app_opens, 0),
    rows,
  };
}

function formatDateFr(iso: string | null): string {
  if (!iso) return "depuis le déploiement du tracking";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "depuis le déploiement du tracking";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

function formatDayLabel(dayKey: string): string {
  const d = new Date(`${dayKey}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return dayKey;
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(d);
}

type Props = {
  initialTotals: TrafficTotals;
  initialDays: TrafficDailyRow[];
  initialError?: string | null;
};

export function AdminVisitesDashboard({
  initialTotals,
  initialDays,
  initialError = null,
}: Props) {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("7d");
  const [totals, setTotals] = useState(initialTotals);
  const [days, setDays] = useState(initialDays);
  const [error, setError] = useState<string | null>(initialError);
  const [isPending, startTransition] = useTransition();

  const aggregated = useMemo(() => sumDays(days, period), [days, period]);

  const displaySite =
    period === "all" ? totals.site_visits : aggregated.site;
  const displayApp = period === "all" ? totals.app_opens : aggregated.app;

  async function refresh() {
    setError(null);
    const res = await fetch("/api/admin/visites", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      totals?: TrafficTotals;
      days?: TrafficDailyRow[];
    };
    if (!res.ok) {
      setError(data.error ?? "Chargement impossible");
      return;
    }
    setTotals(
      data.totals ?? {
        site_visits: 0,
        app_opens: 0,
        tracking_started_at: null,
        updated_at: null,
      },
    );
    setDays(data.days ?? []);
  }

  const tableRows =
    period === "all"
      ? days
      : aggregated.rows;

  return (
    <AdminShell
      title="Visites"
      subtitle={`Sessions site et ouvertures app depuis ${formatDateFr(totals.tracking_started_at)}.`}
      actions={
        <AdminButton
          disabled={isPending}
          onClick={() =>
            startTransition(() => {
              void refresh();
            })
          }
        >
          {isPending ? "…" : "Actualiser"}
        </AdminButton>
      }
    >
      {error ? <AdminBanner tone="warning">{error}</AdminBanner> : null}

      <div className="flex flex-wrap gap-1.5">
        {PERIODS.map((p) => (
          <AdminFilterChip
            key={p.id}
            active={period === p.id}
            onClick={() => setPeriod(p.id)}
          >
            {p.label}
          </AdminFilterChip>
        ))}
      </div>

      <section className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <AdminKpiCard
          label="Visites site"
          value={displaySite}
          hint="Sessions navigateur (1 par onglet)"
          accent="navy"
        />
        <AdminKpiCard
          label="Ouvertures app"
          value={displayApp}
          hint="Cold start / lancement de l’app"
          accent="cyan"
        />
      </section>

      <section>
        <AdminSectionHeading title="Détail journalier" />
        {tableRows.length === 0 ? (
          <AdminEmptyState
            title="Aucune visite sur cette période"
            description="0 depuis le déploiement du tracking."
          />
        ) : (
          <AdminTableShell>
            <table className="min-w-[420px]">
              <thead>
                <tr>
                  <th>Jour</th>
                  <th>Site</th>
                  <th>App</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => (
                  <tr key={row.day_key}>
                    <td className="font-medium text-white">
                      {formatDayLabel(row.day_key)}
                    </td>
                    <td className="tabular-nums text-white/75">{row.site_visits}</td>
                    <td className="tabular-nums text-white/75">{row.app_opens}</td>
                    <td className="tabular-nums text-white/45">
                      {row.site_visits + row.app_opens}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTableShell>
        )}
      </section>
    </AdminShell>
  );
}
