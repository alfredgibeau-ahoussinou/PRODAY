"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  AdminButton,
  AdminEmptyState,
  AdminInput,
  AdminKpiCard,
  AdminMockBadge,
  AdminSelect,
  AdminStatusBadge,
  AdminTableShell,
} from "@/components/admin/adminUi";
import { Search, Ban, Check, Mail, User } from "lucide-react";

type UserStatus = "active" | "inactive" | "suspended";
type UserRole = "admin" | "moderator" | "user";
type Gender = "men" | "women" | "minor";
type PlayerLevel = "amateur" | "academy" | "professional";

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastLogin: string;
  /** Pôle UI — « Joueur » pour le pôle unifié (mock prototype). */
  pole?: string;
  gender?: Gender;
  playerLevel?: PlayerLevel;
}

const mockUsers: User[] = [
  {
    id: "1",
    email: "user1@example.com",
    name: "Jean Dupont",
    role: "user",
    status: "active",
    createdAt: "2024-01-15T10:30:00Z",
    lastLogin: "2024-07-26T14:20:00Z",
    pole: "Joueur",
    gender: "men",
    playerLevel: "amateur",
  },
  {
    id: "2",
    email: "user2@example.com",
    name: "Marie Martin",
    role: "moderator",
    status: "active",
    createdAt: "2024-02-20T09:15:00Z",
    lastLogin: "2024-07-25T16:45:00Z",
    pole: "Pro Staff",
  },
  {
    id: "3",
    email: "user3@example.com",
    name: "Pierre Bernard",
    role: "user",
    status: "inactive",
    createdAt: "2024-03-10T11:00:00Z",
    lastLogin: "2024-06-30T08:30:00Z",
    pole: "Santé",
  },
  {
    id: "4",
    email: "lea.moreau@example.com",
    name: "Léa Moreau",
    role: "user",
    status: "active",
    createdAt: "2024-04-02T12:00:00Z",
    lastLogin: "2024-07-28T09:10:00Z",
    pole: "Joueur",
    gender: "women",
    playerLevel: "academy",
  },
  {
    id: "5",
    email: "karim.benali@example.com",
    name: "Karim Benali",
    role: "user",
    status: "active",
    createdAt: "2024-05-18T08:40:00Z",
    lastLogin: "2024-07-29T18:00:00Z",
    pole: "Joueur",
    gender: "men",
    playerLevel: "professional",
  },
];

const STATUS_LABELS: Record<UserStatus, string> = {
  active: "Actif",
  inactive: "Inactif",
  suspended: "Suspendu",
};

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  moderator: "Modérateur",
  user: "Utilisateur",
};

const STATUS_TONES: Record<UserStatus, "success" | "neutral" | "danger"> = {
  active: "success",
  inactive: "neutral",
  suspended: "danger",
};

const GENDER_LABELS: Record<Gender, string> = {
  men: "Homme",
  women: "Femme",
  minor: "Mineur",
};

const PLAYER_LEVEL_LABELS: Record<PlayerLevel, { label: string; tone: "info" | "success" | "warning" }> = {
  amateur: { label: "Amateur", tone: "info" },
  academy: { label: "Centre de formation", tone: "success" },
  professional: { label: "Professionnel", tone: "warning" },
};

export function AdminUsers() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [isPending, startTransition] = useTransition();

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.pole?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (user.gender
        ? GENDER_LABELS[user.gender].toLowerCase().includes(searchQuery.toLowerCase())
        : false);
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleStatusChange = (userId: string, newStatus: UserStatus) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, status: newStatus } : user
      )
    );
  };

  void router;
  void isPending;
  void startTransition;

  return (
    <AdminShell
      title="Utilisateurs"
      subtitle="Comptes, rôles et suspension. Données démo — brancher GET /api/admin/users quand disponible."
      actions={<AdminMockBadge />}
    >
      {/* Hook: remplacer mockUsers par fetch('/api/admin/users') */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" size={16} />
          <AdminInput
            type="text"
            placeholder="Rechercher par email, nom, genre ou pôle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as UserStatus | "all")}
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
            <option value="suspended">Suspendu</option>
          </AdminSelect>
          <AdminSelect
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | "all")}
          >
            <option value="all">Tous les rôles</option>
            <option value="admin">Admin</option>
            <option value="moderator">Modérateur</option>
            <option value="user">Utilisateur</option>
          </AdminSelect>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <AdminKpiCard label="Total" value={users.length} accent="blue" />
        <AdminKpiCard
          label="Actifs"
          value={users.filter((u) => u.status === "active").length}
          accent="emerald"
        />
        <AdminKpiCard
          label="Inactifs"
          value={users.filter((u) => u.status === "inactive").length}
          accent="navy"
        />
        <AdminKpiCard
          label="Suspendus"
          value={users.filter((u) => u.status === "suspended").length}
          accent="red"
        />
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
                <th>Pôle</th>
                <th>Dernière connexion</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="!p-0">
                    <AdminEmptyState title="Aucun utilisateur trouvé" />
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const level = user.playerLevel
                    ? PLAYER_LEVEL_LABELS[user.playerLevel]
                    : null;
                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0054F0]/15 text-[#7AA7FF] ring-1 ring-[#0054F0]/20">
                            <User size={16} />
                          </div>
                          <div>
                            <p className="font-medium text-white">{user.name}</p>
                            <p className="text-xs text-white/45">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <AdminStatusBadge tone="neutral">
                          {ROLE_LABELS[user.role]}
                        </AdminStatusBadge>
                      </td>
                      <td className="text-white/65">
                        {user.gender ? GENDER_LABELS[user.gender] : "—"}
                      </td>
                      <td>
                        {level ? (
                          <AdminStatusBadge tone={level.tone}>{level.label}</AdminStatusBadge>
                        ) : (
                          <span className="text-white/35">—</span>
                        )}
                      </td>
                      <td>
                        <AdminStatusBadge tone={STATUS_TONES[user.status]}>
                          {STATUS_LABELS[user.status]}
                        </AdminStatusBadge>
                      </td>
                      <td className="text-white/65">{user.pole || "—"}</td>
                      <td className="whitespace-nowrap text-white/45">
                        {formatDate(user.lastLogin)}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {user.status === "active" ? (
                            <AdminButton
                              size="sm"
                              variant="ghost"
                              onClick={() => handleStatusChange(user.id, "suspended")}
                              title="Suspendre"
                              className="!px-2"
                            >
                              <Ban size={14} />
                            </AdminButton>
                          ) : (
                            <AdminButton
                              size="sm"
                              variant="ghost"
                              onClick={() => handleStatusChange(user.id, "active")}
                              title="Activer"
                              className="!px-2"
                            >
                              <Check size={14} />
                            </AdminButton>
                          )}
                          <AdminButton
                            size="sm"
                            variant="ghost"
                            title="Envoyer email"
                            className="!px-2"
                          >
                            <Mail size={14} />
                          </AdminButton>
                        </div>
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
