"use client";

import { useState } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { Search, Filter, Download, AlertTriangle, Info, CheckCircle, XCircle, Clock, User, Settings, Shield, Calendar, FileText, Mail, X } from "lucide-react";

type LogLevel = "info" | "warning" | "error" | "success";
type LogCategory = "auth" | "user" | "content" | "system" | "api" | "email";

interface AuditLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  action: string;
  actor: string;
  actorId: string;
  target?: string;
  targetId?: string;
  details: string;
  ip?: string;
  userAgent?: string;
}

const mockLogs: AuditLog[] = [
  {
    id: "1",
    timestamp: "2024-07-26T14:30:00Z",
    level: "info",
    category: "auth",
    action: "login_success",
    actor: "admin@proday.fr",
    actorId: "admin-1",
    details: "Admin logged in successfully",
    ip: "192.168.1.100",
    userAgent: "Mozilla/5.0...",
  },
  {
    id: "2",
    timestamp: "2024-07-26T14:25:00Z",
    level: "success",
    category: "user",
    action: "user_approved",
    actor: "admin@proday.fr",
    actorId: "admin-1",
    target: "user@example.com",
    targetId: "user-123",
    details: "Beta waitlist entry approved",
    ip: "192.168.1.100",
  },
  {
    id: "3",
    timestamp: "2024-07-26T14:20:00Z",
    level: "warning",
    category: "api",
    action: "rate_limit_exceeded",
    actor: "system",
    actorId: "system",
    details: "API rate limit exceeded for IP 192.168.1.50",
    ip: "192.168.1.50",
  },
  {
    id: "4",
    timestamp: "2024-07-26T14:15:00Z",
    level: "error",
    category: "email",
    action: "email_failed",
    actor: "system",
    actorId: "system",
    target: "invalid@example",
    targetId: "email-456",
    details: "Email delivery failed: Invalid recipient address",
  },
  {
    id: "5",
    timestamp: "2024-07-26T14:10:00Z",
    level: "info",
    category: "content",
    action: "faq_updated",
    actor: "admin@proday.fr",
    actorId: "admin-1",
    target: "FAQ Item #42",
    targetId: "faq-42",
    details: "FAQ question updated",
    ip: "192.168.1.100",
  },
  {
    id: "6",
    timestamp: "2024-07-26T14:05:00Z",
    level: "success",
    category: "system",
    action: "backup_completed",
    actor: "system",
    actorId: "system",
    details: "Daily database backup completed successfully",
  },
];

const LEVEL_ICONS: Record<LogLevel, React.ElementType> = {
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
  success: CheckCircle,
};

const LEVEL_COLORS: Record<LogLevel, string> = {
  info: "text-blue-400 bg-blue-500/20",
  warning: "text-amber-400 bg-amber-500/20",
  error: "text-red-400 bg-red-500/20",
  success: "text-green-400 bg-green-500/20",
};

const LEVEL_LABELS: Record<LogLevel, string> = {
  info: "Info",
  warning: "Avertissement",
  error: "Erreur",
  success: "Succès",
};

const CATEGORY_LABELS: Record<LogCategory, string> = {
  auth: "Authentification",
  user: "Utilisateur",
  content: "Contenu",
  system: "Système",
  api: "API",
  email: "Email",
};

const CATEGORY_ICONS: Record<LogCategory, React.ElementType> = {
  auth: Shield,
  user: User,
  content: FileText,
  system: Settings,
  api: Clock,
  email: Mail,
};

export function AdminLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<LogLevel | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<LogCategory | "all">("all");
  const [logs] = useState<AuditLog[]>(mockLogs);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = levelFilter === "all" || log.level === levelFilter;
    const matchesCategory = categoryFilter === "all" || log.category === categoryFilter;
    return matchesSearch && matchesLevel && matchesCategory;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const exportLogs = () => {
    const data = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="relative mx-auto w-full max-w-7xl px-6 py-12">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-[family-name:var(--font-syne)] text-xs font-semibold uppercase tracking-[0.22em] text-[#4C8BFF]">
            Admin · Logs
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-bold text-white">
            Logs et audit trail
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/55">
            Consultez l'historique des actions système et le journal d'audit.
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
            placeholder="Rechercher dans les logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-white placeholder:text-white/40 focus:border-white/20 focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as LogLevel | "all")}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-white/20 focus:outline-none"
          >
            <option value="all">Tous les niveaux</option>
            <option value="info">Info</option>
            <option value="warning">Avertissement</option>
            <option value="error">Erreur</option>
            <option value="success">Succès</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as LogCategory | "all")}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-white/20 focus:outline-none"
          >
            <option value="all">Toutes les catégories</option>
            <option value="auth">Authentification</option>
            <option value="user">Utilisateur</option>
            <option value="content">Contenu</option>
            <option value="system">Système</option>
            <option value="api">API</option>
            <option value="email">Email</option>
          </select>
          <button
            onClick={exportLogs}
            className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <Download size={16} />
            Exporter
          </button>
        </div>
      </section>

      {/* Statistiques rapides */}
      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm text-white/60">Total logs</p>
          <p className="mt-2 font-display text-2xl font-bold text-white">{logs.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm text-white/60">Erreurs</p>
          <p className="mt-2 font-display text-2xl font-bold text-red-400">
            {logs.filter((l) => l.level === "error").length}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm text-white/60">Avertissements</p>
          <p className="mt-2 font-display text-2xl font-bold text-amber-400">
            {logs.filter((l) => l.level === "warning").length}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] P-4">
          <p className="text-sm text-white/60">Succès</p>
          <p className="mt-2 font-display text-2xl font-bold text-green-400">
            {logs.filter((l) => l.level === "success").length}
          </p>
        </div>
      </section>

      {/* Tableau des logs */}
      <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
                  Timestamp
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
                  Niveau
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
                  Catégorie
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
                  Action
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
                  Acteur
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
                  Détails
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-white/40">
                    Aucun log trouvé
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const LevelIcon = LEVEL_ICONS[log.level];
                  const CategoryIcon = CATEGORY_ICONS[log.category];
                  return (
                    <tr
                      key={log.id}
                      className="border-b border-white/5 last:border-0 cursor-pointer hover:bg-white/[0.05]"
                      onClick={() => setSelectedLog(log)}
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm text-white/80">{formatDate(log.timestamp)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${LEVEL_COLORS[log.level]}`}
                        >
                          <LevelIcon size={12} />
                          {LEVEL_LABELS[log.level]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-sm text-white/80">
                          <CategoryIcon size={14} />
                          {CATEGORY_LABELS[log.category]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-white">{log.action}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-white/70">{log.actor}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="max-w-xs truncate text-sm text-white/60">{log.details}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal de détails */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="max-w-2xl w-full rounded-2xl border border-white/10 bg-[#0a0a0a] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold text-white">Détails du log</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-white/50">Timestamp</p>
                  <p className="text-sm text-white">{formatDate(selectedLog.timestamp)}</p>
                </div>
                <div>
                  <p className="text-xs text-white/50">Niveau</p>
                  <p className="text-sm text-white">{LEVEL_LABELS[selectedLog.level]}</p>
                </div>
                <div>
                  <p className="text-xs text-white/50">Catégorie</p>
                  <p className="text-sm text-white">{CATEGORY_LABELS[selectedLog.category]}</p>
                </div>
                <div>
                  <p className="text-xs text-white/50">Action</p>
                  <p className="text-sm text-white">{selectedLog.action}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-white/50">Acteur</p>
                <p className="text-sm text-white">{selectedLog.actor} ({selectedLog.actorId})</p>
              </div>

              {selectedLog.target && (
                <div>
                  <p className="text-xs text-white/50">Cible</p>
                  <p className="text-sm text-white">
                    {selectedLog.target} ({selectedLog.targetId})
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs text-white/50">Détails</p>
                <p className="text-sm text-white">{selectedLog.details}</p>
              </div>

              {selectedLog.ip && (
                <div>
                  <p className="text-xs text-white/50">Adresse IP</p>
                  <p className="text-sm text-white">{selectedLog.ip}</p>
                </div>
              )}

              {selectedLog.userAgent && (
                <div>
                  <p className="text-xs text-white/50">User Agent</p>
                  <p className="text-sm text-white/80 break-all">{selectedLog.userAgent}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
