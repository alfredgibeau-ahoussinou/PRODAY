"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { Search, Filter, MoreVertical, Edit, Ban, Check, Mail, Calendar, User } from "lucide-react";

type UserStatus = "active" | "inactive" | "suspended";
type UserRole = "admin" | "moderator" | "user";

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastLogin: string;
  pole?: string;
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
    pole: "joueur",
  },
  {
    id: "2",
    email: "user2@example.com",
    name: "Marie Martin",
    role: "moderator",
    status: "active",
    createdAt: "2024-02-20T09:15:00Z",
    lastLogin: "2024-07-25T16:45:00Z",
    pole: "pro",
  },
  {
    id: "3",
    email: "user3@example.com",
    name: "Pierre Bernard",
    role: "user",
    status: "inactive",
    createdAt: "2024-03-10T11:00:00Z",
    lastLogin: "2024-06-30T08:30:00Z",
    pole: "sante",
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

const STATUS_COLORS: Record<UserStatus, string> = {
  active: "text-green-400 bg-green-500/20",
  inactive: "text-gray-400 bg-gray-500/20",
  suspended: "text-red-400 bg-red-500/20",
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
      user.name.toLowerCase().includes(searchQuery.toLowerCase());
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

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, role: newRole } : user
      )
    );
  };

  return (
    <main className="relative mx-auto w-full max-w-7xl px-6 py-12">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-[family-name:var(--font-syne)] text-xs font-semibold uppercase tracking-[0.22em] text-[#4C8BFF]">
            Admin · Utilisateurs
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-bold text-white">
            Gestion des utilisateurs
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/55">
            Gérez les comptes utilisateurs, les rôles et les statuts.
          </p>
        </div>
        <AdminNav />
      </header>

      {/* Filtres et recherche */}
      <section className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <input
            type="text"
            placeholder="Rechercher par email ou nom..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-white placeholder:text-white/40 focus:border-white/20 focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as UserStatus | "all")}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-white/20 focus:outline-none"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
            <option value="suspended">Suspendu</option>
          </select>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | "all")}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-white/20 focus:outline-none"
          >
            <option value="all">Tous les rôles</option>
            <option value="admin">Admin</option>
            <option value="moderator">Modérateur</option>
            <option value="user">Utilisateur</option>
          </select>
        </div>
      </section>

      {/* Statistiques rapides */}
      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm text-white/60">Total utilisateurs</p>
          <p className="mt-2 font-display text-2xl font-bold text-white">{users.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm text-white/60">Actifs</p>
          <p className="mt-2 font-display text-2xl font-bold text-green-400">
            {users.filter((u) => u.status === "active").length}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm text-white/60">Inactifs</p>
          <p className="mt-2 font-display text-2xl font-bold text-gray-400">
            {users.filter((u) => u.status === "inactive").length}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm text-white/60">Suspendus</p>
          <p className="mt-2 font-display text-2xl font-bold text-red-400">
            {users.filter((u) => u.status === "suspended").length}
          </p>
        </div>
      </section>

      {/* Tableau des utilisateurs */}
      <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
                  Utilisateur
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
                  Rôle
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
                  Statut
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
                  Pôle
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
                  Dernière connexion
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-white/60">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-white/40">
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-white/5 last:border-0">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-white">
                          <User size={18} />
                        </div>
                        <div>
                          <p className="font-medium text-white">{user.name}</p>
                          <p className="text-sm text-white/60">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white">
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[user.status]}`}
                      >
                        {STATUS_LABELS[user.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-white/80 capitalize">
                        {user.pole || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-white/60">
                        {formatDate(user.lastLogin)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {user.status === "active" ? (
                          <button
                            onClick={() => handleStatusChange(user.id, "suspended")}
                            className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-red-400"
                            title="Suspendre"
                          >
                            <Ban size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(user.id, "active")}
                            className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-green-400"
                            title="Activer"
                          >
                            <Check size={16} />
                          </button>
                        )}
                        <button
                          className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                          title="Envoyer email"
                        >
                          <Mail size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
