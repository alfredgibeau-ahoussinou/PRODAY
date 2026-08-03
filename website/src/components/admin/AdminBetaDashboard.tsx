"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, RefreshCw, Search, X } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  AdminBanner,
  AdminKpiCard,
  AdminPanel,
  AdminTableShell,
  displayNameFromEmail,
  formatAdminDate,
} from "@/components/admin/adminUi";
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

type DecisionModal = {
  mode: "approve" | "reject" | "bulk_approve";
  ids: string[];
  label: string;
};

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
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState(initialEntries);
  const [counts, setCounts] = useState(initialCounts);
  const [error, setError] = useState<string | null>(initialError);
  const [message, setMessage] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<DecisionModal | null>(null);
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (filter !== "all" && e.status !== filter) return false;
      if (!q) return true;
      const hay = [
        e.email,
        e.name,
        e.role,
        e.role_label,
        e.admin_note,
        e.referral_code,
        STATUS_LABELS[e.status],
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [entries, filter, search]);

  const pendingVisible = useMemo(
    () => filtered.filter((e) => e.status === "pending"),
    [filtered],
  );

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllPending() {
    const ids = pendingVisible.map((e) => e.id);
    setSelected((prev) => {
      const allSelected = ids.length > 0 && ids.every((id) => prev.has(id));
      if (allSelected) {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      }
      return new Set([...prev, ...ids]);
    });
  }

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
    setSelected(new Set());
  }

  async function submitDecision() {
    if (!modal) return;
    setActionId(modal.ids[0] ?? "bulk");
    setMessage(null);
    setError(null);
    const trimmedNote = note.trim();

    try {
      if (modal.mode === "bulk_approve") {
        const res = await fetch("/api/admin/beta/bulk-approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ids: modal.ids,
            ...(trimmedNote ? { admin_note: trimmedNote } : {}),
          }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          approved?: number;
          failed?: number;
        };
        if (!res.ok) {
          setError(data.error ?? "Action impossible");
          return;
        }
        setMessage(
          `Approbation groupée : ${data.approved ?? 0} OK${
            data.failed ? `, ${data.failed} échec(s)` : ""
          }.`,
        );
      } else {
        const path =
          modal.mode === "approve"
            ? "/api/admin/beta/approve"
            : "/api/admin/beta/reject";
        const res = await fetch(path, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: modal.ids[0],
            ...(trimmedNote ? { admin_note: trimmedNote } : {}),
          }),
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
        if (data.emailSent) {
          setMessage(
            modal.mode === "approve"
              ? "Approuvé — email de bienvenue envoyé."
              : "Refusé — email de notification envoyé.",
          );
        } else if (data.emailError) {
          setMessage(`Action OK. Email non envoyé : ${data.emailError}`);
        } else {
          setMessage(
            modal.mode === "approve" ? "Inscription approuvée." : "Inscription refusée.",
          );
        }
      }
      setModal(null);
      setNote("");
      await refreshList();
    } catch {
      setError("Erreur réseau");
    } finally {
      setActionId(null);
    }
  }

  async function resendEmail(id: string, email: string) {
    if (!window.confirm(`Renvoyer l'email de bienvenue à ${email} ?`)) return;
    setActionId(id);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/beta/resend", {
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
        setError(data.error ?? "Renvoi impossible");
        return;
      }
      if (data.emailSent) setMessage("Email de bienvenue renvoyé.");
      else if (data.emailError) setMessage(`Action OK. Email : ${data.emailError}`);
      else setMessage("Action enregistrée.");
      await refreshList();
    } catch {
      setError("Erreur réseau");
    } finally {
      setActionId(null);
    }
  }

  async function runCampaignAction(
    action:
      | "broadcast_ios_pre_announcement"
      | "trigger_ios_launch"
      | "send_engagement_round",
    confirmLabel: string,
  ) {
    if (!window.confirm(confirmLabel)) return;
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/beta/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        sent?: number;
        skipped?: number;
        failed?: number;
        testflightUrl?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Action impossible");
        return;
      }
      const parts = [
        data.sent != null ? `${data.sent} envoyé(s)` : null,
        data.skipped != null ? `${data.skipped} ignoré(s)` : null,
        data.failed != null && data.failed > 0 ? `${data.failed} échec(s)` : null,
      ].filter(Boolean);
      setMessage(
        parts.length
          ? `Campagne OK — ${parts.join(", ")}.${data.testflightUrl ? ` TestFlight : ${data.testflightUrl}` : ""}`
          : "Campagne exécutée.",
      );
    } catch {
      setError("Erreur réseau");
    }
  }

  const selectedPending = [...selected].filter((id) =>
    entries.some((e) => e.id === id && e.status === "pending"),
  );

  return (
    <AdminShell
      title="Liste d’attente bêta"
      subtitle="Approuvez ou refusez les inscriptions, ajoutez une note interne, et envoyez les emails automatiquement."
      pendingBetaCount={counts.pending}
      actions={
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(() => {
              void refreshList();
            })
          }
          className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/80 transition hover:border-white/30 hover:text-white disabled:opacity-50"
        >
          <RefreshCw size={14} className={isPending ? "animate-spin" : ""} />
          Actualiser
        </button>
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(
          [
            ["pending", "En attente", counts.pending, "amber"],
            ["approved", "Approuvés", counts.approved, "emerald"],
            ["rejected", "Refusés", counts.rejected, "red"],
            ["all", "Total", counts.all, "blue"],
          ] as const
        ).map(([key, label, value, accent]) => (
          <button key={key} type="button" onClick={() => setFilter(key)} className="text-left">
            <AdminKpiCard
              label={label}
              value={value}
              accent={accent}
              hint={filter === key ? "Filtre actif" : "Cliquer pour filtrer"}
            />
          </button>
        ))}
      </div>

      <AdminPanel className="mt-8 p-5">
        <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-white">
          Campagne bêta iOS
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-white/55">
          Ouverture TestFlight le <strong className="text-white/80">11 août 2026 à 18 h</strong>.
          Emails d&apos;engagement automatiques tous les 2 jours après le lancement.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              void runCampaignAction(
                "broadcast_ios_pre_announcement",
                "Envoyer l'email d'annonce iOS (11 août 18 h) à tous les inscrits non refusés ?",
              )
            }
            className="rounded-full bg-[#0054F0] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white"
          >
            Annonce date iOS
          </button>
          <button
            type="button"
            onClick={() =>
              void runCampaignAction(
                "trigger_ios_launch",
                "Lancer la bêta iOS maintenant (emails TestFlight + marquer comme ouvert) ?",
              )
            }
            className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-emerald-200"
          >
            Ouvrir bêta iOS
          </button>
          <button
            type="button"
            onClick={() =>
              void runCampaignAction(
                "send_engagement_round",
                "Envoyer la prochaine email d'engagement (astuces / fonctionnalités) ?",
              )
            }
            className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/75"
          >
            Email engagement
          </button>
        </div>
      </AdminPanel>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher email, rôle, note…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#0054F0]/50"
          />
        </div>
        {selectedPending.length > 0 ? (
          <button
            type="button"
            onClick={() =>
              setModal({
                mode: "bulk_approve",
                ids: selectedPending,
                label: `${selectedPending.length} inscription(s)`,
              })
            }
            className="rounded-full bg-[#0054F0] px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white"
          >
            Approuver la sélection ({selectedPending.length})
          </button>
        ) : null}
      </div>

      {message ? (
        <div className="mt-4">
          <AdminBanner tone="success">{message}</AdminBanner>
        </div>
      ) : null}
      {error ? (
        <div className="mt-4">
          <AdminBanner tone="error">{error}</AdminBanner>
        </div>
      ) : null}

      <AdminTableShell>
        <table className="mt-6 w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={
                    pendingVisible.length > 0 &&
                    pendingVisible.every((e) => selected.has(e.id))
                  }
                  onChange={toggleSelectAllPending}
                  aria-label="Sélectionner les inscriptions en attente visibles"
                />
              </th>
              <th className="px-4 py-3 font-medium">Nom</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Rôle</th>
              <th className="px-4 py-3 font-medium">Inscription</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Note</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-white/45">
                  Aucune inscription dans ce filtre.
                </td>
              </tr>
            ) : (
              filtered.map((entry) => {
                const name = displayNameFromEmail(entry.email, entry.name);
                return (
                  <tr key={entry.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 align-middle">
                      {entry.status === "pending" ? (
                        <input
                          type="checkbox"
                          checked={selected.has(entry.id)}
                          onChange={() => toggleSelect(entry.id)}
                          aria-label={`Sélectionner ${entry.email}`}
                        />
                      ) : null}
                    </td>
                    <td className="px-4 py-3 font-medium text-white">{name}</td>
                    <td className="px-4 py-3 text-white/70">{entry.email}</td>
                    <td className="px-4 py-3 text-white/70">
                      {entry.role_label || entry.role || "—"}
                    </td>
                    <td className="px-4 py-3 text-white/55">
                      {formatAdminDate(entry.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          entry.status === "approved"
                            ? "bg-emerald-500/15 text-emerald-200"
                            : entry.status === "rejected"
                              ? "bg-red-500/15 text-red-200"
                              : "bg-amber-500/15 text-amber-200"
                        }`}
                      >
                        {STATUS_LABELS[entry.status]}
                      </span>
                      {entry.welcome_email_sent ? (
                        <span className="mt-1 block text-[10px] text-white/35">
                          email bienvenue OK
                        </span>
                      ) : null}
                    </td>
                    <td className="max-w-[160px] truncate px-4 py-3 text-white/45">
                      {entry.admin_note || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {entry.status === "pending" ? (
                          <>
                            <button
                              type="button"
                              disabled={actionId === entry.id}
                              onClick={() =>
                                setModal({
                                  mode: "approve",
                                  ids: [entry.id],
                                  label: entry.email,
                                })
                              }
                              className="inline-flex items-center gap-1 rounded-lg bg-[#0054F0] px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white disabled:opacity-50"
                            >
                              <Check size={12} /> Approuver
                            </button>
                            <button
                              type="button"
                              disabled={actionId === entry.id}
                              onClick={() =>
                                setModal({
                                  mode: "reject",
                                  ids: [entry.id],
                                  label: entry.email,
                                })
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/70 disabled:opacity-50"
                            >
                              <X size={12} /> Refuser
                            </button>
                          </>
                        ) : null}
                        {entry.status === "approved" ? (
                          <button
                            type="button"
                            disabled={actionId === entry.id}
                            onClick={() => void resendEmail(entry.id, entry.email)}
                            className="rounded-lg border border-white/15 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/80 disabled:opacity-50"
                          >
                            Renvoyer email
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </AdminTableShell>

      {modal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b1020] p-6 shadow-2xl">
            <h3 className="font-[family-name:var(--font-syne)] text-xl font-bold text-white">
              {modal.mode === "reject"
                ? "Refuser l’inscription"
                : modal.mode === "bulk_approve"
                  ? "Approuver la sélection"
                  : "Approuver l’inscription"}
            </h3>
            <p className="mt-2 text-sm text-white/55">{modal.label}</p>
            <label className="mt-5 block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-white/45">
                Note interne (optionnelle)
              </span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Ex. profil coach prioritaire, suivi commercial…"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#0054F0]/50"
              />
            </label>
            <p className="mt-2 text-xs text-white/40">
              {modal.mode === "reject"
                ? "Un email de refus sera envoyé automatiquement."
                : "Un email de bienvenue sera envoyé automatiquement."}{" "}
              La note n’est pas visible par l’utilisateur.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setModal(null);
                  setNote("");
                }}
                className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/70"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={Boolean(actionId)}
                onClick={() => void submitDecision()}
                className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide text-white disabled:opacity-50 ${
                  modal.mode === "reject" ? "bg-red-600" : "bg-[#0054F0]"
                }`}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
