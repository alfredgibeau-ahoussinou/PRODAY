"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AccShell } from "@/components/admin/cc/AccShell";
import {
  AccBanner,
  AccEmpty,
  AccInput,
  AccMetric,
  AccPanel,
  AccSelect,
  AccStatus,
  AccTable,
} from "@/components/admin/cc/AccUi";
import type { AdminPlatformUser } from "@/lib/adminPlatformApi";

const ROLE_LABELS: Record<string, string> = {
  player: "Joueur",
  coach: "Coach",
  club: "Club / Président",
  agent: "Agent",
  recruiter: "Recruteur",
  organizer: "Organisateur",
  sponsor: "Sponsor",
  supporter: "Supporter",
  parent: "Parent",
};

type Props = {
  users: AdminPlatformUser[];
  totals: { total: number; active: number; inactive: number };
  byRole: Record<string, number>;
  error?: string | null;
  truncated?: boolean;
  badges?: { pendingBeta?: number; pastDue?: number; actionRequired?: number };
  healthScore?: number | null;
  healthLabel?: string | null;
  initialRole?: string;
};

export function AccUsersPanel({
  users,
  totals,
  byRole,
  error = null,
  truncated = false,
  badges,
  healthScore = null,
  healthLabel = null,
  initialRole = "all",
}: Props) {
  const searchParams = useSearchParams();
  const roleFromUrl = searchParams.get("role") || initialRole;
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [roleFilter, setRoleFilter] = useState(roleFromUrl);

  const roles = useMemo(
    () => Object.keys(byRole).sort((a, b) => a.localeCompare(b)),
    [byRole],
  );

  const filtered = users.filter((user) => {
    const q = searchQuery.toLowerCase();
    const roleLabel = ROLE_LABELS[user.role] ?? user.role;
    const matchesSearch =
      !q ||
      user.email.toLowerCase().includes(q) ||
      user.name.toLowerCase().includes(q) ||
      roleLabel.toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? user.is_active : !user.is_active);
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  return (
    <AccShell
      title="Utilisateurs"
      subtitle="Comptes Firestore via websiteAdminStats — filtres par rôle / statut."
      badges={badges}
      healthScore={healthScore}
      healthLabel={healthLabel}
    >
      {error ? <AccBanner tone="warning">{error}</AccBanner> : null}
      {truncated ? (
        <AccBanner tone="info">Échantillon tronqué côté Cloud Function.</AccBanner>
      ) : null}

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <AccMetric label="Total" value={totals.total} tone="blue" />
        <AccMetric label="Actifs" value={totals.active} tone="teal" />
        <AccMetric label="Inactifs" value={totals.inactive} />
        <AccMetric label="Affichés" value={filtered.length} hint={`${users.length} chargés`} />
      </div>

      <AccPanel title="Filtres">
        <div className="grid gap-2 sm:grid-cols-3">
          <AccInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher email, nom, rôle…"
          />
          <AccSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          >
            <option value="all">Tous statuts</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </AccSelect>
          <AccSelect value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">Tous rôles</option>
            {roles.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r] ?? r} ({byRole[r]})
              </option>
            ))}
          </AccSelect>
        </div>
      </AccPanel>

      <AccPanel title="Annuaire" className="overflow-hidden" bodyClassName="p-0">
        {filtered.length === 0 ? (
          <AccEmpty title="Aucun utilisateur" description="Ajustez les filtres ou vérifiez l’API plateforme." />
        ) : (
          <AccTable>
            <table>
              <thead>
                <tr>
                  <th>Identité</th>
                  <th>Rôle</th>
                  <th>Tier</th>
                  <th>Statut</th>
                  <th>Dernière activité</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <p className="text-white/85">{u.name || "—"}</p>
                      <p className="font-mono text-[11px] text-white/35">{u.email}</p>
                    </td>
                    <td>{ROLE_LABELS[u.role] ?? u.role}</td>
                    <td className="font-mono text-[11px]">{u.subscription_tier ?? "—"}</td>
                    <td>
                      <AccStatus tone={u.is_active ? "success" : "neutral"}>
                        {u.is_active ? "Actif" : "Inactif"}
                      </AccStatus>
                    </td>
                    <td className="font-mono text-[11px] text-white/40">
                      {u.last_active_at
                        ? new Date(u.last_active_at).toLocaleDateString("fr-FR")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AccTable>
        )}
      </AccPanel>
    </AccShell>
  );
}
