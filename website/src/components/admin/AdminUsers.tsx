"use client";

import { useMemo, useState } from "react";
import { Search, User } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  AdminBanner,
  AdminEmptyState,
  AdminInput,
  AdminKpiCard,
  AdminSelect,
  AdminStatusBadge,
  AdminTableShell,
} from "@/components/admin/adminUi";
import type { AdminPlatformUser } from "@/lib/adminPlatformApi";

const ROLE_LABELS: Record<string, string> = {
  player: "Joueur",
  coach: "Coach",
  club: "Club",
  agent: "Agent",
  recruiter: "Recruteur",
  organizer: "Organisateur",
  sponsor: "Sponsor",
  supporter: "Supporter",
  physio: "Santé",
};

const GENDER_LABELS: Record<string, string> = {
  men: "Homme",
  women: "Femme",
  minor: "Mineur",
};

const PLAYER_LEVEL_LABELS: Record<
  string,
  { label: string; tone: "info" | "success" | "warning" }
> = {
  amateur: { label: "Amateur", tone: "info" },
  academy: { label: "Centre de formation", tone: "success" },
  professional: { label: "Professionnel", tone: "warning" },
};

type Props = {
  users: AdminPlatformUser[];
  totals: { total: number; active: number; inactive: number };
  byRole: Record<string, number>;
  error?: string | null;
  truncated?: boolean;
};

export function AdminUsers({
  users,
  totals,
  byRole,
  error = null,
  truncated = false,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    "all",
  );
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const roles = useMemo(
    () => Object.keys(byRole).sort((a, b) => a.localeCompare(b)),
    [byRole],
  );

  const filteredUsers = users.filter((user) => {
    const q = searchQuery.toLowerCase();
    const roleLabel = ROLE_LABELS[user.role] ?? user.role;
    const matchesSearch =
      !q ||
      user.email.toLowerCase().includes(q) ||
      user.name.toLowerCase().includes(q) ||
      roleLabel.toLowerCase().includes(q) ||
      (user.gender
        ? (GENDER_LABELS[user.gender] ?? user.gender).toLowerCase().includes(q)
        : false);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? user.is_active : !user.is_active);
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "…";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <AdminShell
      title="Utilisateurs"
      subtitle="Comptes Firestore (lecture seule). Pas de données démo."
    >
      {error ? <AdminBanner tone="warning">{error}</AdminBanner> : null}
      {truncated ? (
        <AdminBanner tone="info">
          Scan plafonné : les totaux reflètent les {totals.total} derniers profils
          lus.
        </AdminBanner>
      ) : null}

      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" size={16} />
          <AdminInput
            type="text"
            placeholder="Rechercher par email, nom, genre ou rôle…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminSelect
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | "active" | "inactive")
            }
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
          </AdminSelect>
          <AdminSelect
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">Tous les rôles</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role] ?? role} ({byRole[role]})
              </option>
            ))}
          </AdminSelect>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <AdminKpiCard label="Total" value={totals.total} accent="blue" />
        <AdminKpiCard label="Actifs" value={totals.active} accent="emerald" />
        <AdminKpiCard label="Inactifs" value={totals.inactive} accent="navy" />
      </section>

      <AdminTableShell>
        <table className="min-w-[960px]">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Rôle</th>
              <th>Genre</th>
              <th>Badge</th>
              <th>Statut</th>
              <th>Abonnement</th>
              <th>Dernière activité</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="!p-0">
                  <AdminEmptyState
                    title={
                      error
                        ? "Impossible de charger les utilisateurs"
                        : users.length === 0
                          ? "Aucun utilisateur"
                          : "Aucun résultat"
                    }
                    description={
                      error
                        ? "Vérifiez websiteAdminStats et BETA_WEBSITE_ADMIN_SECRET."
                        : undefined
                    }
                  />
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const level = user.player_level
                  ? PLAYER_LEVEL_LABELS[user.player_level]
                  : null;
                return (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-[var(--proday-accent)]/25 bg-[var(--proday-accent-muted)] text-[var(--proday-accent-bright)]">
                          <User size={14} />
                        </div>
                        <div>
                          <p className="font-medium text-white">{user.name}</p>
                          <p className="text-xs text-white/45">{user.email || "…"}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <AdminStatusBadge tone="neutral">
                        {ROLE_LABELS[user.role] ?? user.role}
                      </AdminStatusBadge>
                    </td>
                    <td className="text-white/65">
                      {user.gender
                        ? (GENDER_LABELS[user.gender] ?? user.gender)
                        : "…"}
                    </td>
                    <td>
                      {level ? (
                        <AdminStatusBadge tone={level.tone}>{level.label}</AdminStatusBadge>
                      ) : (
                        <span className="text-white/35">…</span>
                      )}
                    </td>
                    <td>
                      <AdminStatusBadge tone={user.is_active ? "success" : "neutral"}>
                        {user.is_active ? "Actif" : "Inactif"}
                      </AdminStatusBadge>
                    </td>
                    <td className="text-white/65">
                      {user.subscription_tier === "pro"
                        ? `Pro${user.subscription_status ? ` · ${user.subscription_status}` : ""}`
                        : "Gratuit"}
                    </td>
                    <td className="whitespace-nowrap text-white/45">
                      {formatDate(user.last_active_at)}
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
