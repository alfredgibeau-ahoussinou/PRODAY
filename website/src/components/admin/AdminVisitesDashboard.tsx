"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
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
    <main className="relative mx-auto w-full max-w-5xl px-6 py-12">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-[family-name:var(--font-syne)] text-xs font-semibold uppercase tracking-[0.22em] text-[#4C8BFF]">
            Admin · Trafic
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-bold text-white">
            Visites
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/55">
            Sessions du site proday75.fr et ouvertures de l’application.
            Compteurs réels depuis {formatDateFr(totals.tracking_started_at)}
            {" "}
            — pas d’historique avant cette date.
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <AdminNav />
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(() => {
                void refresh();
              })
            }
            className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/80 transition hover:border-white/30 hover:text-white disabled:opacity-50"
          >
            {isPending ? "…" : "Actualiser"}
          </button>
        </div>
      </header>

      {error ? (
        <p className="mt-6 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriod(p.id)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
              period === p.id
                ? "bg-white text-black"
                : "bg-white/[0.06] text-white/60 hover:text-white"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <section className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-5">
          <p className="text-xs uppercase tracking-wide text-white/45">
            Visites site
          </p>
          <p className="mt-1 font-[family-name:var(--font-syne)] text-3xl font-bold text-white">
            {displaySite}
          </p>
          <p className="mt-2 text-xs text-white/40">
            Sessions navigateur (1 par onglet)
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-5">
          <p className="text-xs uppercase tracking-wide text-white/45">
            Ouvertures app
          </p>
          <p className="mt-1 font-[family-name:var(--font-syne)] text-3xl font-bold text-white">
            {displayApp}
          </p>
          <p className="mt-2 text-xs text-white/40">
            Cold start / lancement de l’app
          </p>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-[family-name:var(--font-syne)] text-sm font-semibold uppercase tracking-[0.18em] text-white/50">
          Détail journalier
        </h2>
        {tableRows.length === 0 ? (
          <p className="mt-4 text-sm text-white/45">
            Aucune visite enregistrée sur cette période (0 depuis le
            déploiement du tracking).
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.04] text-[11px] uppercase tracking-wide text-white/45">
                  <th className="px-4 py-3 font-semibold">Jour</th>
                  <th className="px-4 py-3 font-semibold">Site</th>
                  <th className="px-4 py-3 font-semibold">App</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => (
                  <tr
                    key={row.day_key}
                    className="border-b border-white/5 text-white/80 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-white">
                      {formatDayLabel(row.day_key)}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{row.site_visits}</td>
                    <td className="px-4 py-3 tabular-nums">{row.app_opens}</td>
                    <td className="px-4 py-3 tabular-nums text-white/55">
                      {row.site_visits + row.app_opens}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
