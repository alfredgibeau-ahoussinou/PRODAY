"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, RefreshCw, Search, X } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  AdminBanner,
  AdminButton,
  AdminEmptyState,
  AdminInput,
  AdminKpiCard,
  AdminModal,
  AdminPanel,
  AdminSectionHeading,
  AdminStatusBadge,
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
        <AdminButton
          disabled={isPending}
          onClick={() =>
            startTransition(() => {
              void refreshList();
            })
          }
        >
          <RefreshCw size={14} className={isPending ? "animate-spin" : ""} />
          Actualiser
        </AdminButton>
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
              active={filter === key}
              hint={filter === key ? "Filtre actif" : "Cliquer pour filtrer"}
            />
          </button>
        ))}
      </div>

      <AdminPanel className="p-5 sm:p-6">
        <AdminSectionHeading
          title="Campagne bêta iOS"
          description="Ouverture TestFlight le 11 août 2026 à 18 h. Emails d'engagement automatiques tous les 2 jours après le lancement."
        />
        <div className="flex flex-wrap gap-2">
          <AdminButton
            variant="primary"
            onClick={() =>
              void runCampaignAction(
                "broadcast_ios_pre_announcement",
                "Envoyer l'email d'annonce iOS (11 août 18 h) à tous les inscrits non refusés ?",
              )
            }
          >
            Annonce date iOS
          </AdminButton>
          <AdminButton
            variant="success"
            onClick={() =>
              void runCampaignAction(
                "trigger_ios_launch",
                "Lancer la bêta iOS maintenant (emails TestFlight + marquer comme ouvert) ?",
              )
            }
          >
            Ouvrir bêta iOS
          </AdminButton>
          <AdminButton
            onClick={() =>
              void runCampaignAction(
                "send_engagement_round",
                "Envoyer la prochaine email d'engagement (astuces / fonctionnalités) ?",
              )
            }
          >
            Email engagement
          </AdminButton>
        </div>
      </AdminPanel>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35"
          />
          <AdminInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher email, rôle, note…"
            className="pl-10"
          />
        </div>
        {selectedPending.length > 0 ? (
          <AdminButton
            variant="primary"
            onClick={() =>
              setModal({
                mode: "bulk_approve",
                ids: selectedPending,
                label: `${selectedPending.length} inscription(s)`,
              })
            }
          >
            Approuver la sélection ({selectedPending.length})
          </AdminButton>
        ) : null}
      </div>

      {message ? <AdminBanner tone="success">{message}</AdminBanner> : null}
      {error ? <AdminBanner tone="error">{error}</AdminBanner> : null}

      <AdminTableShell>
        <table className="min-w-[860px]">
          <thead>
            <tr>
              <th>
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
              <th>Nom</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Inscription</th>
              <th>Statut</th>
              <th>Note</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="!p-0">
                  <AdminEmptyState
                    title="Aucune inscription dans ce filtre"
                    description="Changez de filtre ou actualisez la liste."
                  />
                </td>
              </tr>
            ) : (
              filtered.map((entry) => {
                const name = displayNameFromEmail(entry.email, entry.name);
                const statusTone =
                  entry.status === "approved"
                    ? "success"
                    : entry.status === "rejected"
                      ? "danger"
                      : "pending";
                return (
                  <tr key={entry.id}>
                    <td>
                      {entry.status === "pending" ? (
                        <input
                          type="checkbox"
                          checked={selected.has(entry.id)}
                          onChange={() => toggleSelect(entry.id)}
                          aria-label={`Sélectionner ${entry.email}`}
                        />
                      ) : null}
                    </td>
                    <td className="font-medium text-white">{name}</td>
                    <td className="text-white/65">{entry.email}</td>
                    <td className="text-white/65">
                      {entry.role_label || entry.role || "—"}
                    </td>
                    <td className="whitespace-nowrap text-white/45">
                      {formatAdminDate(entry.created_at)}
                    </td>
                    <td>
                      <AdminStatusBadge tone={statusTone}>
                        {STATUS_LABELS[entry.status]}
                      </AdminStatusBadge>
                      {entry.welcome_email_sent ? (
                        <span className="mt-1.5 block text-[10px] text-white/35">
                          email bienvenue OK
                        </span>
                      ) : null}
                    </td>
                    <td className="max-w-[160px] truncate text-white/40">
                      {entry.admin_note || "—"}
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1.5">
                        {entry.status === "pending" ? (
                          <>
                            <AdminButton
                              size="sm"
                              variant="primary"
                              disabled={actionId === entry.id}
                              onClick={() =>
                                setModal({
                                  mode: "approve",
                                  ids: [entry.id],
                                  label: entry.email,
                                })
                              }
                            >
                              <Check size={12} /> Approuver
                            </AdminButton>
                            <AdminButton
                              size="sm"
                              disabled={actionId === entry.id}
                              onClick={() =>
                                setModal({
                                  mode: "reject",
                                  ids: [entry.id],
                                  label: entry.email,
                                })
                              }
                            >
                              <X size={12} /> Refuser
                            </AdminButton>
                          </>
                        ) : null}
                        {entry.status === "approved" ? (
                          <AdminButton
                            size="sm"
                            disabled={actionId === entry.id}
                            onClick={() => void resendEmail(entry.id, entry.email)}
                          >
                            Renvoyer email
                          </AdminButton>
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
        <AdminModal
          title={
            modal.mode === "reject"
              ? "Refuser l’inscription"
              : modal.mode === "bulk_approve"
                ? "Approuver la sélection"
                : "Approuver l’inscription"
          }
          description={modal.label}
          onClose={() => {
            setModal(null);
            setNote("");
          }}
          footer={
            <>
              <AdminButton
                onClick={() => {
                  setModal(null);
                  setNote("");
                }}
              >
                Annuler
              </AdminButton>
              <AdminButton
                variant={modal.mode === "reject" ? "danger" : "primary"}
                disabled={Boolean(actionId)}
                onClick={() => void submitDecision()}
              >
                Confirmer
              </AdminButton>
            </>
          }
        >
          <label className="block">
            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">
              Note interne (optionnelle)
            </span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Ex. profil coach prioritaire, suivi commercial…"
              className="admin-field w-full rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#0054F0]/55 focus:ring-2 focus:ring-[#0054F0]/20"
            />
          </label>
          <p className="mt-3 text-xs leading-relaxed text-white/40">
            {modal.mode === "reject"
              ? "Un email de refus sera envoyé automatiquement."
              : "Un email de bienvenue sera envoyé automatiquement."}{" "}
            La note n’est pas visible par l’utilisateur.
          </p>
        </AdminModal>
      ) : null}
    </AdminShell>
  );
}
