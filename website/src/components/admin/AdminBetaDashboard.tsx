"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  BetaAdminCounts,
  BetaAdminStatus,
  BetaAdminWaitlistEntry,
} from "@/lib/adminBetaApi";

type Filter = "pending" | "approved" | "rejected" | "all";

const STATUS_LABELS: Record<BetaAdminStatus, string> = {
  pending: "En attente",
  approved: "Approuvé",
  rejected: "Refusé",
};

const FILTERS: { id: Filter; label: string }[] = [
  { id: "pending", label: "En attente" },
  { id: "approved", label: "Approuvés" },
  { id: "rejected", label: "Refusés" },
  { id: "all", label: "Tous" },
];

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

type Props = {
  initialEntries: BetaAdminWaitlistEntry[];
  initialCounts: BetaAdminCounts;
  initialError?: string | null;
};

export function AdminBetaDashboard({
  initialEntries,
  initialCounts,
  initialError = null,
}: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("pending");
  const [entries, setEntries] = useState(initialEntries);
  const [counts, setCounts] = useState(initialCounts);
  const [error, setError] = useState<string | null>(initialError);
  const [message, setMessage] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (filter === "all") return entries;
    return entries.filter((e) => e.status === filter);
  }, [entries, filter]);

  async function refreshList() {
    setError(null);
    const res = await fetch("/api/admin/beta/waitlist", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      entries?: BetaAdminWaitlistEntry[];
      counts?: BetaAdminCounts;
    };
    if (!res.ok) {
      setError(data.error ?? "Chargement impossible");
      return;
    }
    setEntries(data.entries ?? []);
    setCounts(data.counts ?? { all: 0, pending: 0, approved: 0, rejected: 0 });
  }

  async function runAction(
    id: string,
    path: "/api/admin/beta/approve" | "/api/admin/beta/reject" | "/api/admin/beta/resend",
    confirmLabel: string,
  ) {
    if (!window.confirm(confirmLabel)) return;
    setActionId(id);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        emailSent?: boolean;
        emailError?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Action impossible");
        return;
      }
      if (path.includes("approve") || path.includes("resend")) {
        if (data.emailSent) {
          setMessage("Email de bienvenue envoyé.");
        } else if (data.emailError) {
          setMessage(`Action OK. email non envoyé : ${data.emailError}`);
        } else {
          setMessage("Action enregistrée.");
        }
      } else {
        setMessage("Inscription refusée.");
      }
      await refreshList();
    } catch {
      setError("Erreur réseau");
    } finally {
      setActionId(null);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <main className="relative mx-auto w-full max-w-5xl px-6 py-12">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-[family-name:var(--font-syne)] text-xs font-semibold uppercase tracking-[0.22em] text-[#4C8BFF]">
            Admin · Bêta
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-bold text-white">
            Liste d&apos;attente
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/55">
            Approuvez ou refusez les inscriptions, renvoyez l&apos;email de
            bienvenue. Réservé aux fondateurs.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(() => {
                void refreshList();
              })
            }
            className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/80 transition hover:border-white/30 hover:text-white disabled:opacity-50"
          >
            {isPending ? "…" : "Actualiser"}
          </button>
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/50 transition hover:border-white/25 hover:text-white/80"
          >
            Quitter
          </button>
        </div>
      </header>

      <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ["pending", "En attente", counts.pending],
            ["approved", "Approuvés", counts.approved],
            ["rejected", "Refusés", counts.rejected],
            ["all", "Total", counts.all],
          ] as const
        ).map(([key, label, value]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-2xl border px-4 py-4 text-left transition ${
              filter === key
                ? "border-[#0054F0]/50 bg-[#0054F0]/15"
                : "border-white/10 bg-white/[0.03] hover:border-white/20"
            }`}
          >
            <p className="text-xs uppercase tracking-wide text-white/45">{label}</p>
            <p className="mt-1 font-[family-name:var(--font-syne)] text-2xl font-bold text-white">
              {value}
            </p>
          </button>
        ))}
      </section>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
              filter === f.id
                ? "bg-white text-black"
                : "bg-white/[0.06] text-white/60 hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {message ? (
        <p className="mt-6 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <section className="mt-8 space-y-3">
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-white/45">
            Aucune inscription dans ce filtre.
          </p>
        ) : (
          filtered.map((entry) => (
            <article
              key={entry.id}
              className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-white">{entry.email}</p>
                <p className="mt-1 text-xs text-white/45">
                  {entry.role_label || entry.role || "Profil inconnu"} ·{" "}
                  {formatDate(entry.created_at)} ·{" "}
                  <span
                    className={
                      entry.status === "approved"
                        ? "text-emerald-300"
                        : entry.status === "rejected"
                          ? "text-red-300"
                          : "text-amber-200"
                    }
                  >
                    {STATUS_LABELS[entry.status]}
                  </span>
                  {entry.welcome_email_sent ? " · email envoyé" : null}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {entry.status === "pending" ? (
                  <>
                    <button
                      type="button"
                      disabled={actionId === entry.id}
                      onClick={() =>
                        void runAction(
                          entry.id,
                          "/api/admin/beta/approve",
                          `Approuver ${entry.email} et envoyer l'email de bienvenue ?`,
                        )
                      }
                      className="rounded-full bg-[#0054F0] px-3.5 py-2 text-xs font-bold uppercase tracking-wide text-white disabled:opacity-50"
                    >
                      Approuver
                    </button>
                    <button
                      type="button"
                      disabled={actionId === entry.id}
                      onClick={() =>
                        void runAction(
                          entry.id,
                          "/api/admin/beta/reject",
                          `Refuser ${entry.email} ?`,
                        )
                      }
                      className="rounded-full border border-white/15 px-3.5 py-2 text-xs font-semibold uppercase tracking-wide text-white/70 disabled:opacity-50"
                    >
                      Refuser
                    </button>
                  </>
                ) : null}
                {entry.status === "approved" ? (
                  <button
                    type="button"
                    disabled={actionId === entry.id}
                    onClick={() =>
                      void runAction(
                        entry.id,
                        "/api/admin/beta/resend",
                        `Renvoyer l'email de bienvenue à ${entry.email} ?`,
                      )
                    }
                    className="rounded-full border border-white/15 px-3.5 py-2 text-xs font-semibold uppercase tracking-wide text-white/80 disabled:opacity-50"
                  >
                    Renvoyer email
                  </button>
                ) : null}
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
