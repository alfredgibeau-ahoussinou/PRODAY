"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { Modal } from "@/components/admin/Modal";
import { ToastContainer, useToast, toast } from "@/components/admin/Toast";
import { Search, Filter, MoreVertical, Edit, Ban, Check, Mail, Calendar, User, Trash2, Download, RefreshCw } from "lucide-react";

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
  const { toasts, removeToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [isPending, startTransition] = useTransition();
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    const user = users.find(u => u.id === userId);
    toast(
      `${user?.name} est maintenant ${STATUS_LABELS[newStatus]}`,
      newStatus === "active" ? "success" : "warning"
    );
  };

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, role: newRole } : user
      )
    );
    const user = users.find(u => u.id === userId);
    toast(`Rôle de ${user?.name} changé en ${ROLE_LABELS[newRole]}`, "success");
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      toast(`${userToDelete.name} a été supprimé`, "error");
      setDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditModalOpen(true);
  };

  const handleBulkAction = (action: "activate" | "suspend" | "delete") => {
    if (selectedUsers.size === 0) {
      toast("Sélectionnez au moins un utilisateur", "warning");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setUsers((prev) =>
        prev.map((user) => {
          if (selectedUsers.has(user.id)) {
            if (action === "delete") return null;
            if (action === "activate") return { ...user, status: "active" };
            if (action === "suspend") return { ...user, status: "suspended" };
          }
          return user;
        }).filter(Boolean) as User[]
      );
      setSelectedUsers(new Set());
      setIsLoading(false);
      toast(
        `${selectedUsers.size} utilisateur(s) ${action === "delete" ? "supprimé(s)" : action === "activate" ? "activé(s)" : "suspendu(s)"}`,
        action === "delete" ? "error" : "success"
      );
    }, 500);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast("Données actualisées", "success");
    }, 1000);
  };

  return (
    <>
      <ToastContainer toasts={toasts} onClose={removeToast} />
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
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
              title="Actualiser"
            >
              <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
            </button>
            <AdminNav />
          </div>
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
            className="w-full rounded-full border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-white placeholder:text-white/40 focus:border-white/20 focus:outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as UserStatus | "all")}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-white/20 focus:outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
            <option value="suspended">Suspendu</option>
          </select>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | "all")}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-white/20 focus:outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">Tous les rôles</option>
            <option value="admin">Admin</option>
            <option value="moderator">Modérateur</option>
            <option value="user">Utilisateur</option>
          </select>
        </div>
      </section>

      {/* Actions groupées */}
      {selectedUsers.size > 0 && (
        <section className="mt-6 flex items-center justify-between rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 animate-in slide-in-from-top-2 duration-300">
          <p className="text-sm font-medium text-white">
            {selectedUsers.size} utilisateur(s) sélectionné(s)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction("activate")}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-full bg-green-500/20 px-3 py-1.5 text-sm font-semibold text-green-400 transition hover:bg-green-500/30 disabled:opacity-50"
            >
              <Check size={16} />
              Activer
            </button>
            <button
              onClick={() => handleBulkAction("suspend")}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-full bg-amber-500/20 px-3 py-1.5 text-sm font-semibold text-amber-400 transition hover:bg-amber-500/30 disabled:opacity-50"
            >
              <Ban size={16} />
              Suspendre
            </button>
            <button
              onClick={() => handleBulkAction("delete")}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-full bg-red-500/20 px-3 py-1.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/30 disabled:opacity-50"
            >
              <Trash2 size={16} />
              Supprimer
            </button>
          </div>
        </section>
      )}

      {/* Statistiques rapides */}
      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          { label: "Total utilisateurs", value: users.length, color: "text-white" },
          { label: "Actifs", value: users.filter((u) => u.status === "active").length, color: "text-green-400" },
          { label: "Inactifs", value: users.filter((u) => u.status === "inactive").length, color: "text-gray-400" },
          { label: "Suspendus", value: users.filter((u) => u.status === "suspended").length, color: "text-red-400" },
        ].map((stat, index) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.05] animate-in slide-in-from-bottom-2"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <p className="text-sm text-white/60">{stat.label}</p>
            <p className={`mt-2 font-display text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </section>

      {/* Tableau des utilisateurs */}
      <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all duration-300 hover:border-white/20">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
                      } else {
                        setSelectedUsers(new Set());
                      }
                    }}
                    className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-2 focus:ring-blue-500/50"
                  />
                </th>
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
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-white/40">
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    className="border-b border-white/5 last:border-0 transition-all duration-200 hover:bg-white/[0.02] animate-in slide-in-from-left-2"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.id)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedUsers);
                          if (e.target.checked) {
                            newSelected.add(user.id);
                          } else {
                            newSelected.delete(user.id);
                          }
                          setSelectedUsers(newSelected);
                        }}
                        className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-2 focus:ring-blue-500/50"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-white transition-transform hover:scale-110">
                          <User size={18} />
                        </div>
                        <div>
                          <p className="font-medium text-white">{user.name}</p>
                          <p className="text-sm text-white/60">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white transition-all hover:bg-white/20">
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium transition-all hover:opacity-80 ${STATUS_COLORS[user.status]}`}
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
                        <button
                          onClick={() => handleEditUser(user)}
                          className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                          title="Modifier"
                        >
                          <Edit size={16} />
                        </button>
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
                          onClick={() => handleDeleteUser(user)}
                          className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-red-400"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
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

      {/* Modal de confirmation de suppression */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setUserToDelete(null);
        }}
        title="Confirmer la suppression"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-white/80">
            Êtes-vous sûr de vouloir supprimer <span className="font-semibold text-white">{userToDelete?.name}</span> ?
          </p>
          <p className="text-sm text-white/60">Cette action est irréversible.</p>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => {
                setDeleteModalOpen(false);
                setUserToDelete(null);
              }}
              className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white/70 transition hover:bg-white/10"
            >
              Annuler
            </button>
            <button
              onClick={confirmDelete}
              className="rounded-full bg-red-500 px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-red-600"
            >
              Supprimer
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal d'édition */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingUser(null);
        }}
        title="Modifier l'utilisateur"
        size="md"
      >
        {editingUser && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">Nom</label>
              <input
                type="text"
                value={editingUser.name}
                onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-white/20 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">Email</label>
              <input
                type="email"
                value={editingUser.email}
                onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-white/20 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">Rôle</label>
              <select
                value={editingUser.role}
                onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-white/20 focus:outline-none"
              >
                <option value="admin">Admin</option>
                <option value="moderator">Modérateur</option>
                <option value="user">Utilisateur</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">Statut</label>
              <select
                value={editingUser.status}
                onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as UserStatus })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-white/20 focus:outline-none"
              >
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
                <option value="suspended">Suspendu</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setEditModalOpen(false);
                  setEditingUser(null);
                }}
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white/70 transition hover:bg-white/10"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? editingUser : u)));
                  toast(`${editingUser.name} a été modifié`, "success");
                  setEditModalOpen(false);
                  setEditingUser(null);
                }}
                className="rounded-full bg-blue-500 px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-blue-600"
              >
                Enregistrer
              </button>
            </div>
          </div>
        )}
      </Modal>
    </main>
    </>
  );
}
